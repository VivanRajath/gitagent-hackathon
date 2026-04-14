'use client';
import { useEffect, useState, useRef, useCallback } from 'react';

export type DesignVariant = {
  id: number;
  name: string;
  palette: { primary: string; secondary: string; bg: string; text: string };
  fontDisplay: string;
  animationStyle: string;
  spacingScale: string;
  shadowStyle: string;
  previewGradient: string;
};

// ── Static layout metadata per component type ────────────────────────────────
const LAYOUT_VARIANTS: Record<string, { index: number; name: string; desc: string; icon: string }[]> = {
  navbar: [
    { index: 0, name: 'Classic',    desc: 'Logo left, links right',                 icon: '▬' },
    { index: 1, name: 'Centered',   desc: 'Logo center, links split',               icon: '⊕' },
    { index: 2, name: 'Animated',   desc: 'Typewriter logo, pill links',            icon: '▶' },
    { index: 3, name: 'Glass CTA',  desc: 'Frosted glass + CTA button',             icon: '✦' },
    { index: 4, name: 'Minimal',    desc: 'Logo + slide-out drawer',                icon: '≡' },
  ],
  hero: [
    { index: 0, name: 'Cinematic',  desc: 'Full-bleed image, centered glow',        icon: '🎬' },
    { index: 1, name: 'Split',      desc: 'Text left 55%, image right 45%',         icon: '⊞' },
    { index: 2, name: 'Bold Type',  desc: 'Huge gradient headline, no image bg',    icon: 'Aa' },
    { index: 3, name: 'Magazine',   desc: 'Asymmetric layout, editorial tags',      icon: '📰' },
    { index: 4, name: 'Asymmetric', desc: 'Glitch text, vertical accent strip',     icon: '⚡' },
  ],
  cards: [
    { index: 0, name: 'Grid',       desc: 'Classic 3-column responsive grid',       icon: '⊞' },
    { index: 1, name: 'Carousel',   desc: 'Horizontal drag-scroll strip',           icon: '⟺' },
    { index: 2, name: 'Featured',   desc: 'One large + stacked small cards',        icon: '★' },
    { index: 3, name: 'Masonry',    desc: 'Staggered height 2-column',              icon: '▤' },
    { index: 4, name: 'List',       desc: 'Alternating horizontal media rows',      icon: '☰' },
  ],
  features: [
    { index: 0, name: 'Icon Grid',  desc: 'Centered floating icon cards',           icon: '✦' },
    { index: 1, name: 'Numbered',   desc: 'Big index numbers, dividers',            icon: '01' },
    { index: 2, name: 'Alternating',desc: 'Left/right alternating panels',          icon: '⇄' },
    { index: 3, name: 'Timeline',   desc: 'Vertical line, branching nodes',         icon: '◎' },
    { index: 4, name: 'Stat Cards', desc: 'Horizontal scroll cards with stats',     icon: '10×' },
  ],
  cta: [
    { index: 0, name: 'Fullbleed',  desc: 'Cinematic image bg, pulsing button',     icon: '🎬' },
    { index: 1, name: 'Split',      desc: 'Text left, image right panel',           icon: '⊞' },
    { index: 2, name: 'Minimal',    desc: 'Clean text, thick left border',          icon: '—' },
    { index: 3, name: 'Glass Card', desc: 'Frosted card floating over dark bg',     icon: '✦' },
    { index: 4, name: 'Horiz Bar',  desc: 'Thin full-width sticky-style banner',    icon: '▬' },
  ],
  footer: [
    { index: 0, name: 'Two Col',    desc: 'Brand left, links right',                icon: '⊞' },
    { index: 1, name: 'Centered',   desc: 'Everything centered, large tagline',     icon: '⊕' },
    { index: 2, name: 'Minimal',    desc: 'Single-line compact bar',                icon: '—' },
    { index: 3, name: 'Big Brand',  desc: 'Giant watermark background text',        icon: 'Aa' },
    { index: 4, name: 'Dark Card',  desc: 'Raised frosted card with glow',          icon: '✦' },
  ],
};

type Props = {
  onClose: () => void;
  pinnedElement: HTMLElement | null;
  componentType: string;
};

// Walk up DOM to the nearest structural block (nav, section, footer, etc.)
function getComponentRoot(el: HTMLElement): HTMLElement {
  const STRUCTURAL = ['NAV', 'SECTION', 'HEADER', 'FOOTER', 'ARTICLE', 'MAIN'];
  let cur: HTMLElement | null = el;
  while (cur && cur !== document.body) {
    if (STRUCTURAL.includes(cur.tagName)) return cur;
    cur = cur.parentElement;
  }
  return el;
}

// Determine current active layout variant from site-content (runtime check via data attr)
function getCurrentVariantIndex(componentType: string): number {
  // Read from the data attribute we'll set on component roots, or default 0
  try {
    const SITE = (window as any).__SITE_VARIANTS__ ?? {};
    return SITE[componentType] ?? 0;
  } catch { return 0; }
}

type Tab = 'layout' | 'color';

export default function TemplateLibrary({ onClose, pinnedElement, componentType }: Props) {
  const [tab, setTab]               = useState<Tab>('layout');
  const [colorVariants, setColorVariants] = useState<DesignVariant[]>([]);
  const [colorLoading, setColorLoading]   = useState(true);
  const [activeColorId, setActiveColorId] = useState<number | null>(null);
  const [activeLayoutIdx, setActiveLayoutIdx] = useState<number | null>(null);
  const [applying, setApplying]     = useState(false);
  const [appliedMsg, setAppliedMsg] = useState<string | null>(null);
  const scrollRef  = useRef<HTMLDivElement>(null);
  const dragRef    = useRef({ on: false, startX: 0, scrollLeft: 0 });
  const originalVars = useRef<Record<string, string>>({});

  const layoutMeta = LAYOUT_VARIANTS[componentType] ?? LAYOUT_VARIANTS['navbar'];

  // Load color variants
  useEffect(() => {
    fetch('http://localhost:3002/variants')
      .then(r => r.json())
      .then((data: DesignVariant[]) => { setColorVariants(data); setColorLoading(false); })
      .catch(() => setColorLoading(false));
  }, []);

  // Snapshot current inline vars on mount
  useEffect(() => {
    if (!pinnedElement) return;
    const root = getComponentRoot(pinnedElement);
    const props = ['--color-primary', '--color-secondary', '--color-bg', '--color-text', '--color-on-primary', '--color-on-secondary'];
    const snap: Record<string, string> = {};
    props.forEach(p => { snap[p] = root.style.getPropertyValue(p); });
    originalVars.current = snap;
  }, [pinnedElement]);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { revertColorPreview(); onClose(); return; }
      if (tab === 'color' && colorVariants.length) {
        if (e.key === 'ArrowRight') {
          setActiveColorId(id => {
            const next = id === null ? 0 : Math.min(id + 1, colorVariants.length - 1);
            previewColor(colorVariants[next]);
            return next;
          });
        }
        if (e.key === 'ArrowLeft') {
          setActiveColorId(id => {
            const prev = id === null ? colorVariants.length - 1 : Math.max(id - 1, 0);
            previewColor(colorVariants[prev]);
            return prev;
          });
        }
        if (e.key === 'Enter' && activeColorId !== null) {
          const v = colorVariants.find(cv => cv.id === activeColorId);
          if (v) applyColor(v);
        }
      }
      if (tab === 'layout') {
        if (e.key === 'ArrowRight') setActiveLayoutIdx(i => Math.min((i ?? -1) + 1, layoutMeta.length - 1));
        if (e.key === 'ArrowLeft')  setActiveLayoutIdx(i => Math.max((i ?? 1) - 1, 0));
        if (e.key === 'Enter' && activeLayoutIdx !== null) applyLayout(activeLayoutIdx);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [tab, colorVariants, activeColorId, activeLayoutIdx, layoutMeta]);

  const applyToRoot = useCallback((root: HTMLElement, palette: DesignVariant['palette']) => {
    const hexLum = (hex: string) => {
      const c = hex.replace(/^#/, '');
      const r = parseInt(c.slice(0,2)||'00',16);
      const g = parseInt(c.slice(2,4)||'00',16);
      const b = parseInt(c.slice(4,6)||'00',16);
      return (0.299*r + 0.587*g + 0.114*b) / 255;
    };
    root.style.setProperty('--color-primary',      palette.primary);
    root.style.setProperty('--color-secondary',    palette.secondary);
    root.style.setProperty('--color-bg',           palette.bg);
    root.style.setProperty('--color-text',         palette.text);
    root.style.setProperty('--color-on-primary',   hexLum(palette.primary)   > 0.45 ? '#000000' : '#ffffff');
    root.style.setProperty('--color-on-secondary', hexLum(palette.secondary) > 0.45 ? '#000000' : '#ffffff');
  }, []);

  const previewColor = useCallback((v: DesignVariant) => {
    if (!pinnedElement) return;
    applyToRoot(getComponentRoot(pinnedElement), v.palette);
  }, [pinnedElement, applyToRoot]);

  const revertColorPreview = useCallback(() => {
    if (!pinnedElement) return;
    const root = getComponentRoot(pinnedElement);
    Object.entries(originalVars.current).forEach(([prop, val]) => {
      if (val) root.style.setProperty(prop, val);
      else root.style.removeProperty(prop);
    });
  }, [pinnedElement]);

  const applyColor = useCallback(async (v: DesignVariant) => {
    if (!pinnedElement || applying) return;
    setApplying(true);
    setActiveColorId(v.id);
    applyToRoot(getComponentRoot(pinnedElement), v.palette);
    try {
      await fetch('http://localhost:3002/apply-variant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: v.id, component: componentType }),
      });
      setAppliedMsg(`${v.name} applied`);
    } catch { /* silent */ }
    setApplying(false);
    setTimeout(onClose, 700);
  }, [pinnedElement, componentType, applying, applyToRoot, onClose]);

  const applyLayout = useCallback(async (variantIndex: number) => {
    if (applying) return;
    setApplying(true);
    setActiveLayoutIdx(variantIndex);
    try {
      await fetch('http://localhost:3002/apply-design-variant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ component: componentType, variantIndex }),
      });
      const meta = layoutMeta[variantIndex];
      setAppliedMsg(`Layout "${meta?.name}" applied — refresh to see`);
    } catch { /* silent */ }
    setApplying(false);
    setTimeout(onClose, 900);
  }, [applying, componentType, layoutMeta, onClose]);

  // Drag-to-scroll
  const onMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    dragRef.current = { on: true, startX: e.pageX - scrollRef.current.offsetLeft, scrollLeft: scrollRef.current.scrollLeft };
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragRef.current.on || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    scrollRef.current.scrollLeft = dragRef.current.scrollLeft - (x - dragRef.current.startX);
  };
  const stopDrag = () => { dragRef.current.on = false; };
  const touchStart = useRef(0);
  const onTouchStart = (e: React.TouchEvent) => { touchStart.current = e.touches[0].clientX; };
  const onTouchMove  = (e: React.TouchEvent) => {
    if (!scrollRef.current) return;
    const dx = touchStart.current - e.touches[0].clientX;
    scrollRef.current.scrollLeft += dx;
    touchStart.current = e.touches[0].clientX;
  };

  const AMBER = '#f59e0b';
  const CYAN  = '#06b6d4';
  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '0.3rem 0.85rem',
    borderRadius: '0.35rem',
    fontSize: '0.7rem',
    fontWeight: 700,
    letterSpacing: '0.06em',
    cursor: 'pointer',
    border: 'none',
    background: active ? (tab === 'layout' && active ? `${AMBER}22` : `${CYAN}22`) : 'transparent',
    color: active ? (tab === 'layout' ? AMBER : CYAN) : 'rgba(255,255,255,0.35)',
    transition: 'all 0.15s',
  });

  return (
    <>
      <style>{`
        .tl-card  { transition: border 0.15s, box-shadow 0.15s, transform 0.15s; }
        .tl-card:hover  { transform: translateY(-2px); }
        .tl-lcard { transition: border 0.15s, box-shadow 0.15s, transform 0.15s, background 0.15s; }
        .tl-lcard:hover { transform: translateY(-2px); background: rgba(245,158,11,0.07) !important; }
        .tl-apply { transition: background 0.15s, color 0.15s; }
        .tl-apply:hover { filter: brightness(1.18); }
        ::-webkit-scrollbar { height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(245,158,11,0.3); border-radius: 2px; }
      `}</style>

      {/* Backdrop */}
      <div data-sv-overlay onClick={() => { revertColorPreview(); onClose(); }}
        style={{ position:'fixed', inset:0, zIndex:99998, background:'rgba(0,0,0,0.55)', backdropFilter:'blur(4px)' }} />

      {/* Panel */}
      <div data-sv-overlay style={{
        position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
        zIndex:99999, width:'min(900px,96vw)',
        background:'rgba(5,5,18,0.98)', backdropFilter:'blur(32px)',
        border:'1px solid rgba(245,158,11,0.45)', borderRadius:'1rem',
        boxShadow:'0 0 80px rgba(245,158,11,0.12), 0 32px 64px rgba(0,0,0,0.6)',
        padding:'1.25rem', animation:'sv-in 0.2s ease-out',
        fontFamily:'ui-monospace, monospace',
      }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1rem' }}>
          <div>
            <div style={{ color:AMBER, fontWeight:700, fontSize:'0.82rem', letterSpacing:'0.1em' }}>
              🎨 TEMPLATE LIBRARY
            </div>
            <div style={{ color:'rgba(255,255,255,0.38)', fontSize:'0.62rem', marginTop:'0.2rem' }}>
              Component: <span style={{ color:CYAN }}>{componentType.toUpperCase()}</span>
              {appliedMsg && <span style={{ color:'#22c55e', marginLeft:'0.75rem' }}>✓ {appliedMsg}</span>}
            </div>
          </div>
          <button data-sv-overlay onClick={() => { revertColorPreview(); onClose(); }} style={{
            background:'transparent', border:'1px solid rgba(255,255,255,0.12)',
            borderRadius:'0.4rem', color:'rgba(255,255,255,0.45)',
            cursor:'pointer', padding:'0.28rem 0.6rem', fontSize:'0.72rem',
          }}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:'0.35rem', marginBottom:'1rem',
          borderBottom:'1px solid rgba(255,255,255,0.07)', paddingBottom:'0.75rem' }}>
          <button style={tabStyle(tab === 'layout')} onClick={() => setTab('layout')}>
            ⊞ LAYOUT
          </button>
          <button style={tabStyle(tab === 'color')} onClick={() => setTab('color')}>
            🎨 COLOR THEME
          </button>
        </div>

        {/* ── Layout tab ───────────────────────────────────────────────────── */}
        {tab === 'layout' && (
          <>
            <div
              ref={scrollRef}
              onMouseDown={onMouseDown} onMouseMove={onMouseMove}
              onMouseUp={stopDrag} onMouseLeave={stopDrag}
              onTouchStart={onTouchStart} onTouchMove={onTouchMove}
              style={{
                display:'flex', gap:'0.75rem', overflowX:'auto',
                paddingBottom:'0.75rem', cursor:dragRef.current.on ? 'grabbing' : 'grab',
                userSelect:'none',
              }}
            >
              {layoutMeta.map(lv => {
                const isActive = activeLayoutIdx === lv.index;
                return (
                  <div key={lv.index} className="tl-lcard"
                    onClick={() => setActiveLayoutIdx(lv.index)}
                    style={{
                      flexShrink:0, width:'152px', borderRadius:'0.8rem', overflow:'hidden',
                      background: isActive ? 'rgba(245,158,11,0.08)' : 'rgba(255,255,255,0.03)',
                      border: isActive ? `2px solid ${AMBER}` : '1px solid rgba(255,255,255,0.09)',
                      boxShadow: isActive ? `0 0 20px rgba(245,158,11,0.25)` : '0 4px 16px rgba(0,0,0,0.4)',
                      padding:'1rem 0.9rem', display:'flex', flexDirection:'column', gap:'0.6rem',
                      cursor:'pointer',
                    }}>
                    {/* Icon preview area */}
                    <div style={{
                      height:'56px', borderRadius:'0.5rem',
                      background: isActive ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.04)',
                      border:'1px solid rgba(255,255,255,0.07)',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:'1.5rem', color: isActive ? AMBER : 'rgba(255,255,255,0.3)',
                    }}>
                      {lv.icon}
                    </div>
                    <div>
                      <div style={{
                        fontSize:'0.73rem', fontWeight:700,
                        color: isActive ? AMBER : '#fff',
                        marginBottom:'0.2rem',
                      }}>{lv.name}</div>
                      <div style={{
                        fontSize:'0.57rem', color:'rgba(255,255,255,0.38)',
                        lineHeight:1.4,
                      }}>{lv.desc}</div>
                    </div>
                    <button className="tl-apply" data-sv-overlay
                      onClick={e => { e.stopPropagation(); applyLayout(lv.index); }}
                      style={{
                        width:'100%',
                        background: isActive ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.05)',
                        border:`1px solid ${isActive ? 'rgba(245,158,11,0.5)' : 'rgba(255,255,255,0.1)'}`,
                        borderRadius:'0.35rem',
                        color: isActive ? AMBER : 'rgba(255,255,255,0.4)',
                        fontSize:'0.62rem', fontWeight:700, cursor:applying ? 'wait' : 'pointer',
                        padding:'0.3rem',
                      }}>
                      {applying && activeLayoutIdx === lv.index ? 'Applying…' : 'Use Layout'}
                    </button>
                  </div>
                );
              })}
            </div>
            <div style={{ color:'rgba(255,255,255,0.2)', fontSize:'0.58rem', marginTop:'0.5rem', textAlign:'right' }}>
              5 layouts · applies to {componentType} · page refreshes to render new layout
            </div>
          </>
        )}

        {/* ── Color theme tab ──────────────────────────────────────────────── */}
        {tab === 'color' && (
          colorLoading ? (
            <div style={{ color:'rgba(255,255,255,0.35)', fontSize:'0.78rem', textAlign:'center', padding:'2.5rem 0' }}>
              Fetching color themes…
            </div>
          ) : colorVariants.length === 0 ? (
            <div style={{ textAlign:'center', padding:'2.5rem 0' }}>
              <div style={{ fontSize:'2.2rem', marginBottom:'0.75rem' }}>🏗️</div>
              <div style={{ color:'rgba(255,255,255,0.65)', fontSize:'0.85rem', fontWeight:600, marginBottom:'0.4rem' }}>
                No color themes yet
              </div>
              <div style={{ color:'rgba(255,255,255,0.3)', fontSize:'0.7rem', maxWidth:'28rem', margin:'0 auto', lineHeight:1.6 }}>
                Ask the agent to build a website — the architect will automatically generate 5
                color themes that you can apply here.
              </div>
            </div>
          ) : (
            <>
              <div
                ref={scrollRef}
                onMouseDown={onMouseDown} onMouseMove={onMouseMove}
                onMouseUp={stopDrag} onMouseLeave={stopDrag}
                onTouchStart={onTouchStart} onTouchMove={onTouchMove}
                style={{
                  display:'flex', gap:'0.75rem', overflowX:'auto',
                  paddingBottom:'0.75rem', cursor:dragRef.current.on ? 'grabbing' : 'grab',
                  userSelect:'none', scrollBehavior:'smooth',
                }}
              >
                {colorVariants.map(v => (
                  <div key={v.id} className="tl-card"
                    onMouseEnter={() => { setActiveColorId(v.id); previewColor(v); }}
                    onMouseLeave={() => { setActiveColorId(null); revertColorPreview(); }}
                    style={{
                      flexShrink:0, width:'158px', borderRadius:'0.8rem', overflow:'hidden',
                      border: activeColorId === v.id ? `2px solid ${AMBER}` : '1px solid rgba(255,255,255,0.09)',
                      boxShadow: activeColorId === v.id ? `0 0 24px rgba(245,158,11,0.35)` : '0 4px 16px rgba(0,0,0,0.4)',
                    }}
                  >
                    <div style={{ height:'82px', background:v.previewGradient, position:'relative' }}>
                      <div style={{
                        position:'absolute', top:'0.4rem', right:'0.4rem',
                        background:'rgba(0,0,0,0.55)', backdropFilter:'blur(8px)',
                        borderRadius:'0.25rem', padding:'0.15rem 0.35rem',
                        color:AMBER, fontSize:'0.52rem', fontWeight:700, letterSpacing:'0.06em',
                      }}>
                        {v.animationStyle.toUpperCase()}
                      </div>
                      <div style={{ position:'absolute', bottom:'0.45rem', left:'0.45rem', display:'flex', gap:'0.22rem' }}>
                        {[v.palette.primary, v.palette.secondary, v.palette.bg, v.palette.text].map((c, i) => (
                          <div key={i} title={c} style={{
                            width:'14px', height:'14px', borderRadius:'50%', background:c,
                            border:'1.5px solid rgba(255,255,255,0.3)',
                            boxShadow:'0 1px 4px rgba(0,0,0,0.5)',
                          }}/>
                        ))}
                      </div>
                    </div>
                    <div style={{ background:'rgba(8,8,22,0.97)', padding:'0.6rem' }}>
                      <div style={{ color:'#fff', fontSize:'0.73rem', fontWeight:700, marginBottom:'0.18rem',
                        whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                        {v.name}
                      </div>
                      <div style={{ color:'rgba(255,255,255,0.3)', fontSize:'0.57rem', marginBottom:'0.55rem' }}>
                        {v.fontDisplay.split(',')[0].replace(/['"]/g,'').trim()}
                        &ensp;·&ensp;{v.spacingScale}
                      </div>
                      <button className="tl-apply" data-sv-overlay onClick={() => applyColor(v)} style={{
                        width:'100%',
                        background: applying && activeColorId === v.id ? 'rgba(245,158,11,0.35)'
                          : activeColorId === v.id ? 'rgba(245,158,11,0.18)' : 'rgba(255,255,255,0.05)',
                        border:`1px solid ${activeColorId === v.id ? 'rgba(245,158,11,0.6)' : 'rgba(255,255,255,0.1)'}`,
                        borderRadius:'0.35rem',
                        color: activeColorId === v.id ? AMBER : 'rgba(255,255,255,0.45)',
                        fontSize:'0.65rem', fontWeight:700, cursor:applying ? 'wait' : 'pointer',
                        padding:'0.32rem',
                      }}>
                        {applying && activeColorId === v.id ? 'Applying…' : 'Apply Theme'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ color:'rgba(255,255,255,0.2)', fontSize:'0.58rem', marginTop:'0.5rem', textAlign:'right' }}>
                {colorVariants.length} theme{colorVariants.length !== 1 ? 's' : ''} · hover to preview · applies to {componentType} only
              </div>
            </>
          )
        )}
      </div>
    </>
  );
}
