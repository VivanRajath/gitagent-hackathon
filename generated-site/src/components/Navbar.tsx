'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { SITE } from '../app/site-content';

const S = SITE as any;
type NavProps = { brand: string; links: { label: string; href: string }[] };

// ── V0: Classic — logo left, links right ─────────────────────────────────────
function NavClassic({ brand, links }: NavProps) {
  return (
    <nav className="glass" style={{
      position:'sticky',top:0,zIndex:50,width:'100%',
      padding:'1.1rem 2rem',display:'flex',alignItems:'center',
      justifyContent:'space-between',
      borderBottom:'1px solid color-mix(in srgb,var(--color-secondary) 20%,transparent)',
    }}>
      <Link href="/" style={{fontSize:'1.4rem',fontWeight:900,color:'var(--color-secondary)',
        textDecoration:'none',fontFamily:'var(--font-display)',letterSpacing:'-0.02em'}}>
        {brand}
      </Link>
      <ul style={{display:'flex',gap:'2rem',margin:0,padding:0,listStyle:'none'}}>
        {links.map(l => (
          <li key={l.href}>
            <Link href={l.href} className="nav-link" style={{color:'var(--color-nav-text)',fontWeight:600,fontSize:'0.9rem'}}>
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

// ── V1: Centered — logo in middle, links split left/right ────────────────────
function NavCentered({ brand, links }: NavProps) {
  const half = Math.ceil(links.length / 2);
  const left = links.slice(0, half);
  const right = links.slice(half);
  return (
    <nav style={{
      position:'sticky',top:0,zIndex:50,width:'100%',
      padding:'1.1rem 2rem',display:'grid',
      gridTemplateColumns:'1fr auto 1fr',alignItems:'center',gap:'1rem',
      background:'rgba(0,0,0,0.75)',backdropFilter:'blur(20px)',
      borderBottom:'2px solid var(--color-secondary)',
    }}>
      <ul style={{display:'flex',gap:'2rem',margin:0,padding:0,listStyle:'none',justifyContent:'flex-end'}}>
        {left.map(l => (
          <li key={l.href}>
            <Link href={l.href} className="nav-link" style={{color:'var(--color-nav-text)',fontWeight:600,fontSize:'0.9rem'}}>{l.label}</Link>
          </li>
        ))}
      </ul>
      <Link href="/" style={{
        fontSize:'1.5rem',fontWeight:900,color:'var(--color-secondary)',textDecoration:'none',
        fontFamily:'var(--font-display)',letterSpacing:'-0.02em',whiteSpace:'nowrap',
        textAlign:'center',padding:'0 1.5rem',
        borderLeft:'1px solid rgba(255,255,255,0.12)',borderRight:'1px solid rgba(255,255,255,0.12)',
      }}>
        {brand}
      </Link>
      <ul style={{display:'flex',gap:'2rem',margin:0,padding:0,listStyle:'none'}}>
        {right.map(l => (
          <li key={l.href}>
            <Link href={l.href} className="nav-link" style={{color:'var(--color-nav-text)',fontWeight:600,fontSize:'0.9rem'}}>{l.label}</Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

// ── V2: Animated — typewriter logo, pill-style links ─────────────────────────
function NavAnimated({ brand, links }: NavProps) {
  const [displayed, setDisplayed] = useState('');
  useEffect(() => {
    let i = 0; let dir = 1;
    const t = setInterval(() => {
      i += dir;
      setDisplayed(brand.slice(0, i) + (i < brand.length ? '▌' : ''));
      if (i >= brand.length) { setTimeout(() => { dir = -1; }, 1800); }
      if (i <= 0) { dir = 1; }
    }, 110);
    return () => clearInterval(t);
  }, [brand]);
  return (
    <nav style={{
      position:'sticky',top:0,zIndex:50,width:'100%',
      padding:'1rem 2rem',display:'flex',alignItems:'center',justifyContent:'space-between',
      background:'var(--color-bg)',borderBottom:'1px solid var(--color-primary)',
    }}>
      <Link href="/" style={{
        fontSize:'1.3rem',fontWeight:900,color:'var(--color-secondary)',textDecoration:'none',
        fontFamily:'monospace',letterSpacing:'0.08em',minWidth:'16ch',
        textShadow:'0 0 14px color-mix(in srgb,var(--color-secondary) 60%,transparent)',
      }}>
        {displayed || brand}
      </Link>
      <ul style={{display:'flex',gap:'0.4rem',margin:0,padding:0,listStyle:'none'}}>
        {links.map(l => (
          <li key={l.href}>
            <Link href={l.href} style={{
              color:'var(--color-nav-text)',fontWeight:500,fontSize:'0.8rem',textDecoration:'none',
              padding:'0.35rem 0.85rem',borderRadius:'9999px',
              border:'1px solid rgba(255,255,255,0.1)',display:'block',transition:'all 0.15s',
            }}
            onMouseEnter={e => Object.assign((e.currentTarget as HTMLElement).style,{background:'var(--color-primary)',borderColor:'var(--color-secondary)',color:'var(--color-secondary)'})}
            onMouseLeave={e => Object.assign((e.currentTarget as HTMLElement).style,{background:'transparent',borderColor:'rgba(255,255,255,0.1)',color:'var(--color-nav-text)'})}>
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

// ── V3: GlassCTA — frosted glass, glow border, CTA button ────────────────────
function NavGlassCTA({ brand, links }: NavProps) {
  return (
    <nav style={{
      position:'sticky',top:0,zIndex:50,width:'100%',
      padding:'1rem 2.5rem',display:'flex',alignItems:'center',gap:'2rem',
      background:'rgba(255,255,255,0.04)',backdropFilter:'blur(24px)',
      borderBottom:'1px solid rgba(255,255,255,0.08)',
      boxShadow:'inset 0 -1px 0 var(--color-secondary)',
    }}>
      <Link href="/" style={{
        fontSize:'1.4rem',fontWeight:900,color:'var(--color-secondary)',textDecoration:'none',
        fontFamily:'var(--font-display)',marginRight:'auto',letterSpacing:'-0.02em',
      }}>
        {brand}
      </Link>
      <ul style={{display:'flex',gap:'1.75rem',margin:0,padding:0,listStyle:'none'}}>
        {links.map(l => (
          <li key={l.href}>
            <Link href={l.href} className="nav-link" style={{color:'var(--color-nav-text)',fontWeight:500,fontSize:'0.875rem'}}>{l.label}</Link>
          </li>
        ))}
      </ul>
      <button style={{
        padding:'0.5rem 1.35rem',borderRadius:'9999px',fontWeight:700,fontSize:'0.82rem',
        background:'var(--color-secondary)',color:'var(--color-on-secondary)',border:'none',cursor:'pointer',
        fontFamily:'var(--font-display)',letterSpacing:'0.04em',flexShrink:0,
        boxShadow:'0 0 18px color-mix(in srgb,var(--color-secondary) 45%,transparent)',
      }}>
        Get Started
      </button>
    </nav>
  );
}

// ── V4: Minimal — logo + slide-out drawer ────────────────────────────────────
function NavMinimal({ brand, links }: NavProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <nav style={{
        position:'sticky',top:0,zIndex:50,width:'100%',
        padding:'1.1rem 2rem',display:'flex',alignItems:'center',justifyContent:'space-between',
        background:'transparent',borderBottom:'1px solid rgba(255,255,255,0.06)',backdropFilter:'blur(8px)',
      }}>
        <Link href="/" style={{
          fontSize:'1.5rem',fontWeight:900,color:'var(--color-secondary)',
          textDecoration:'none',fontFamily:'var(--font-display)',letterSpacing:'-0.02em',
        }}>
          {brand}
        </Link>
        <button onClick={() => setOpen(o => !o)} aria-label="Menu" style={{
          background:'none',border:'1px solid rgba(255,255,255,0.15)',borderRadius:'0.4rem',
          cursor:'pointer',padding:'0.45rem 0.6rem',display:'flex',flexDirection:'column',gap:'5px',
        }}>
          {[0,1,2].map(i => (
            <span key={i} style={{
              display:'block',width:'20px',height:'2px',background:'var(--color-secondary)',
              transition:'all 0.25s',borderRadius:'2px',
              transform: open ? i===0?'translateY(7px) rotate(45deg)':i===2?'translateY(-7px) rotate(-45deg)':'scaleX(0)' : 'none',
              opacity: open && i===1 ? 0 : 1,
            }}/>
          ))}
        </button>
      </nav>
      {open && (
        <div style={{
          position:'fixed',top:0,right:0,width:'260px',height:'100vh',zIndex:49,
          background:'rgba(5,5,18,0.98)',backdropFilter:'blur(24px)',
          borderLeft:'1px solid rgba(255,255,255,0.08)',
          padding:'5rem 1.75rem 2rem',display:'flex',flexDirection:'column',gap:'0.25rem',
          animation:'sv-in 0.2s ease-out',
        }}>
          <p style={{color:'var(--color-secondary)',fontSize:'0.65rem',letterSpacing:'0.15em',marginBottom:'1rem',opacity:0.6}}>NAVIGATION</p>
          {links.map(l => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} style={{
              color:'var(--color-nav-text)',fontWeight:700,fontSize:'1.15rem',
              textDecoration:'none',padding:'0.85rem 0',
              borderBottom:'1px solid rgba(255,255,255,0.05)',transition:'color 0.15s',
            }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'var(--color-secondary)')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--color-text)')}>
              {l.label}
            </Link>
          ))}
        </div>
      )}
      {open && <div onClick={() => setOpen(false)} style={{position:'fixed',inset:0,zIndex:48,background:'rgba(0,0,0,0.4)'}}/>}
    </>
  );
}

export default function Navbar() {
  const v = S.variants?.navbar ?? 0;
  const props = { brand: SITE.navbar.brand, links: SITE.navbar.links };
  if (v === 1) return <NavCentered {...props} />;
  if (v === 2) return <NavAnimated {...props} />;
  if (v === 3) return <NavGlassCTA {...props} />;
  if (v === 4) return <NavMinimal {...props} />;
  return <NavClassic {...props} />;
}
