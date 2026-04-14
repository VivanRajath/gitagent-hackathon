'use client';
import Link from 'next/link';
import { SITE } from '../app/site-content';

const S = SITE as any;
type FooterProps = { brand: string; tagline: string; links: { label: string; href: string }[] };

// ── V0: TwoCol — brand left, links right ─────────────────────────────────────
function FooterTwoCol({ brand, tagline, links }: FooterProps) {
  return (
    <footer style={{
      padding:'4rem 3rem',background:'rgba(0,0,0,0.6)',
      borderTop:'1px solid color-mix(in srgb,var(--color-secondary) 15%,transparent)',
    }}>
      <div style={{maxWidth:'72rem',margin:'0 auto',display:'flex',
        flexWrap:'wrap',alignItems:'center',justifyContent:'space-between',gap:'2rem'}}>
        <div>
          <p style={{fontSize:'1.5rem',fontWeight:900,color:'var(--color-secondary)',
            margin:'0 0 0.4rem',fontFamily:'var(--font-display)'}}>{brand}</p>
          <p style={{fontSize:'0.88rem',opacity:0.55,color:'var(--color-text)',margin:0}}>{tagline}</p>
        </div>
        <ul style={{display:'flex',flexWrap:'wrap',gap:'2rem',margin:0,padding:0,listStyle:'none'}}>
          {links.map(l => (
            <li key={l.href}>
              <Link href={l.href} style={{fontSize:'0.9rem',color:'var(--color-text)',
                fontWeight:600,textDecoration:'none',opacity:0.75,
                transition:'opacity 0.15s',}}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.opacity='1')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.opacity='0.75')}>
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div style={{maxWidth:'72rem',margin:'2rem auto 0',paddingTop:'2rem',
        borderTop:'1px solid rgba(255,255,255,0.06)',textAlign:'center'}}>
        <p style={{fontSize:'0.78rem',opacity:0.35,color:'var(--color-text)',margin:0}}>
          © {new Date().getFullYear()} {brand}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

// ── V1: Centered — everything centered, tagline large ────────────────────────
function FooterCentered({ brand, tagline, links }: FooterProps) {
  return (
    <footer style={{
      padding:'5rem 2rem',textAlign:'center',
      background:'var(--color-bg)',
      borderTop:'1px solid rgba(255,255,255,0.06)',
    }}>
      <p style={{fontSize:'2rem',fontWeight:900,color:'var(--color-secondary)',
        margin:'0 0 0.6rem',fontFamily:'var(--font-display)',letterSpacing:'-0.02em'}}>
        {brand}
      </p>
      <p style={{fontSize:'1rem',opacity:0.55,color:'var(--color-text)',margin:'0 0 2.5rem',maxWidth:'32rem',marginLeft:'auto',marginRight:'auto'}}>
        {tagline}
      </p>
      <ul style={{display:'flex',flexWrap:'wrap',gap:'2rem',margin:'0 0 3rem',padding:0,
        listStyle:'none',justifyContent:'center'}}>
        {links.map(l => (
          <li key={l.href}>
            <Link href={l.href} style={{fontSize:'0.9rem',color:'var(--color-text)',
              fontWeight:600,textDecoration:'none',opacity:0.7}}>{l.label}</Link>
          </li>
        ))}
      </ul>
      <p style={{fontSize:'0.75rem',opacity:0.3,color:'var(--color-text)',margin:0}}>
        © {new Date().getFullYear()} {brand}
      </p>
    </footer>
  );
}

// ── V2: Minimal — single line bar ────────────────────────────────────────────
function FooterMinimal({ brand, links }: FooterProps) {
  return (
    <footer style={{
      padding:'1.5rem 3rem',
      background:'rgba(0,0,0,0.8)',
      borderTop:'1px solid rgba(255,255,255,0.06)',
    }}>
      <div style={{maxWidth:'72rem',margin:'0 auto',display:'flex',
        alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'1rem'}}>
        <p style={{fontSize:'0.95rem',fontWeight:900,color:'var(--color-secondary)',
          margin:0,fontFamily:'var(--font-display)'}}>{brand}</p>
        <ul style={{display:'flex',gap:'1.5rem',margin:0,padding:0,listStyle:'none'}}>
          {links.map(l => (
            <li key={l.href}>
              <Link href={l.href} style={{fontSize:'0.8rem',color:'var(--color-text)',
                fontWeight:600,textDecoration:'none',opacity:0.55}}>{l.label}</Link>
            </li>
          ))}
        </ul>
        <p style={{fontSize:'0.75rem',opacity:0.3,color:'var(--color-text)',margin:0}}>
          © {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  );
}

// ── V3: BigBrand — enormous brand name as background text ────────────────────
function FooterBigBrand({ brand, tagline, links }: FooterProps) {
  return (
    <footer style={{
      padding:'5rem 3rem 3rem',background:'var(--color-bg)',
      borderTop:'1px solid rgba(255,255,255,0.06)',
      position:'relative',overflow:'hidden',
    }}>
      {/* Giant watermark brand */}
      <div style={{
        position:'absolute',bottom:'-1rem',left:0,right:0,textAlign:'center',
        fontSize:'clamp(4rem,16vw,12rem)',fontWeight:900,
        color:'var(--color-secondary)',opacity:0.04,
        fontFamily:'var(--font-display)',letterSpacing:'-0.04em',
        userSelect:'none',pointerEvents:'none',lineHeight:1,
      }}>{brand}</div>
      <div style={{position:'relative',zIndex:1,maxWidth:'72rem',margin:'0 auto'}}>
        <div style={{display:'flex',flexWrap:'wrap',justifyContent:'space-between',
          gap:'3rem',marginBottom:'4rem'}}>
          <div>
            <p style={{fontSize:'1.6rem',fontWeight:900,color:'var(--color-secondary)',
              margin:'0 0 0.6rem',fontFamily:'var(--font-display)',letterSpacing:'-0.02em'}}>
              {brand}
            </p>
            <p style={{fontSize:'0.9rem',opacity:0.55,color:'var(--color-text)',margin:0,maxWidth:'22rem'}}>
              {tagline}
            </p>
          </div>
          <ul style={{display:'flex',flexDirection:'column',gap:'0.75rem',margin:0,padding:0,listStyle:'none'}}>
            {links.map(l => (
              <li key={l.href}>
                <Link href={l.href} style={{
                  fontSize:'0.9rem',color:'var(--color-text)',fontWeight:600,
                  textDecoration:'none',opacity:0.65,
                  display:'flex',alignItems:'center',gap:'0.5rem',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.color='var(--color-secondary)';
                  (e.currentTarget as HTMLElement).style.opacity='1';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.color='var(--color-text)';
                  (e.currentTarget as HTMLElement).style.opacity='0.65';
                }}>
                  <span style={{fontSize:'0.5rem',opacity:0.5}}>▶</span> {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <p style={{fontSize:'0.75rem',opacity:0.3,color:'var(--color-text)',margin:0,
          borderTop:'1px solid rgba(255,255,255,0.06)',paddingTop:'1.5rem'}}>
          © {new Date().getFullYear()} {brand}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

// ── V4: DarkCard — raised dark card footer with glow ─────────────────────────
function FooterDarkCard({ brand, tagline, links }: FooterProps) {
  return (
    <footer style={{padding:'3rem 2rem',background:'var(--color-bg)'}}>
      <div style={{
        maxWidth:'68rem',margin:'0 auto',padding:'3rem',
        borderRadius:'2rem',
        background:'rgba(255,255,255,0.04)',
        border:'1px solid rgba(255,255,255,0.1)',
        boxShadow:'0 0 80px color-mix(in srgb,var(--color-secondary) 6%,transparent)',
      }}>
        <div style={{display:'flex',flexWrap:'wrap',justifyContent:'space-between',
          alignItems:'flex-start',gap:'2rem',marginBottom:'2.5rem',
          paddingBottom:'2.5rem',borderBottom:'1px solid rgba(255,255,255,0.07)'}}>
          <div>
            <p style={{fontSize:'1.4rem',fontWeight:900,color:'var(--color-secondary)',
              margin:'0 0 0.4rem',fontFamily:'var(--font-display)',letterSpacing:'-0.02em'}}>
              {brand}
            </p>
            <p style={{fontSize:'0.85rem',opacity:0.5,color:'var(--color-text)',margin:0}}>
              {tagline}
            </p>
          </div>
          <ul style={{display:'flex',flexWrap:'wrap',gap:'1.5rem',margin:0,padding:0,listStyle:'none',alignItems:'center'}}>
            {links.map(l => (
              <li key={l.href}>
                <Link href={l.href} style={{
                  fontSize:'0.875rem',color:'var(--color-text)',fontWeight:600,
                  textDecoration:'none',
                  padding:'0.4rem 1rem',borderRadius:'9999px',
                  border:'1px solid rgba(255,255,255,0.1)',
                  transition:'all 0.15s',display:'block',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor='var(--color-secondary)';
                  (e.currentTarget as HTMLElement).style.color='var(--color-secondary)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.1)';
                  (e.currentTarget as HTMLElement).style.color='var(--color-text)';
                }}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <p style={{fontSize:'0.75rem',opacity:0.3,color:'var(--color-text)',margin:0,textAlign:'center'}}>
          © {new Date().getFullYear()} {brand}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

export default function Footer() {
  const v = S.variants?.footer ?? 0;
  const props = {
    brand: SITE.footer.brand,
    tagline: SITE.footer.tagline,
    links: SITE.footer.links,
  };
  if (v === 1) return <FooterCentered {...props} />;
  if (v === 2) return <FooterMinimal {...props} />;
  if (v === 3) return <FooterBigBrand {...props} />;
  if (v === 4) return <FooterDarkCard {...props} />;
  return <FooterTwoCol {...props} />;
}
