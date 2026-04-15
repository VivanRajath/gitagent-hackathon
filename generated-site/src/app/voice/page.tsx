'use client';
import { useState, useRef, useCallback, useEffect } from 'react';

type Phase = 'idle' | 'listening' | 'thinking' | 'speaking';
type LogEntry = { id: number; role: string; msg: string; ts: string };

let logIdCounter = 0;

// ── Animated waveform bars ────────────────────────────────────────────────────
function WaveBars({ active }: { active: boolean }) {
  const bars = [3, 6, 9, 7, 12, 8, 5, 10, 6, 4, 11, 7, 9, 5, 8];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '3px', height: '32px' }}>
      {bars.map((h, i) => (
        <div key={i} style={{
          width: '3px',
          height: active ? `${h * 2.2}px` : '4px',
          borderRadius: '2px',
          background: active
            ? `rgba(0,212,255,${0.5 + (i % 3) * 0.15})`
            : 'rgba(0,212,255,0.18)',
          transition: 'height 0.12s ease',
          animation: active ? `wave-bar ${0.55 + i * 0.07}s ease-in-out infinite alternate` : 'none',
          animationDelay: `${i * 0.04}s`,
        }} />
      ))}
    </div>
  );
}

// ── Corner accent lines (HUD style) ──────────────────────────────────────────
function HudCorner({ pos }: { pos: 'tl' | 'tr' | 'bl' | 'br' }) {
  const styles: Record<string, React.CSSProperties> = {
    tl: { top: 0, left: 0, borderTop: '2px solid', borderLeft: '2px solid' },
    tr: { top: 0, right: 0, borderTop: '2px solid', borderRight: '2px solid' },
    bl: { bottom: 0, left: 0, borderBottom: '2px solid', borderLeft: '2px solid' },
    br: { bottom: 0, right: 0, borderBottom: '2px solid', borderRight: '2px solid' },
  };
  return (
    <div style={{
      position: 'absolute', width: '28px', height: '28px',
      borderColor: 'rgba(0,212,255,0.55)', ...styles[pos],
    }} />
  );
}

// ── Scanning ring ─────────────────────────────────────────────────────────────
function ScanRing({ size, delay, color }: { size: number; delay: number; color: string }) {
  return (
    <div style={{
      position: 'absolute',
      width: size, height: size,
      borderRadius: '50%',
      border: `1px solid ${color}`,
      animation: `scan-ring 2.8s ease-out ${delay}s infinite`,
      top: '50%', left: '50%',
      transform: 'translate(-50%,-50%)',
      pointerEvents: 'none',
    }} />
  );
}

// ── Status dot ────────────────────────────────────────────────────────────────
function StatusDot({ active, color }: { active: boolean; color: string }) {
  return (
    <div style={{
      width: '8px', height: '8px', borderRadius: '50%',
      background: active ? color : 'rgba(255,255,255,0.15)',
      boxShadow: active ? `0 0 8px ${color}` : 'none',
      transition: 'all 0.3s ease',
      animation: active ? 'sv-pulse 1.2s ease-in-out infinite' : 'none',
    }} />
  );
}

// ── Role colors ───────────────────────────────────────────────────────────────
const ROLE_COLOR: Record<string, string> = {
  YOU: '#00d4ff',
  AGENT: '#a78bfa',
  ORCHESTRATOR: '#f59e0b',
  SYS: '#94a3b8',
  ERR: '#f87171',
};

export default function VoicePage() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [transcript, setTranscript] = useState('');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [time, setTime] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);

  const recogRef    = useRef<any>(null);
  const logEndRef   = useRef<HTMLDivElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef      = useRef<number>(0);
  const streamRef   = useRef<MediaStream | null>(null);

  // Live clock
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('en-US', { hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Auto-scroll logs
  useEffect(() => { logEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [logs]);

  const addLog = (role: string, msg: string) => {
    const ts = new Date().toLocaleTimeString('en-US', { hour12: false });
    setLogs(prev => [...prev.slice(-59), { id: ++logIdCounter, role, msg, ts }]);
  };

  // Audio level meter via Web Audio API
  const startAudioMeter = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        setAudioLevel(avg / 128); // 0–2 range
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch { /* mic blocked */ }
  }, []);

  const stopAudioMeter = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    audioCtxRef.current?.close();
    audioCtxRef.current = null;
    analyserRef.current = null;
    setAudioLevel(0);
  }, []);

  // Send transcript to agent
  const sendCommand = useCallback(async (text: string) => {
    setPhase('thinking');
    addLog('YOU', text);
    addLog('AGENT', 'Processing request…');

    try {
      const resp = await fetch('http://localhost:3002/voice-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text }),
      });

      if (!resp.body) throw new Error('No stream');

      setPhase('speaking');
      addLog('AGENT', 'Executing…');

      const reader  = resp.body.getReader();
      const decoder = new TextDecoder();
      let full = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        full += chunk;
        // Stream chunks as log lines
        chunk.split('\n').filter(Boolean).forEach(line => {
          if (line.trim()) addLog('ORCHESTRATOR', line.trim());
        });
      }

      // Parse actual outcome from server response instead of blindly saying "updated"
      const lower = full.toLowerCase();
      if (lower.includes('[error]') || lower.includes('could not understand') || lower.includes('blocked:')) {
        const errLine = full.split('\n').find(l => /\[error\]|could not understand|blocked:/i.test(l)) ?? 'Failed';
        addLog('ERR', errLine.trim());
      } else if (lower.includes('[warn]') && !lower.includes('→')) {
        addLog('AGENT', 'No matching fields found — try rephrasing.');
      } else if (lower.includes('→') || lower.includes('written:') || lower.includes('updated')) {
        addLog('AGENT', 'Done. Site updated.');
      } else {
        addLog('AGENT', 'Request processed.');
      }
      setPhase('idle');
      setTranscript('');
    } catch (err: any) {
      addLog('ERR', err.message || 'Agent unreachable');
      setPhase('idle');
    }
  }, []);

  // Start voice recognition
  const startListening = useCallback(async () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { addLog('SYS', 'Speech API not supported — use Chrome or Edge'); return; }

    setPhase('listening');
    setTranscript('');
    addLog('SYS', 'Listening… speak your command');
    await startAudioMeter();

    const recog = new SR();
    recog.lang            = 'en-US';
    recog.interimResults  = true;
    recog.maxAlternatives = 1;
    recogRef.current      = recog;

    let finalText = '';

    recog.onresult = (e: any) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) finalText += e.results[i][0].transcript;
        else interim = e.results[i][0].transcript;
      }
      setTranscript(finalText || interim);
    };

    recog.onend = () => {
      stopAudioMeter();
      if (finalText.trim()) {
        sendCommand(finalText.trim());
      } else {
        addLog('SYS', 'No speech detected');
        setPhase('idle');
      }
    };

    recog.onerror = (e: any) => {
      stopAudioMeter();
      addLog('ERR', 'Mic error: ' + e.error);
      setPhase('idle');
    };

    recog.start();
  }, [startAudioMeter, stopAudioMeter, sendCommand]);

  const cancelListening = useCallback(() => {
    recogRef.current?.stop();
    stopAudioMeter();
    setPhase('idle');
    setTranscript('');
    addLog('SYS', 'Cancelled');
  }, [stopAudioMeter]);

  // Space bar shortcut
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        if (phase === 'idle') startListening();
        else if (phase === 'listening') cancelListening();
      }
    };
    window.addEventListener('keydown', onDown);
    return () => window.removeEventListener('keydown', onDown);
  }, [phase, startListening, cancelListening]);

  // Orb pulse scale driven by audio level
  const orbScale = phase === 'listening'
    ? 1 + Math.min(audioLevel * 0.25, 0.35)
    : 1;

  const orbGlow = {
    idle:      '0 0 60px rgba(0,212,255,0.15), 0 0 120px rgba(0,212,255,0.05)',
    listening: `0 0 80px rgba(0,212,255,${0.3 + audioLevel * 0.25}), 0 0 160px rgba(0,212,255,0.15)`,
    thinking:  '0 0 80px rgba(167,139,250,0.35), 0 0 160px rgba(167,139,250,0.15)',
    speaking:  '0 0 80px rgba(16,185,129,0.35), 0 0 160px rgba(16,185,129,0.15)',
  }[phase];

  const orbColor = {
    idle:      'rgba(0,212,255,0.08)',
    listening: 'rgba(0,212,255,0.14)',
    thinking:  'rgba(167,139,250,0.14)',
    speaking:  'rgba(16,185,129,0.14)',
  }[phase];

  const orbBorder = {
    idle:      'rgba(0,212,255,0.35)',
    listening: 'rgba(0,212,255,0.75)',
    thinking:  'rgba(167,139,250,0.75)',
    speaking:  'rgba(16,185,129,0.75)',
  }[phase];

  const stateLabel = {
    idle:      'STANDBY',
    listening: 'LISTENING',
    thinking:  'PROCESSING',
    speaking:  'EXECUTING',
  }[phase];

  const stateColor = {
    idle:      '#00d4ff',
    listening: '#00d4ff',
    thinking:  '#a78bfa',
    speaking:  '#10b981',
  }[phase];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body { background: #000 !important; }

        @keyframes sv-pulse {
          0%,100% { opacity:1; transform:scale(1); }
          50%      { opacity:.5; transform:scale(1.5); }
        }
        @keyframes scan-ring {
          0%   { opacity: 0.7; transform: translate(-50%,-50%) scale(0.8); }
          100% { opacity: 0;   transform: translate(-50%,-50%) scale(2.2); }
        }
        @keyframes orb-breathe {
          0%,100% { transform: scale(1); }
          50%      { transform: scale(1.04); }
        }
        @keyframes orb-spin {
          from { transform: translate(-50%,-50%) rotate(0deg); }
          to   { transform: translate(-50%,-50%) rotate(360deg); }
        }
        @keyframes orb-spin-rev {
          from { transform: translate(-50%,-50%) rotate(0deg); }
          to   { transform: translate(-50%,-50%) rotate(-360deg); }
        }
        @keyframes wave-bar {
          0%   { transform: scaleY(0.4); }
          100% { transform: scaleY(1); }
        }
        @keyframes hud-fade {
          0%,100% { opacity: 0.4; }
          50%      { opacity: 1; }
        }
        @keyframes log-in {
          from { opacity:0; transform:translateX(12px); }
          to   { opacity:1; transform:translateX(0); }
        }
        @keyframes think-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes grid-scroll {
          0%   { background-position: 0 0; }
          100% { background-position: 0 80px; }
        }

        .jarvis-root {
          min-height: 100vh;
          background: #010812;
          color: #e0f4ff;
          font-family: 'Share Tech Mono', 'ui-monospace', monospace;
          overflow: hidden;
          position: relative;
        }

        .grid-bg {
          position: absolute; inset: 0; pointer-events: none; z-index: 0;
          background-image:
            linear-gradient(rgba(0,212,255,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,212,255,0.04) 1px, transparent 1px);
          background-size: 80px 80px;
          animation: grid-scroll 8s linear infinite;
        }

        .orb-btn {
          cursor: pointer;
          background: none;
          border: none;
          padding: 0;
          outline: none;
        }
        .orb-btn:focus-visible { outline: 2px solid rgba(0,212,255,0.5); border-radius: 50%; }
      `}</style>

      <div className="jarvis-root">
        <div className="grid-bg" />

        {/* ── Radial glow background ── */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
          background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(0,40,80,0.6) 0%, transparent 70%)',
        }} />

        {/* ── Top HUD bar ── */}
        <div style={{
          position: 'relative', zIndex: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1rem 2rem',
          borderBottom: '1px solid rgba(0,212,255,0.12)',
          background: 'rgba(0,5,20,0.6)', backdropFilter: 'blur(12px)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '10px', height: '10px', borderRadius: '50%',
              background: '#00d4ff', boxShadow: '0 0 10px #00d4ff',
              animation: 'hud-fade 2s ease-in-out infinite',
            }} />
            <span style={{ fontSize: '0.85rem', letterSpacing: '0.15em', color: '#00d4ff', opacity: 0.9 }}>
              VOICE INTERFACE
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', fontSize: '0.7rem', color: 'rgba(0,212,255,0.6)' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <StatusDot active={phase !== 'idle'} color="#00d4ff" />
              <span>{stateLabel}</span>
            </div>
            <span style={{ letterSpacing: '0.08em' }}>{time}</span>
          </div>
        </div>

        {/* ── Main layout ── */}
        <div style={{
          position: 'relative', zIndex: 5,
          display: 'flex', height: 'calc(100vh - 57px)',
        }}>

          {/* ── Center panel ── */}
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: '2.5rem',
            padding: '2rem',
          }}>

            {/* Orb container */}
            <div style={{ position: 'relative', width: '260px', height: '260px' }}>

              {/* Scan rings */}
              {phase !== 'idle' && <>
                <ScanRing size={280} delay={0}    color={stateColor + '55'} />
                <ScanRing size={320} delay={0.7}  color={stateColor + '33'} />
                <ScanRing size={360} delay={1.4}  color={stateColor + '22'} />
              </>}

              {/* Outer dashed ring */}
              <div style={{
                position: 'absolute', inset: '-20px',
                borderRadius: '50%',
                border: `1px dashed ${orbBorder}`,
                opacity: 0.35,
                animation: 'orb-spin 18s linear infinite',
                top: '50%', left: '50%',
                width: '300px', height: '300px',
                marginLeft: '-150px', marginTop: '-150px',
              }} />

              {/* Inner spinning arc */}
              <div style={{
                position: 'absolute',
                width: '280px', height: '280px',
                top: '50%', left: '50%',
                borderRadius: '50%',
                border: '2px solid transparent',
                borderTopColor: orbBorder,
                borderRightColor: orbBorder + '44',
                animation: 'think-spin ' + (phase === 'thinking' ? '1.2s' : '4s') + ' linear infinite',
                transform: 'translate(-50%,-50%)',
              }} />

              {/* Main orb button */}
              <button className="orb-btn" onClick={phase === 'idle' ? startListening : phase === 'listening' ? cancelListening : undefined}
                title={phase === 'idle' ? 'Click to speak' : phase === 'listening' ? 'Click to cancel' : ''}
                style={{
                  position: 'absolute', inset: 0,
                  borderRadius: '50%',
                  background: orbColor,
                  border: `2px solid ${orbBorder}`,
                  boxShadow: orbGlow,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexDirection: 'column', gap: '0.5rem',
                  transition: 'all 0.3s ease',
                  transform: `scale(${orbScale})`,
                  animation: phase === 'idle' ? 'orb-breathe 3s ease-in-out infinite' : 'none',
                }}>

                {/* Icon */}
                <div style={{ fontSize: phase === 'thinking' || phase === 'speaking' ? '2.8rem' : '2.4rem', lineHeight: 1 }}>
                  {phase === 'idle'      && '🎙'}
                  {phase === 'listening' && '🔴'}
                  {phase === 'thinking'  && '⚙️'}
                  {phase === 'speaking'  && '✅'}
                </div>

                <div style={{
                  fontSize: '0.62rem', letterSpacing: '0.14em',
                  color: stateColor, opacity: 0.9, fontWeight: 700,
                }}>
                  {phase === 'idle'      && 'TAP TO SPEAK'}
                  {phase === 'listening' && 'RECORDING…'}
                  {phase === 'thinking'  && 'THINKING…'}
                  {phase === 'speaking'  && 'EXECUTING'}
                </div>
              </button>
            </div>

            {/* Wave bars */}
            <WaveBars active={phase === 'listening'} />

            {/* Transcript display */}
            <div style={{
              minHeight: '3rem', maxWidth: '500px', textAlign: 'center',
              fontSize: '1rem', color: '#e0f4ff', letterSpacing: '0.04em',
              lineHeight: 1.6, opacity: transcript ? 1 : 0.3,
              transition: 'opacity 0.3s ease',
              background: transcript ? 'rgba(0,212,255,0.05)' : 'transparent',
              border: transcript ? '1px solid rgba(0,212,255,0.15)' : '1px solid transparent',
              borderRadius: '0.6rem', padding: '0.6rem 1.2rem',
            }}>
              {transcript || 'Awaiting voice input…'}
            </div>

            {/* Quick hint */}
            <div style={{
              fontSize: '0.62rem', color: 'rgba(0,212,255,0.35)',
              letterSpacing: '0.12em', textAlign: 'center',
            }}>
              {phase === 'idle' ? 'CLICK ORB OR PRESS SPACE TO ACTIVATE' : ''}
              {phase === 'listening' ? 'SPEAK NOW · CLICK TO CANCEL' : ''}
              {phase === 'thinking'  ? 'ROUTING TO AGENT NETWORK…' : ''}
              {phase === 'speaking'  ? 'AGENT APPLYING CHANGES…' : ''}
            </div>
          </div>

          {/* ── Right log panel ── */}
          <div style={{
            width: '380px',
            borderLeft: '1px solid rgba(0,212,255,0.1)',
            background: 'rgba(0,5,18,0.75)',
            backdropFilter: 'blur(16px)',
            display: 'flex', flexDirection: 'column',
          }}>

            {/* Panel header */}
            <div style={{
              padding: '0.85rem 1.2rem',
              borderBottom: '1px solid rgba(0,212,255,0.1)',
              display: 'flex', alignItems: 'center', gap: '0.6rem',
            }}>
              <div style={{
                width: '6px', height: '6px', borderRadius: '50%',
                background: '#00d4ff', boxShadow: '0 0 6px #00d4ff',
                animation: 'sv-pulse 1.6s ease-in-out infinite',
              }} />
              <span style={{ fontSize: '0.7rem', letterSpacing: '0.14em', color: 'rgba(0,212,255,0.7)' }}>
                AGENT LOG STREAM
              </span>
              <span style={{ marginLeft: 'auto', fontSize: '0.6rem', color: 'rgba(255,255,255,0.2)' }}>
                {logs.length} ENTRIES
              </span>
            </div>

            {/* Log entries */}
            <div style={{
              flex: 1, overflowY: 'auto', padding: '0.8rem',
              display: 'flex', flexDirection: 'column', gap: '0.5rem',
              scrollbarWidth: 'thin', scrollbarColor: 'rgba(0,212,255,0.2) transparent',
            }}>
              {logs.length === 0 && (
                <div style={{
                  color: 'rgba(255,255,255,0.15)', fontSize: '0.7rem',
                  textAlign: 'center', marginTop: '3rem', letterSpacing: '0.1em',
                }}>
                  NO LOGS YET<br />
                  <span style={{ opacity: 0.5 }}>Activate voice to begin</span>
                </div>
              )}
              {logs.map((entry) => (
                <div key={entry.id} style={{
                  display: 'flex', flexDirection: 'column', gap: '2px',
                  padding: '0.45rem 0.6rem',
                  borderRadius: '0.35rem',
                  background: 'rgba(0,212,255,0.03)',
                  border: '1px solid rgba(0,212,255,0.07)',
                  animation: 'log-in 0.2s ease-out',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{
                      fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em',
                      color: ROLE_COLOR[entry.role] || '#94a3b8',
                    }}>
                      [{entry.role}]
                    </span>
                    <span style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.2)', marginLeft: 'auto' }}>
                      {entry.ts}
                    </span>
                  </div>
                  <div style={{
                    fontSize: '0.72rem', color: 'rgba(224,244,255,0.8)',
                    lineHeight: 1.45, wordBreak: 'break-word',
                  }}>
                    {entry.msg}
                  </div>
                </div>
              ))}
              <div ref={logEndRef} />
            </div>

            {/* Panel footer */}
            <div style={{
              padding: '0.65rem 1.2rem',
              borderTop: '1px solid rgba(0,212,255,0.1)',
              display: 'flex', alignItems: 'center', gap: '1rem',
              fontSize: '0.6rem', color: 'rgba(0,212,255,0.3)',
            }}>
              <StatusDot active={phase === 'listening'} color="#00d4ff" />
              <span>MIC</span>
              <StatusDot active={phase === 'thinking' || phase === 'speaking'} color="#a78bfa" />
              <span>AGENT</span>
              <button
                onClick={() => setLogs([])}
                style={{
                  marginLeft: 'auto', background: 'none', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '3px', padding: '2px 8px', color: 'rgba(255,255,255,0.25)',
                  cursor: 'pointer', fontSize: '0.6rem', letterSpacing: '0.08em',
                }}>
                CLEAR
              </button>
            </div>
          </div>
        </div>

        {/* ── HUD corner accents (decorative) ── */}
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 20 }}>
          <div style={{ position: 'absolute', top: '57px', left: 0, right: 0, bottom: 0 }}>
            <HudCorner pos="bl" />
            <HudCorner pos="br" />
          </div>
        </div>
      </div>
    </>
  );
}
