'use client';
import { useState, useRef, useCallback } from 'react';

type Phase = 'idle' | 'listening' | 'working';

export default function VoiceEditButton() {
  const [phase, setPhase]           = useState<Phase>('idle');
  const [transcript, setTranscript] = useState('');
  const [log, setLog]               = useState('');
  const recogRef = useRef<any>(null);

  const sendCommand = useCallback(async (text: string) => {
    setPhase('working');
    setLog('Routing to agent…');
    try {
      const resp = await fetch('http://localhost:3002/voice-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text }),
      });
      if (!resp.body) throw new Error('No response stream');
      const reader  = resp.body.getReader();
      const decoder = new TextDecoder();
      let full = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        // Show the last 400 chars so the overlay stays compact
        setLog(full.slice(-400));
      }
      // Show a meaningful status line instead of always "Done"
      const lines = full.split('\n').map(l => l.trim()).filter(Boolean);
      const blocked = lines.find(l => l.startsWith('[BLOCKED]') || l.includes('Blocked:') || l.includes('Could not understand'));
      const warn    = lines.find(l => l.startsWith('[warn]') || l.includes('No matching fields'));
      const applied = lines.find(l => l.startsWith('[UIUX]') || l.startsWith('[JNR-DEV]'));
      const needsReload = full.includes('[reload]');
      if (blocked)       setLog('✗ ' + blocked);
      else if (warn)     setLog('⚠ ' + warn);
      else if (applied)  setLog('✓ Applied: ' + applied);
      else               setLog('✓ Done — site updating…');
      // Force reload so Next.js HMR doesn't miss the CSS file write on Windows
      if (needsReload) {
        setTimeout(() => window.location.reload(), 900);
      } else {
        setTimeout(() => { setPhase('idle'); setLog(''); setTranscript(''); }, 3000);
      }
    } catch (err: any) {
      setLog('⚠ ' + err.message);
      setTimeout(() => { setPhase('idle'); setLog(''); }, 3000);
    }
  }, []);

  const startListening = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert('Speech recognition not supported — use Chrome or Edge'); return; }

    setPhase('listening');
    setTranscript('');
    setLog('Listening…');

    const recog = new SR();
    recog.lang            = 'en-US';
    recog.interimResults  = true;
    recog.maxAlternatives = 3;   // try 3 alternatives, use highest-confidence one
    recogRef.current      = recog;

    let finalText = '';

    recog.onresult = (e: any) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          // Pick the alternative with the highest confidence among the 3
          let best = e.results[i][0];
          for (let a = 1; a < e.results[i].length; a++) {
            if (e.results[i][a].confidence > best.confidence) best = e.results[i][a];
          }
          finalText += best.transcript;
        } else {
          interim = e.results[i][0].transcript;
        }
      }
      setTranscript(finalText || interim);
    };

    recog.onend = () => {
      if (finalText.trim()) {
        setTranscript(finalText.trim());
        sendCommand(finalText.trim());
      } else {
        setLog('Nothing heard — tap mic to try again');
        setPhase('idle');
      }
    };

    recog.onerror = (e: any) => {
      setLog('Mic error: ' + e.error);
      setPhase('idle');
    };

    recog.start();
  }, [sendCommand]);

  const stop = useCallback(() => {
    recogRef.current?.stop();
    setPhase('idle');
    setLog('');
    setTranscript('');
  }, []);

  const iconLabel = phase === 'working' ? '⚙' : '🎤';
  const btnBg     = phase === 'listening' ? '#c0392b'
                  : phase === 'working'   ? '#1a6b3a'
                  : '#4a1942';

  return (
    <>
      <style>{`
        @keyframes ve-pulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(192,57,43,0.55); }
          50%      { box-shadow: 0 0 0 14px rgba(192,57,43,0); }
        }
        @keyframes ve-spin { to { transform: rotate(360deg); } }
        .ve-btn {
          width:56px; height:56px; border-radius:50%; border:none;
          display:flex; align-items:center; justify-content:center;
          font-size:22px; cursor:pointer; transition:background 0.2s, box-shadow 0.2s;
          box-shadow: 0 4px 20px rgba(0,0,0,0.45);
        }
        .ve-btn:hover { filter: brightness(1.15); }
        .ve-log {
          font-family: 'Segoe UI', system-ui, sans-serif;
          font-size: 12px; line-height: 1.55;
          white-space: pre-wrap; word-break: break-word;
          max-height: 200px; overflow-y: auto;
        }
      `}</style>

      <div style={{
        position:'fixed', bottom:24, right:24, zIndex:99999,
        display:'flex', flexDirection:'column', alignItems:'flex-end', gap:10,
        pointerEvents:'none',
      }}>
        {/* Status card */}
        {(phase !== 'idle' || log) && (
          <div style={{
            background:'rgba(10,10,10,0.94)',
            border:'1px solid rgba(74,25,66,0.8)',
            borderRadius:12, padding:'12px 16px',
            maxWidth:320, minWidth:180,
            backdropFilter:'blur(8px)',
            pointerEvents:'auto',
          }}>
            {transcript && (
              <div style={{ color:'#c9a84c', fontWeight:600, marginBottom:6, fontFamily:'system-ui', fontSize:13 }}>
                "{transcript}"
              </div>
            )}
            <div className="ve-log" style={{ color: phase === 'working' ? '#86efac' : '#aaa' }}>
              {log}
            </div>
          </div>
        )}

        {/* Mic button */}
        <button
          className="ve-btn"
          style={{
            background: btnBg, color:'#fff',
            animation: phase === 'listening' ? 've-pulse 1s infinite' : 'none',
            pointerEvents:'auto',
          }}
          onClick={phase === 'idle' ? startListening : phase === 'listening' ? stop : undefined}
          title={phase === 'idle' ? 'Voice edit — click and speak your change' : phase === 'listening' ? 'Click to cancel' : 'Agent working…'}
        >
          {phase === 'working'
            ? <span style={{ display:'inline-block', animation:'ve-spin 1.2s linear infinite' }}>⚙</span>
            : iconLabel}
        </button>
      </div>
    </>
  );
}
