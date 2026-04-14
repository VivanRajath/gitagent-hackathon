'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import TemplateLibrary from './TemplateLibrary';

type ChatLog = { role: string; msg: string };

// ── SingleButton — one pill: tap = toggle, hold = PTT ────────────────────────
type SBProps = {
  editMode: boolean; recording: boolean; busy: boolean;
  onOpen: () => void; onClose: () => void;
  onPTTStart: () => void; onPTTStop: () => void;
};
function SingleButton({ editMode, recording, busy, onOpen, onClose, onPTTStart, onPTTStop }: SBProps) {
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didHold   = useRef(false);
  const HOLD_MS   = 220;

  const pressStart = useCallback(() => {
    if (!editMode) { onOpen(); return; }
    if (busy) return;
    didHold.current = false;
    holdTimer.current = setTimeout(() => { didHold.current = true; onPTTStart(); }, HOLD_MS);
  }, [editMode, busy, onOpen, onPTTStart]);

  const pressEnd = useCallback(() => {
    if (!editMode) return;
    if (holdTimer.current) { clearTimeout(holdTimer.current); holdTimer.current = null; }
    if (didHold.current) { onPTTStop(); } else if (!busy) { onClose(); }
    didHold.current = false;
  }, [editMode, busy, onClose, onPTTStop]);

  const bg     = recording ? 'rgba(16,185,129,0.18)' : busy ? 'rgba(6,182,212,0.1)'  : editMode ? 'rgba(8,8,22,0.92)' : 'rgba(8,8,22,0.88)';
  const border  = recording ? '1.5px solid #10b981'   : busy ? '1.5px solid #06b6d4'  : editMode ? '1.5px solid rgba(245,158,11,0.6)' : '1.5px solid rgba(99,102,241,0.45)';
  const color   = recording ? '#10b981' : busy ? '#06b6d4' : editMode ? '#f59e0b' : '#a5b4fc';
  const shadow  = recording ? '0 0 18px rgba(16,185,129,0.35)' : editMode ? '0 0 14px rgba(245,158,11,0.15)' : '0 0 14px rgba(99,102,241,0.15)';
  const label   = recording ? '● REC…' : busy ? '⟳ WORKING…' : editMode ? 'HOLD · SPEAK   TAP · EXIT' : '✏️  EDIT MODE';
  const dotBg   = recording ? '#10b981' : busy ? '#06b6d4' : editMode ? '#f59e0b' : 'rgba(165,180,252,0.6)';

  return (
    <button data-sv-overlay className="sv-pill"
      onMouseDown={pressStart} onMouseUp={pressEnd} onMouseLeave={pressEnd}
      onTouchStart={e => { e.preventDefault(); pressStart(); }}
      onTouchEnd={e => { e.preventDefault(); pressEnd(); }}
      style={{
        background: bg, backdropFilter: 'blur(14px)', border, borderRadius: '9999px', color,
        padding: '0.55rem 1.1rem', fontSize: '0.72rem', letterSpacing: '0.06em',
        cursor: busy ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center',
        gap: '0.45rem', boxShadow: shadow, transition: 'all 0.15s ease', userSelect: 'none',
      }}>
      <div style={{
        width: '8px', height: '8px', borderRadius: '50%', background: dotBg, flexShrink: 0,
        boxShadow: recording ? '0 0 6px #10b981' : busy ? '0 0 6px #06b6d4' : 'none',
        animation: recording ? 'sv-pulse 0.9s ease-in-out infinite' : 'none',
      }} />
      {label}
    </button>
  );
}

// MediaPipe hand connections for skeleton drawing
const HAND_CONNECTIONS = [
  [0,1],[1,2],[2,3],[3,4],       // thumb
  [0,5],[5,6],[6,7],[7,8],       // index
  [0,9],[9,10],[10,11],[11,12],  // middle
  [0,13],[13,14],[14,15],[15,16],// ring
  [0,17],[17,18],[18,19],[19,20],// pinky
  [5,9],[9,13],[13,17],          // palm
];

// ── Main component ────────────────────────────────────────────────────────────
export default function SpatialVoiceOverlay() {
  const [editMode, setEditMode]   = useState(false);
  const [recording, setRecording] = useState(false);
  const [busy, setBusy]           = useState(false);
  const [chatLogs, setChatLogs]   = useState<ChatLog[]>([]);
  const [chatOpen, setChatOpen]   = useState(false);
  const [hint, setHint]           = useState('');
  const [mpStatus, setMpStatus]   = useState<'idle'|'loading'|'ready'|'error'>('idle');
  const [handVisible, setHandVisible] = useState(false);

  const [libOpen, setLibOpen] = useState(false);
  const [libTarget, setLibTarget] = useState<HTMLElement | null>(null);
  const [libComponentType, setLibComponentType] = useState<string>('navbar');

  const videoRef      = useRef<HTMLVideoElement>(null);
  const canvasRef     = useRef<HTMLCanvasElement>(null);
  const recognizerRef = useRef<any>(null);
  const camStreamRef  = useRef<MediaStream | null>(null);
  const pttRecRef     = useRef<any>(null);
  const passiveRef    = useRef<any>(null);
  const busyRef       = useRef(false);
  const holdingRef    = useRef(false);
  const chatEndRef    = useRef<HTMLDivElement | null>(null);

  // All gesture state lives in refs to avoid stale closure issues
  const lastYRef        = useRef<number | null>(null);
  const smoothScrollRef = useRef(0);
  const handVisibleRef  = useRef(false);
  const rafIdRef        = useRef(0);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatLogs]);
  useEffect(() => { setEditMode(new URLSearchParams(window.location.search).get('edit') === '1'); }, []);

  const addLog = (role: string, msg: string) =>
    setChatLogs(prev => [...prev.slice(-39), { role, msg }]);

  const openEditMode  = () => { const u = new URL(window.location.href); u.searchParams.set('edit', '1'); window.location.href = u.toString(); };
  const closeEditMode = () => { const u = new URL(window.location.href); u.searchParams.delete('edit'); window.location.href = u.toString(); };

  // ── MediaPipe loader ─────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined' || !editMode) return;
    if ((window as any).__svGestureRecognizer) {
      recognizerRef.current = (window as any).__svGestureRecognizer;
      setMpStatus('ready');
      return;
    }
    setMpStatus('loading');
    const script = document.createElement('script');
    script.type = 'module';
    script.textContent = `
      (async () => {
        try {
          const { FilesetResolver, GestureRecognizer } = await import(
            'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs'
          );
          const fileset = await FilesetResolver.forVisionTasks(
            'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
          );
          const recognizer = await GestureRecognizer.createFromOptions(fileset, {
            baseOptions: {
              modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task',
              delegate: 'GPU',
            },
            runningMode: 'VIDEO',
            numHands: 1,
          });
          window.__svGestureRecognizer = recognizer;
          window.dispatchEvent(new CustomEvent('sv-mp-ready'));
        } catch (err) {
          window.dispatchEvent(new CustomEvent('sv-mp-error', { detail: err?.message || String(err) }));
        }
      })();
    `;
    const onReady = () => {
      recognizerRef.current = (window as any).__svGestureRecognizer;
      setMpStatus('ready');
      setHint('✋ Hand tracking ready — swipe up/down to scroll');
    };
    const onError = (e: any) => { setMpStatus('error'); setHint('Gesture error: ' + String(e.detail).slice(0, 60)); };
    window.addEventListener('sv-mp-ready', onReady);
    window.addEventListener('sv-mp-error', onError as EventListener);
    document.head.appendChild(script);
    return () => {
      window.removeEventListener('sv-mp-ready', onReady);
      window.removeEventListener('sv-mp-error', onError as EventListener);
    };
  }, [editMode]);

  // ── Camera + Canvas skeleton loop ─────────────────────────────────────────
  useEffect(() => {
    if (mpStatus !== 'ready' || !editMode) return;
    let lastVideoTime = -1;
    let cancelled = false;

    const drawSkeleton = (landmarks: any[], canvas: HTMLCanvasElement) => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const W = canvas.width;
      const H = canvas.height;

      // Map normalized (0-1) coords to canvas. X is mirrored (selfie cam)
      const px = (lm: any) => ((1 - lm.x) * W);
      const py = (lm: any) => (lm.y * H);

      // Draw connections (skeleton)
      ctx.strokeStyle = 'rgba(16,185,129,0.75)';
      ctx.lineWidth = 2;
      for (const [a, b] of HAND_CONNECTIONS) {
        ctx.beginPath();
        ctx.moveTo(px(landmarks[a]), py(landmarks[a]));
        ctx.lineTo(px(landmarks[b]), py(landmarks[b]));
        ctx.stroke();
      }

      // Draw landmark dots
      for (let i = 0; i < landmarks.length; i++) {
        const lm = landmarks[i];
        const x = px(lm);
        const y = py(lm);
        const isFingerTip = [4, 8, 12, 16, 20].includes(i);
        ctx.beginPath();
        ctx.arc(x, y, isFingerTip ? 6 : 3.5, 0, Math.PI * 2);
        ctx.fillStyle = isFingerTip ? '#f59e0b' : '#10b981';
        ctx.shadowColor = isFingerTip ? '#f59e0b' : '#10b981';
        ctx.shadowBlur = isFingerTip ? 12 : 6;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Index fingertip coordinate label
        if (i === 8) {
          ctx.font = 'bold 11px ui-monospace, monospace';
          ctx.fillStyle = '#10b981';
          ctx.strokeStyle = 'rgba(0,0,0,0.8)';
          ctx.lineWidth = 3;
          const label = `X:${lm.x.toFixed(3)} Y:${lm.y.toFixed(3)}`;
          ctx.strokeText(label, x + 10, y - 10);
          ctx.fillText(label, x + 10, y - 10);
        }
      }
    };

    const startCam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' },
        });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        camStreamRef.current = stream;
        const vid = videoRef.current;
        if (vid) {
          vid.srcObject = stream;
          vid.play().catch(() => {});
          vid.addEventListener('loadeddata', startLoop, { once: true });
        }
      } catch {
        setHint('Camera blocked — allow camera access.');
      }
    };

    const startLoop = () => {
      if (cancelled) return;
      loop();
    };

    const loop = () => {
      if (cancelled) { return; }
      rafIdRef.current = requestAnimationFrame(loop);

      const vid = videoRef.current;
      const canvas = canvasRef.current;
      if (!vid || !canvas || !recognizerRef.current) return;
      if (vid.readyState < 2) return;
      if (vid.currentTime === lastVideoTime) return;
      lastVideoTime = vid.currentTime;

      try {
        const results = recognizerRef.current.recognizeForVideo(vid, Date.now());
        const landmarks = results.landmarks;
        const hasHand = landmarks && landmarks.length > 0;

        if (hasHand) {
          drawSkeleton(landmarks[0], canvas);

          // Scroll using index fingertip Y (landmark 8) — inverted (finger up = scroll down)
          const y = landmarks[0][8].y;
          if (lastYRef.current !== null) {
            const dy = y - lastYRef.current;
            const raw = -dy * 3000; // invert: up = negative dy = positive scroll
            smoothScrollRef.current = smoothScrollRef.current * 0.7 + raw * 0.3;
            if (Math.abs(smoothScrollRef.current) > 2) {
              window.scrollBy({ top: smoothScrollRef.current, behavior: 'auto' });
            }
          }
          lastYRef.current = y;

          if (!handVisibleRef.current) {
            handVisibleRef.current = true;
            setHandVisible(true);
          }
        } else {
          // Clear canvas when no hand
          const ctx = canvas.getContext('2d');
          if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Coast to stop
          smoothScrollRef.current *= 0.6;
          if (Math.abs(smoothScrollRef.current) > 1) {
            window.scrollBy({ top: smoothScrollRef.current, behavior: 'auto' });
          } else {
            smoothScrollRef.current = 0;
          }
          lastYRef.current = null;

          if (handVisibleRef.current) {
            handVisibleRef.current = false;
            setHandVisible(false);
          }
        }
      } catch { /* ignore per-frame errors */ }
    };

    startCam();
    return () => {
      cancelled = true;
      cancelAnimationFrame(rafIdRef.current);
      camStreamRef.current?.getTracks().forEach(t => t.stop());
      camStreamRef.current = null;
      // Clear canvas
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx && canvasRef.current) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    };
  }, [mpStatus, editMode]);

  // ── Push-to-talk ─────────────────────────────────────────────────────────
  const sendCommand = useCallback((payload: string, label: string) => {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true);
    addLog('YOU', label); setChatOpen(true);
    setTimeout(() => addLog('ORCHESTRATOR', 'Routing…'), 350);
    fetch('http://localhost:3002/command', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: payload }),
    })
      .then(() => addLog('JNR-DEV', 'Done!'))
      .catch(() => addLog('SYS', 'Agent unreachable'))
      .finally(() => setTimeout(() => { busyRef.current = false; setBusy(false); }, 2000));
  }, []);

  const startPTT = useCallback(() => {
    if (holdingRef.current || busy) return;
    holdingRef.current = true; setRecording(true);
    try { passiveRef.current?.stop(); } catch {}
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setHint('Voice API not supported'); holdingRef.current = false; setRecording(false); return; }
    const rec = new SR();
    rec.continuous = false; rec.interimResults = false; rec.lang = 'en-US';
    pttRecRef.current = rec;

    rec.onresult = (ev: any) => {
      const result = ev.results[0][0];
      const transcript = result.transcript.trim();
      if (result.confidence < 0.45) { setHint("Didn't catch that — try again"); return; }
      const t = transcript.toLowerCase();

      if (t.includes('scroll down'))                                          { window.scrollBy({ top: 400, behavior: 'smooth' }); addLog('YOU', 'Scroll ↓'); return; }
      if (t.includes('scroll up'))                                            { window.scrollBy({ top: -400, behavior: 'smooth' }); addLog('YOU', 'Scroll ↑'); return; }
      if (t.includes('scroll to top') || t.includes('go to top'))            { window.scrollTo({ top: 0, behavior: 'smooth' }); addLog('YOU', '↑ Top'); return; }
      if (t.includes('scroll to bottom') || t.includes('go to bottom'))      { window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }); addLog('YOU', '↓ Bottom'); return; }
      if (t.includes('exit edit') || (t.includes('exit') && t.includes('editor'))) { closeEditMode(); return; }

      sendCommand(transcript, transcript);
    };

    rec.onerror = (ev: any) => {
      if (ev.error === 'no-speech')   setHint('No speech detected');
      else if (ev.error === 'not-allowed') setHint('Mic blocked — click 🔒 to allow.');
      else if (ev.error !== 'aborted')     setHint('Mic error: ' + ev.error);
    };
    rec.onend = () => {
      holdingRef.current = false; setRecording(false); pttRecRef.current = null;
      try { passiveRef.current?.start(); } catch {}
    };
    try { rec.start(); } catch { holdingRef.current = false; setRecording(false); }
  }, [busy, sendCommand]);

  const stopPTT = useCallback(() => {
    holdingRef.current = false;
    try { pttRecRef.current?.stop(); } catch {}
    setRecording(false);
  }, []);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat && editMode) { e.preventDefault(); startPTT(); }
      if (e.key === 'Escape' && editMode) { closeEditMode(); setLibOpen(false); }
    };
    const onUp = (e: KeyboardEvent) => { if (e.code === 'Space' && editMode) stopPTT(); };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => { window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp); };
  }, [editMode, startPTT, stopPTT]);

  // ── Double-click to open TemplateLibrary ─────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined' || !editMode || busy) return;
    const onDblClick = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      if (el.closest('[data-sv-overlay]')) return;
      const STRUCTURAL = ['NAV', 'SECTION', 'HEADER', 'FOOTER', 'ARTICLE', 'MAIN'];
      let cur: HTMLElement | null = el;
      while (cur && cur !== document.body) {
        if (STRUCTURAL.includes(cur.tagName)) {
          let type = 'features';
          if (cur.tagName === 'NAV' || cur.querySelector('nav')) type = 'navbar';
          else if (cur.tagName === 'FOOTER' || cur.tagName === 'HEADER') type = 'footer';
          else if (cur.querySelector('h1')) type = 'hero';
          else if (cur.querySelector('button')) type = 'cta';
          else type = 'cards';
          setLibTarget(cur);
          setLibComponentType(type);
          setLibOpen(true);
          return;
        }
        cur = cur.parentElement;
      }
    };
    window.addEventListener('dblclick', onDblClick);
    return () => window.removeEventListener('dblclick', onDblClick);
  }, [editMode, busy]);

  // Hint auto-clear
  useEffect(() => {
    if (!hint) return;
    const t = setTimeout(() => setHint(''), 5000);
    return () => clearTimeout(t);
  }, [hint]);

  // Canvas size matches viewport
  const [vpSize, setVpSize] = useState({ w: 1280, h: 720 });
  useEffect(() => {
    const update = () => setVpSize({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return (
    <>
      <style>{`
        @keyframes sv-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.5)} }
        @keyframes sv-in    { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        .sv-pill:hover { opacity:.85 }
      `}</style>

      {/* Hidden video feed — MediaPipe reads this, not visible */}
      <video ref={videoRef} autoPlay playsInline muted aria-hidden="true"
        style={{ position: 'fixed', left: '-9999px', width: '1px', height: '1px' }} />

      {/* Full-viewport canvas for skeleton — only visible in edit mode */}
      {editMode && (
        <canvas
          ref={canvasRef}
          width={vpSize.w}
          height={vpSize.h}
          style={{
            position: 'fixed', inset: 0, zIndex: 99990, pointerEvents: 'none',
            width: '100vw', height: '100vh',
          }}
        />
      )}

      {/* PiP camera preview — bottom-right */}
      {editMode && mpStatus === 'ready' && (
        <div data-sv-overlay style={{
          position: 'fixed', bottom: '6.5rem', right: '1.5rem', zIndex: 99991,
          borderRadius: '0.6rem', overflow: 'hidden', border: '1px solid rgba(16,185,129,0.4)',
          boxShadow: '0 0 20px rgba(16,185,129,0.15)',
          width: '120px', height: '90px',
        }}>
          <video
            srcObject={camStreamRef.current}
            autoPlay playsInline muted
            style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
          />
          <div style={{
            position: 'absolute', top: '4px', left: '4px',
            background: 'rgba(0,0,0,0.7)', borderRadius: '3px',
            padding: '1px 5px', fontSize: '8px', color: handVisible ? '#10b981' : '#94a3b8',
            fontFamily: 'ui-monospace, monospace', fontWeight: 700,
          }}>
            {handVisible ? '✋ HAND' : '👁 TRACKING'}
          </div>
        </div>
      )}

      {/* ── Main overlay panel — fixed bottom-right ── */}
      <div data-sv-overlay style={{
        position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 99999,
        display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.45rem',
        fontFamily: 'ui-monospace,monospace', pointerEvents: 'none',
        maxWidth: 'min(22rem,92vw)',
      }}>

        {/* Agent chat log */}
        {chatOpen && chatLogs.length > 0 && (
          <div data-sv-overlay style={{
            background: 'rgba(3,3,14,0.95)', border: '1px solid rgba(255,255,255,0.09)',
            borderRadius: '0.8rem', backdropFilter: 'blur(20px)',
            width: '100%', maxHeight: '11rem', overflowY: 'auto',
            padding: '0.65rem', display: 'flex', flexDirection: 'column', gap: '0.35rem',
            color: '#fff', fontSize: '0.73rem', lineHeight: 1.5,
            animation: 'sv-in 0.2s ease-out', pointerEvents: 'auto',
          }}>
            {chatLogs.map((l, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.35rem', alignItems: 'flex-start' }}>
                <b style={{
                  flexShrink: 0, color:
                    l.role === 'YOU' ? '#10b981' : l.role === 'SNR-DEV' ? '#06b6d4' :
                    l.role === 'ORCHESTRATOR' ? '#a78bfa' : l.role === 'JNR-DEV' ? '#4ade80' : '#94a3b8',
                }}>[{l.role}]</b>
                <span style={{ opacity: 0.85, wordBreak: 'break-word' }}>{l.msg}</span>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
        )}

        {/* Hint toast */}
        {hint && (
          <div data-sv-overlay style={{
            background: 'rgba(0,0,0,0.82)', borderRadius: '0.4rem',
            padding: '0.28rem 0.65rem', color: '#fcd34d', fontSize: '0.7rem',
            animation: 'sv-in 0.15s ease-out', pointerEvents: 'none',
            maxWidth: '100%', textAlign: 'right',
          }}>
            {hint}
          </div>
        )}

        {/* Single smart button */}
        <div data-sv-overlay style={{ pointerEvents: 'auto', alignSelf: 'flex-end' }}>
          <SingleButton
            editMode={editMode} recording={recording} busy={busy}
            onOpen={openEditMode} onClose={closeEditMode}
            onPTTStart={startPTT} onPTTStop={stopPTT}
          />
        </div>

        {/* Status row */}
        {editMode && (
          <div data-sv-overlay style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            justifyContent: 'flex-end', pointerEvents: 'none',
          }}>
            {chatLogs.length > 0 && (
              <button data-sv-overlay onClick={() => setChatOpen(v => !v)} style={{
                background: 'none', border: 'none', cursor: 'pointer', pointerEvents: 'auto',
                fontSize: '0.58rem', color: 'rgba(255,255,255,0.3)', padding: 0,
              }}>
                {chatOpen ? '▾' : '▴'} {chatLogs.length} logs
              </button>
            )}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.28rem',
              fontSize: '0.55rem',
              color: mpStatus === 'ready' ? (handVisible ? '#f59e0b' : '#10b981') : mpStatus === 'loading' ? '#06b6d4' : '#94a3b8',
              opacity: 0.85,
            }}>
              <div style={{
                width: '5px', height: '5px', borderRadius: '50%',
                background: mpStatus === 'ready' ? (handVisible ? '#f59e0b' : '#10b981') : mpStatus === 'loading' ? '#06b6d4' : '#94a3b8',
                boxShadow: mpStatus === 'ready' ? `0 0 5px ${handVisible ? '#f59e0b' : '#10b981'}` : 'none',
                animation: mpStatus === 'loading' ? 'sv-pulse 1s ease-in-out infinite' : mpStatus === 'ready' ? 'sv-pulse 1.8s ease-in-out infinite' : 'none',
              }} />
              {mpStatus === 'loading' ? 'LOADING MP…' : mpStatus === 'ready' ? (handVisible ? 'SCROLLING' : 'HAND TRACKING') : mpStatus === 'error' ? 'MP ERROR' : ''}
            </div>
          </div>
        )}

        {/* Loading tip */}
        {editMode && mpStatus === 'loading' && (
          <div data-sv-overlay style={{
            fontSize: '0.57rem', color: 'rgba(255,255,255,0.2)', textAlign: 'right',
            lineHeight: 1.8, pointerEvents: 'none',
          }}>
            Loading hand tracking… (first load ~5s)<br />
            Swipe finger up/down to scroll
          </div>
        )}
      </div>

      {libOpen && (
        <TemplateLibrary
          pinnedElement={libTarget}
          componentType={libComponentType}
          onClose={() => setLibOpen(false)}
        />
      )}
    </>
  );
}
