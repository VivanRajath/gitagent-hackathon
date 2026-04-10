'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
type ChatLog = { role: string; msg: string };
export default function SpatialVoiceOverlay() {
  const [editMode, setEditMode] = useState(false);
  useEffect(() => { setEditMode(new URLSearchParams(window.location.search).get('edit')==='1'); }, []);
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [chatLogs, setChatLogs] = useState<ChatLog[]>([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [pinchedText, setPinchedText] = useState<string | null>(null);
  const [showPinchMenu, setShowPinchMenu] = useState(false);
  const [hint, setHint] = useState('');
  const [showColorSlider, setShowColorSlider] = useState(false);
  const [colorHue, setColorHue] = useState(0);
  const [mpLoaded, setMpLoaded] = useState(false);
  const videoRef = useRef<any>(null);
  const recognizerRef = useRef<any>(null);
  const camStreamRef = useRef<any>(null);
  const lastGestureRef = useRef<string>('');
  const pttRecRef = useRef<any>(null);
  const passiveRef = useRef<any>(null);
  const pinchedElRef = useRef<HTMLElement | null>(null);
  const busyRef = useRef(false);
  const holdingRef = useRef(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const editModeRef = useRef(false);
  useEffect(() => { editModeRef.current = editMode; }, [editMode]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatLogs]);
  const addLog = (role: string, msg: string) => setChatLogs(prev => [...prev.slice(-39), { role, msg }]);
  const openEditMode  = () => { const u=new URL(window.location.href); u.searchParams.set('edit','1'); window.location.href=u.toString(); };
  const closeEditMode = () => { const u=new URL(window.location.href); u.searchParams.delete('edit'); window.location.href=u.toString(); };
  const clearPinch = useCallback(() => {
    if (pinchedElRef.current) Object.assign(pinchedElRef.current.style, { outline:'', boxShadow:'', transform:'', transition:'' });
    pinchedElRef.current = null; setPinchedText(null); setShowPinchMenu(false);
  }, []);
  const selectElement = useCallback((el: HTMLElement) => {
    if (pinchedElRef.current && pinchedElRef.current !== el)
      Object.assign(pinchedElRef.current.style, { outline:'', boxShadow:'', transform:'' });
    pinchedElRef.current = el;
    setPinchedText(el.innerText.trim().slice(0, 80));
    setShowPinchMenu(false);
    Object.assign(el.style, { outline:'3px solid #f59e0b', boxShadow:'0 0 18px rgba(245,158,11,0.8),0 0 40px rgba(245,158,11,0.3)', transform:'scale(1.02)', transition:'all 0.18s ease' });
  }, []);
  const sendCommand = useCallback((payload: string, label: string) => {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true); setShowPinchMenu(false); setShowColorSlider(false);
    addLog('YOU', label); setChatOpen(true);
    setTimeout(() => addLog('ORCHESTRATOR', 'Routing intent…'), 350);
    setTimeout(() => addLog('SNR-DEV', 'Applying edit…'), 950);
    fetch('http://localhost:3002/command', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ prompt: payload }) })
      .then(() => { addLog('JNR-DEV', 'Done!'); clearPinch(); })
      .catch(() => addLog('SYS', 'Agent unreachable.'))
      .finally(() => setTimeout(() => { busyRef.current = false; setBusy(false); }, 2000));
  }, [clearPinch]);

  // ── MediaPipe: load via native <script type="module"> to fully bypass webpack ──
  useEffect(() => {
    if (typeof window === 'undefined' || !editMode) return;
    if ((window as any).__svGestureRecognizer) {
      recognizerRef.current = (window as any).__svGestureRecognizer;
      setMpLoaded(true);
      return;
    }
    const script = document.createElement('script');
    script.type = 'module';
    script.textContent = `
      (async () => {
        try {
          const { FilesetResolver, GestureRecognizer } = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs');
          const fileset = await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm');
          const recognizer = await GestureRecognizer.createFromOptions(fileset, {
            baseOptions: { modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task', delegate: 'GPU' },
            runningMode: 'VIDEO', numHands: 1,
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
      setMpLoaded(true);
      setHint('✌️ Gesture tracking ready!');
    };
    const onError = (e: any) => { setHint('Gesture load error: ' + String(e.detail).slice(0, 60)); };
    window.addEventListener('sv-mp-ready', onReady);
    window.addEventListener('sv-mp-error', onError as any);
    setHint('Loading gesture model…');
    document.head.appendChild(script);
    return () => {
      window.removeEventListener('sv-mp-ready', onReady);
      window.removeEventListener('sv-mp-error', onError as any);
    };
  }, [editMode]);

  // ── Camera feed + gesture recognition loop ──
  useEffect(() => {
    if (!mpLoaded || !editMode) return;
    let reqId = 0; let lastVideoTime = -1; let cancelled = false;
    let activeHue = 0; let lastHueState = 0;
    const startCam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240, facingMode: 'user' } });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        camStreamRef.current = stream;
        const vid = videoRef.current;
        if (vid) {
          vid.srcObject = stream;
          vid.onloadeddata = () => { if (!cancelled) { setHint('🎥 Camera actively tracking hands'); loop(); } };
        }
      } catch { setHint('Camera blocked — allow camera in browser settings.'); }
    };
    const loop = () => {
      if (cancelled || !recognizerRef.current || !videoRef.current) return;
      const vid = videoRef.current;
      if (vid.readyState >= 2 && vid.currentTime !== lastVideoTime) {
        lastVideoTime = vid.currentTime;
        try {
          const results = recognizerRef.current.recognizeForVideo(vid, Date.now());
          if (results.gestures && results.gestures.length > 0) {
            const cat = results.gestures[0][0].categoryName;
            
            // Map physical hand position to color hue when peace sign is active
            if (cat === 'Victory') {
              if (lastGestureRef.current !== 'Victory') {
                setShowColorSlider(true);
                setHint('✌️ Peace sign detected! Move hand left/right to shift hue.');
              }
              const x = results.landmarks[0][0].x; 
              // x is 0.0 to 1.0. Multiply by 360 to get a degree on the color wheel
              activeHue = Math.floor(Math.max(0, Math.min(1, x)) * 360);
              document.documentElement.style.filter = `hue-rotate(${activeHue}deg)`;
              
              // Only trigger react re-render if enough delta has passed (prevents UI lagging)
              if (Math.abs(lastHueState - activeHue) > 5) {
                 lastHueState = activeHue;
                 setColorHue(activeHue);
              }
            } else if (lastGestureRef.current === 'Victory') {
              // They closed their hand or put it down! Commit the color!
              document.documentElement.style.filter = '';
              setShowColorSlider(false);
              sendCommand(`[GLOBAL-COLOR-CHANGE hue=${activeHue}] Shift the theme primary and secondary colours by rotating hue ${activeHue}deg on the colour wheel`, '✌️ Gesture color committed');
              setHint('🎨 Color applied!');
            }
            lastGestureRef.current = cat;
          }
        } catch {}
      }
      reqId = requestAnimationFrame(loop);
    };
    startCam();
    return () => {
      cancelled = true; cancelAnimationFrame(reqId);
      if (camStreamRef.current) { camStreamRef.current.getTracks().forEach((t:any) => t.stop()); camStreamRef.current = null; }
    };
  }, [mpLoaded, editMode, sendCommand]);

  // ── Push-to-talk (hold mic button / spacebar) ──
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
      if (t.includes('scroll down'))   { window.scrollBy({ top: 350, behavior: 'smooth' }); addLog('YOU', 'Scroll ↓'); return; }
      if (t.includes('scroll up'))     { window.scrollBy({ top: -350, behavior: 'smooth' }); addLog('YOU', 'Scroll ↑'); return; }
      if (t.includes('scroll to top') || t.includes('go to top'))       { window.scrollTo({ top: 0, behavior: 'smooth' }); addLog('YOU', '↑ Top'); return; }
      if (t.includes('scroll to bottom') || t.includes('go to bottom')) { window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }); addLog('YOU', '↓ Bottom'); return; }
      if (t.includes('clear selection') || t.includes('deselect')) { clearPinch(); addLog('SYS', 'Selection cleared'); return; }
      if (t.includes('exit edit mode') || (t.includes('exit') && t.includes('editor'))) { closeEditMode(); return; }
      const payload = pinchedElRef.current
        ? `[PINCH-EDIT context="${pinchedElRef.current.innerText.trim().slice(0, 100)}"] ${transcript}`
        : transcript;
      sendCommand(payload, transcript);
    };
    rec.onerror = (ev: any) => {
      if (ev.error === 'no-speech') setHint('No speech detected');
      else if (ev.error === 'not-allowed') setHint('Mic blocked — click 🔒 to allow.');
      else if (ev.error !== 'aborted') setHint('Mic error: ' + ev.error);
    };
    rec.onend = () => {
      holdingRef.current = false; setRecording(false); pttRecRef.current = null;
      try { passiveRef.current?.start(); } catch {}
    };
    try { rec.start(); } catch { holdingRef.current = false; setRecording(false); try { passiveRef.current?.start(); } catch {} }
  }, [busy, sendCommand, clearPinch]);
  const stopPTT = useCallback(() => {
    holdingRef.current = false;
    if (pttRecRef.current) { try { pttRecRef.current.stop(); } catch {} }
    setRecording(false);
  }, []);
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => { if (e.code === 'Space' && !e.repeat && editMode) { e.preventDefault(); startPTT(); } if (e.key === 'Escape') clearPinch(); };
    const onUp   = (e: KeyboardEvent) => { if (e.code === 'Space' && editMode) stopPTT(); };
    window.addEventListener('keydown', onDown); window.addEventListener('keyup', onUp);
    return () => { window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp); };
  }, [editMode, startPTT, stopPTT, clearPinch]);

  // ── Touch / mouse gesture handlers (scroll, pinch, swipe, select) ──
  useEffect(() => {
    if (typeof window === 'undefined' || !editMode) return;
    let downX = 0, downY = 0, downAt = 0, t0dist = 0, t0midY = 0, twoFinger = false;
    const onMouseDown = (e: MouseEvent) => {
      downX = e.clientX; downY = e.clientY; downAt = Date.now();
      const el = e.target as HTMLElement;
      if (el.closest('[data-sv-overlay]')) return;
      if (el.innerText?.trim()) selectElement(el);
    };
    const onMouseUp = (e: MouseEvent) => {
      if (busyRef.current) return;
      const dx = e.clientX - downX, dy = e.clientY - downY, dt = Date.now() - downAt;
      if (Math.abs(dx) > 130 && Math.abs(dy) < 70 && dt < 500)
        sendCommand(dx > 0 ? '[SWIPE-RIGHT] Change to the next theme variant' : '[SWIPE-LEFT] Revert to the previous theme', dx > 0 ? 'Swipe Right → Next Theme' : 'Swipe Left → Revert');
    };
    const onDblClick = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      if (el.closest('[data-sv-overlay]') || busyRef.current) return;
      if (el.innerText?.trim()) sendCommand(`[DELETE-NODE context="${el.innerText.trim().slice(0, 100)}"] Delete this element`, 'Double-click → Delete');
    };
    const onTouchStart = (e: TouchEvent) => {
      downAt = Date.now();
      if (e.touches.length === 1) {
        twoFinger = false; downX = e.touches[0].clientX; downY = e.touches[0].clientY;
        const el = e.target as HTMLElement;
        if (!el.closest('[data-sv-overlay]') && el.innerText?.trim()) selectElement(el);
      } else if (e.touches.length === 2) {
        twoFinger = true;
        const [a, b] = [e.touches[0], e.touches[1]];
        t0dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
        t0midY = (a.clientY + b.clientY) / 2;
      }
    };
    // Two-finger: scroll + pinch detection
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 2) return;
      twoFinger = true;
      const [a, b] = [e.touches[0], e.touches[1]];
      const midY = (a.clientY + b.clientY) / 2;
      // Two-finger scroll
      window.scrollBy({ top: (t0midY - midY) * 1.8 }); t0midY = midY;
      // Pinch detection
      if (!busyRef.current) {
        const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), ratio = dist / t0dist;
        if (Math.abs(ratio - 1) > 0.3) {
           t0dist = dist;
           if (pinchedElRef.current) {
             setShowPinchMenu(true);
             setHint('Pinch detected — choose an action');
           } else {
             sendCommand(ratio > 1 ? '[PINCH-OUT] Increase size of selected section' : '[PINCH-IN] Decrease size of selected section', ratio > 1 ? 'Pinch Out → Enlarge' : 'Pinch In → Shrink');
           }
        }
      }
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (twoFinger || busyRef.current) return;
      const ch = e.changedTouches[0], dx = ch.clientX - downX, dy = ch.clientY - downY, dt = Date.now() - downAt;
      if (Math.abs(dx) > 100 && Math.abs(dy) < 60 && dt < 450)
        sendCommand(dx > 0 ? '[SWIPE-RIGHT] Change to the next theme variant' : '[SWIPE-LEFT] Revert to the previous theme', dx > 0 ? 'Swipe Right → Next Theme' : 'Swipe Left → Revert');
    };
    window.addEventListener('mousedown', onMouseDown); window.addEventListener('mouseup', onMouseUp); window.addEventListener('dblclick', onDblClick);
    window.addEventListener('touchstart', onTouchStart, { passive: true }); window.addEventListener('touchmove', onTouchMove, { passive: true }); window.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('mousedown', onMouseDown); window.removeEventListener('mouseup', onMouseUp); window.removeEventListener('dblclick', onDblClick);
      window.removeEventListener('touchstart', onTouchStart); window.removeEventListener('touchmove', onTouchMove); window.removeEventListener('touchend', onTouchEnd);
    };
  }, [editMode, selectElement, sendCommand]);
  useEffect(() => { if (!hint) return; const t = setTimeout(() => setHint(''), 4000); return () => clearTimeout(t); }, [hint]);
  return (
    <>
      <style>{`
        @keyframes sv-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.5)} }
        @keyframes sv-in    { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .sv-pill:hover{opacity:.85}
        .sv-menu-btn { display:block; width:100%; text-align:left; padding:0.4rem 0.6rem; border:none; background:transparent; color:#fff; cursor:pointer; border-radius:0.3rem; font-size:0.78rem }
        .sv-menu-btn:hover { background:rgba(255,255,255,0.1) }
      `}</style>
      <video ref={videoRef} autoPlay playsInline muted data-sv-overlay style={{position:'fixed',bottom:'6rem',right:'1.5rem',width:'160px',height:'120px',borderRadius:'0.6rem',border:'2px solid rgba(16,185,129,0.5)',objectFit:'cover',zIndex:9998,display:editMode&&mpLoaded?'block':'none',opacity:0.85,boxShadow:'0 0 24px rgba(16,185,129,0.35)'}} />
      <div data-sv-overlay style={{position:'fixed',bottom:'1.5rem',right:'1.5rem',zIndex:9999,display:'flex',flexDirection:'column',alignItems:'flex-end',gap:'0.5rem',fontFamily:'ui-monospace,monospace',pointerEvents:'none'}}>
        {showColorSlider && (
           <div data-sv-overlay style={{background:'rgba(16,185,129,0.15)',border:'1px solid #10b981',borderRadius:'0.8rem',backdropFilter:'blur(20px)',width:'21rem',padding:'1rem',display:'flex',flexDirection:'column',gap:'0.5rem',color:'#fff',animation:'sv-in 0.2s ease-out',pointerEvents:'auto'}}>
             <div style={{fontSize:'0.8rem',fontWeight:'bold',color:'#10b981'}}>✌️ PEACE SIGN — COLOR SLIDER</div>
             <div style={{fontSize:'0.7rem',opacity:0.7}}>Move your hand left/right to shift hue. Close hand to apply.</div>
             <input type="range" min="0" max="360" value={colorHue} readOnly style={{width:'100%',accentColor:'#10b981',height:'2rem', pointerEvents: 'none'}} />
           </div>
        )}
        {showPinchMenu && pinchedElRef.current && (
           <div data-sv-overlay style={{background:'rgba(3,3,14,0.95)',border:'1px solid rgba(245,158,11,0.5)',borderRadius:'0.8rem',backdropFilter:'blur(20px)',width:'14rem',padding:'0.5rem',display:'flex',flexDirection:'column',color:'#fff',fontSize:'0.8rem',animation:'sv-in 0.2s ease-out',pointerEvents:'auto'}}>
             <div style={{color:'#f59e0b',fontSize:'0.7rem',marginBottom:'0.3rem',paddingLeft:'0.2rem'}}>PINCH — EDIT COMPONENT</div>
             <button className="sv-menu-btn" onClick={() => sendCommand(`[PINCH-EDIT context="${pinchedElRef.current?.innerText.trim().slice(0, 100)}"] Rewrite the text for this element to be more engaging`, 'Pinch → Edit Text')}>📝 Edit Text</button>
             <button className="sv-menu-btn" onClick={() => sendCommand(`[PINCH-EDIT context="${pinchedElRef.current?.innerText.trim().slice(0, 100)}"] Completely redesign the visual layout of this block`, 'Pinch → Redesign')}>🖼 Redesign Block</button>
             <button className="sv-menu-btn" onClick={() => sendCommand(`[PINCH-EDIT context="${pinchedElRef.current?.innerText.trim().slice(0, 100)}"] Change the background or font color of this element to pop out`, 'Pinch → Change Color')}>🎨 Change Color</button>
             <button className="sv-menu-btn" onClick={() => clearPinch()} style={{color:'#fca5a5',marginTop:'0.2rem'}}>✕ Cancel</button>
           </div>
        )}
        {chatOpen && chatLogs.length > 0 && (
          <div data-sv-overlay style={{background:'rgba(3,3,14,0.95)',border:'1px solid rgba(255,255,255,0.09)',borderRadius:'0.8rem',backdropFilter:'blur(20px)',width:'21rem',maxHeight:'13rem',overflowY:'auto',padding:'0.65rem',display:'flex',flexDirection:'column',gap:'0.4rem',color:'#fff',fontSize:'0.75rem',lineHeight:1.5,animation:'sv-in 0.2s ease-out',pointerEvents:'auto'}}>
            {chatLogs.map((l,i) => (
              <div key={i} style={{display:'flex',gap:'0.35rem',alignItems:'flex-start'}}>
                <b style={{flexShrink:0,color:l.role==='YOU'?'#10b981':l.role==='SNR-DEV'?'#06b6d4':l.role==='ORCHESTRATOR'?'#a78bfa':l.role==='JNR-DEV'?'#4ade80':'#f59e0b'}}>[{l.role}]</b>
                <span style={{opacity:0.85,wordBreak:'break-word'}}>{l.msg}</span>
              </div>
            ))}
            <div ref={chatEndRef}/>
          </div>
        )}
        {pinchedText && !showPinchMenu && (<div data-sv-overlay style={{background:'rgba(245,158,11,0.1)',border:'1px solid rgba(245,158,11,0.4)',borderRadius:'0.45rem',padding:'0.3rem 0.65rem',color:'#f59e0b',fontSize:'0.7rem',maxWidth:'21rem',animation:'sv-in 0.15s ease-out',pointerEvents:'none'}}>SELECTED: &ldquo;{pinchedText.slice(0,45)}{pinchedText.length>45?'…':''}&rdquo;</div>)}
        {hint && (<div data-sv-overlay style={{background:'rgba(0,0,0,0.75)',borderRadius:'0.4rem',padding:'0.3rem 0.7rem',color:'#fcd34d',fontSize:'0.7rem',animation:'sv-in 0.15s ease-out',pointerEvents:'none'}}>{hint}</div>)}
        <div data-sv-overlay style={{display:'flex',alignItems:'center',gap:'0.5rem',pointerEvents:'auto'}}>
          {!editMode ? (
            <button className="sv-pill" onClick={openEditMode} style={{background:'rgba(3,3,14,0.88)',backdropFilter:'blur(14px)',border:'1px solid rgba(99,102,241,0.5)',borderRadius:'9999px',color:'#a5b4fc',padding:'0.55rem 1rem',fontSize:'0.72rem',letterSpacing:'0.06em',cursor:'pointer',boxShadow:'0 0 16px rgba(99,102,241,0.2)'}}>
              ✏️ OPEN SPATIAL EDITOR
            </button>
          ) : (
            <>
              <button className="sv-pill" onClick={closeEditMode} style={{background:'rgba(3,3,14,0.88)',backdropFilter:'blur(14px)',border:'1px solid rgba(239,68,68,0.4)',borderRadius:'9999px',color:'#fca5a5',padding:'0.55rem 1rem',fontSize:'0.72rem',letterSpacing:'0.06em',cursor:'pointer'}}>
                ✕ CLOSE
              </button>
              <button className="sv-pill" data-sv-overlay onMouseDown={startPTT} onMouseUp={stopPTT} onMouseLeave={stopPTT}
                onTouchStart={(e)=>{e.preventDefault();startPTT();}} onTouchEnd={(e)=>{e.preventDefault();stopPTT();}} disabled={busy} title="Hold to speak"
                style={{background:recording?'rgba(16,185,129,0.18)':busy?'rgba(6,182,212,0.1)':'rgba(3,3,14,0.88)',backdropFilter:'blur(14px)',border:recording?'1px solid #10b981':busy?'1px solid #06b6d4':'1px solid rgba(255,255,255,0.15)',borderRadius:'9999px',color:recording?'#10b981':busy?'#06b6d4':'#fff',padding:'0.55rem 1rem',fontSize:'0.72rem',letterSpacing:'0.06em',cursor:busy?'not-allowed':'pointer',display:'flex',alignItems:'center',gap:'0.4rem',boxShadow:recording?'0 0 16px rgba(16,185,129,0.3)':'none',transition:'all 0.15s ease'}}>
                <div style={{width:'8px',height:'8px',borderRadius:'50%',background:recording?'#10b981':busy?'#06b6d4':'rgba(255,255,255,0.4)',boxShadow:recording?'0 0 6px #10b981':busy?'0 0 6px #06b6d4':'none',animation:recording?'sv-pulse 0.9s ease-in-out infinite':'none'}}/>
                {recording ? 'RECORDING...' : busy ? 'WORKING...' : '🎙 HOLD TO SPEAK'}
              </button>
            </>
          )}
        </div>
        {editMode && chatLogs.length===0 && (
          <div data-sv-overlay style={{fontSize:'0.6rem',color:'rgba(255,255,255,0.25)',textAlign:'right',lineHeight:1.7,pointerEvents:'none'}}>
            Hold 🎙 or Space = speak · Click = select<br/>Dbl-click = delete · Swipe = theme<br/>Pinch selected = edit menu · ✌️ = Color Slider
          </div>
        )}
      </div>
    </>
  );
}
