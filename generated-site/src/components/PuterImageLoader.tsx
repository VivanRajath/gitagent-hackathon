'use client';
import { useEffect, useState } from 'react';

type PuterConfig = {
  hero:  string;
  cards: string[];
  cta:   string;
};

const LOG_LIMIT = 20;

export default function PuterImageLoader() {
  const [logs, setLogs]       = useState<string[]>(['[IMAGE-GEN] 🎨 Initialising Puter.js…']);
  const [done, setDone]       = useState(false);
  const [visible, setVisible] = useState(true);

  const addLog = (msg: string) =>
    setLogs(prev => [...prev.slice(-(LOG_LIMIT - 1)), msg]);

  useEffect(() => {
    // Load puter-image-config.js from public/ then puter.js SDK
    const cfgScript = document.createElement('script');
    cfgScript.src = '/puter-image-config.js';
    cfgScript.onload = () => loadPuterSDK();
    cfgScript.onerror = () => addLog('[IMAGE-GEN] ❌ Config load failed — check public/puter-image-config.js');
    document.head.appendChild(cfgScript);

    return () => { document.head.removeChild(cfgScript); };
  }, []);

  function loadPuterSDK() {
    if ((window as any).puter) { runGeneration(); return; }
    addLog('[IMAGE-GEN] 📦 Loading Puter.js SDK…');
    const s = document.createElement('script');
    s.src = 'https://js.puter.com/v2/';
    s.onload  = () => { addLog('[IMAGE-GEN] ✅ Puter.js ready'); runGeneration(); };
    s.onerror = () => addLog('[IMAGE-GEN] ❌ Puter.js SDK failed to load — are you online?');
    document.head.appendChild(s);
  }

  async function runGeneration() {
    const puter = (window as any).puter;
    const cfg   = (window as any).__puterImageConfig as PuterConfig | undefined;
    if (!puter?.ai?.txt2img || !cfg) {
      addLog('[IMAGE-GEN] ❌ Puter AI or config not available');
      return;
    }

    // ── Hero image ──────────────────────────────────────────────────────────
    const heroEl = document.querySelector<HTMLImageElement>('img[data-puter-zone="hero"]');
    if (heroEl && cfg.hero) {
      addLog('[IMAGE-GEN] 🎨 Generating hero image (may take 5–15s)…');
      const t0 = Date.now();
      try {
        const img = await puter.ai.txt2img(cfg.hero);
        heroEl.src = img.src;
        addLog(`[IMAGE-GEN] ✅ Hero ready (${((Date.now()-t0)/1000).toFixed(1)}s)`);
      } catch (e: any) {
        addLog(`[IMAGE-GEN] ⚠️ Hero failed: ${e?.message ?? e}`);
      }
    }

    // ── Card images ─────────────────────────────────────────────────────────
    const cardEls = document.querySelectorAll<HTMLImageElement>('img[data-puter-zone^="card"]');
    if (cardEls.length > 0 && cfg.cards?.length) {
      addLog(`[IMAGE-GEN] 🎨 Generating ${cardEls.length} card images…`);
      await Promise.all(Array.from(cardEls).map(async (el, i) => {
        const cardPrompt = cfg.cards[i] ?? cfg.cards[0];
        if (!cardPrompt) return;
        const t0 = Date.now();
        try {
          const img = await puter.ai.txt2img(cardPrompt);
          el.src = img.src;
          addLog(`[IMAGE-GEN] ✅ Card ${i + 1} ready (${((Date.now()-t0)/1000).toFixed(1)}s)`);
        } catch (e: any) {
          addLog(`[IMAGE-GEN] ⚠️ Card ${i + 1} failed: ${e?.message ?? e}`);
        }
      }));
    }

    // ── CTA image ───────────────────────────────────────────────────────────
    const ctaEl = document.querySelector<HTMLImageElement>('img[data-puter-zone="cta"]');
    if (ctaEl && cfg.cta) {
      addLog('[IMAGE-GEN] 🎨 Generating CTA banner…');
      const t0 = Date.now();
      try {
        const img = await puter.ai.txt2img(cfg.cta);
        ctaEl.src = img.src;
        addLog(`[IMAGE-GEN] ✅ CTA ready (${((Date.now()-t0)/1000).toFixed(1)}s)`);
      } catch (e: any) {
        addLog(`[IMAGE-GEN] ⚠️ CTA failed: ${e?.message ?? e}`);
      }
    }

    addLog('[IMAGE-GEN] 🏁 All Puter.js images complete');
    setDone(true);
    setTimeout(() => setVisible(false), 6000);
  }

  if (!visible) return null;

  return (
    <div
      data-puter-log
      style={{
        position:        'fixed',
        bottom:          '1.5rem',
        left:            '1.5rem',
        zIndex:          9997,
        fontFamily:      'ui-monospace, monospace',
        fontSize:        '0.68rem',
        lineHeight:      1.55,
        maxWidth:        '26rem',
        maxHeight:       '14rem',
        overflowY:       'auto',
        background:      'rgba(3,3,14,0.92)',
        border:          '1px solid rgba(167,139,250,0.35)',
        borderRadius:    '0.6rem',
        backdropFilter:  'blur(18px)',
        padding:         '0.65rem 0.8rem',
        color:           '#c4b5fd',
        boxShadow:       '0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(167,139,250,0.08)',
        transition:      'opacity 0.4s ease',
        opacity:         done ? 0.5 : 1,
      }}
    >
      <div style={{ fontWeight: 700, color: '#a78bfa', marginBottom: '0.35rem', letterSpacing: '0.04em' }}>
        🎨 IMAGE-GEN · Puter.js
      </div>
      {logs.map((l, i) => (
        <div key={i} style={{ opacity: i === logs.length - 1 ? 1 : 0.65 }}>{l}</div>
      ))}
      {done && (
        <button
          onClick={() => setVisible(false)}
          style={{ marginTop: '0.4rem', background: 'none', border: 'none', color: '#7c3aed', cursor: 'pointer', fontSize: '0.65rem' }}
        >
          ✕ dismiss
        </button>
      )}
    </div>
  );
}
