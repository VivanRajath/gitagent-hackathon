'use client';
import { useEffect, useState } from 'react';

type PuterConfig = {
  hero:  string;
  cards: string[];
  cta:   string;
};

const BASE = 'https://image.pollinations.ai/prompt/';

function pollinationsUrl(prompt: string, width: number, height: number): string {
  return `${BASE}${encodeURIComponent(prompt)}?width=${width}&height=${height}&nologo=true&model=turbo`;
}

const LOG_LIMIT = 20;

export default function PuterImageLoader() {
  const [logs, setLogs]       = useState<string[]>(['[IMAGE-GEN] 🎨 Loading images via Pollinations.ai…']);
  const [done, setDone]       = useState(false);
  const [visible, setVisible] = useState(true);

  const addLog = (msg: string) =>
    setLogs(prev => [...prev.slice(-(LOG_LIMIT - 1)), msg]);

  useEffect(() => {
    const cfgScript = document.createElement('script');
    cfgScript.src = '/puter-image-config.js';
    cfgScript.onload = () => applyImages();
    cfgScript.onerror = () => addLog('[IMAGE-GEN] ❌ Config load failed — check public/puter-image-config.js');
    document.head.appendChild(cfgScript);
    return () => { document.head.removeChild(cfgScript); };
  }, []);

  function applyImages() {
    const cfg = (window as any).__puterImageConfig as PuterConfig | undefined;
    if (!cfg) {
      addLog('[IMAGE-GEN] ❌ Config not available');
      return;
    }

    // ── Hero ────────────────────────────────────────────────────────────────────
    const heroEl = document.querySelector<HTMLImageElement>('img[data-puter-zone="hero"]');
    if (heroEl && cfg.hero) {
      // Skip if already loaded from a local path (server pre-generated)
      if (heroEl.src.includes('/images/')) { addLog('[IMAGE-GEN] ✅ Hero already pre-loaded'); }
      else {
        const url = pollinationsUrl(cfg.hero, 1600, 900);
        if (heroEl.src !== url) heroEl.src = url;
        addLog(`[IMAGE-GEN] ✅ Hero  →  "${cfg.hero}"`);
      }
    }

    // ── Cards ───────────────────────────────────────────────────────────────────
    const cardEls = document.querySelectorAll<HTMLImageElement>('img[data-puter-zone^="card"]');
    Array.from(cardEls).forEach((el, i) => {
      const prompt = cfg.cards[i] ?? cfg.cards[0];
      if (!prompt) return;
      el.src = pollinationsUrl(prompt, 400, 300);
      addLog(`[IMAGE-GEN] ✅ Card ${i + 1}  →  "${prompt}"`);
    });

    // ── CTA ─────────────────────────────────────────────────────────────────────
    const ctaEl = document.querySelector<HTMLImageElement>('img[data-puter-zone="cta"]');
    if (ctaEl && cfg.cta) {
      ctaEl.src = pollinationsUrl(cfg.cta, 1200, 400);
      addLog(`[IMAGE-GEN] ✅ CTA  →  "${cfg.cta}"`);
    }

    addLog('[IMAGE-GEN] 🏁 All images live via Pollinations.ai');
    setDone(true);
    setTimeout(() => setVisible(false), 5000);
  }

  if (!visible) return null;

  return (
    <div
      data-puter-log
      style={{
        position:       'fixed',
        bottom:         '1.5rem',
        left:           '1.5rem',
        zIndex:         9997,
        fontFamily:     'ui-monospace, monospace',
        fontSize:       '0.68rem',
        lineHeight:     1.55,
        maxWidth:       '28rem',
        maxHeight:      '14rem',
        overflowY:      'auto',
        background:     'rgba(3,3,14,0.92)',
        border:         '1px solid rgba(167,139,250,0.35)',
        borderRadius:   '0.6rem',
        backdropFilter: 'blur(18px)',
        padding:        '0.65rem 0.8rem',
        color:          '#c4b5fd',
        boxShadow:      '0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(167,139,250,0.08)',
        transition:     'opacity 0.4s ease',
        opacity:        done ? 0.5 : 1,
      }}
    >
      <div style={{ fontWeight: 700, color: '#a78bfa', marginBottom: '0.35rem', letterSpacing: '0.04em' }}>
        🖼 IMAGE-GEN · Pollinations.ai
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
