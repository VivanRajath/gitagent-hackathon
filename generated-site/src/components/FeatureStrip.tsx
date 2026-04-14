'use client';
import { SITE } from '../app/site-content';

const S = SITE as any;
type Item = { icon: string; title: string; desc: string };
type FeatProps = { sectionTitle: string; items: Item[] };

// ── V0: IconGrid — centered icon cards in a flex grid ────────────────────────
function FeatIconGrid({ sectionTitle, items }: FeatProps) {
  return (
    <section style={{padding:'6rem 2rem',background:'var(--color-bg)'}}>
      <h2 style={{
        fontSize:'clamp(2rem,5vw,3.5rem)',fontWeight:900,textAlign:'center',
        marginBottom:'4rem',color:'var(--color-secondary)',
        fontFamily:'var(--font-display)',letterSpacing:'-0.02em',
      }}>{sectionTitle}</h2>
      <div style={{display:'flex',flexWrap:'wrap',gap:'2rem',justifyContent:'center',maxWidth:'72rem',margin:'0 auto'}}>
        {items.map((f, i) => (
          <div key={f.title} style={{
            display:'flex',flexDirection:'column',alignItems:'center',textAlign:'center',
            padding:'2.5rem 2rem',borderRadius:'1.5rem',width:'16rem',
            background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',
            transition:'transform 0.3s,background 0.3s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-6px)';
            e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
          }}>
            <span style={{fontSize:'3rem',marginBottom:'1.5rem',display:'block'}}>{f.icon}</span>
            <h3 style={{fontSize:'1.1rem',fontWeight:800,marginBottom:'0.75rem',
              color:'var(--color-secondary)',fontFamily:'var(--font-display)'}}>{f.title}</h3>
            <p style={{fontSize:'0.9rem',lineHeight:1.65,opacity:0.72,color:'var(--color-text)',margin:0}}>{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── V1: Numbered — big index numbers, horizontal dividers ─────────────────────
function FeatNumbered({ sectionTitle, items }: FeatProps) {
  return (
    <section style={{padding:'6rem 2rem',background:'var(--color-bg)'}}>
      <div style={{maxWidth:'64rem',margin:'0 auto'}}>
        <h2 style={{
          fontSize:'clamp(2rem,5vw,3rem)',fontWeight:900,
          marginBottom:'4rem',color:'var(--color-secondary)',
          fontFamily:'var(--font-display)',letterSpacing:'-0.02em',
        }}>{sectionTitle}</h2>
        {items.map((f, i) => (
          <div key={f.title} style={{
            display:'grid',gridTemplateColumns:'5rem 1fr',gap:'2rem',
            alignItems:'start',padding:'2.5rem 0',
            borderBottom:'1px solid rgba(255,255,255,0.07)',
          }}>
            <div style={{
              fontSize:'3.5rem',fontWeight:900,lineHeight:1,
              color:'var(--color-secondary)',fontFamily:'var(--font-display)',
              opacity:0.3,
            }}>
              {String(i + 1).padStart(2, '0')}
            </div>
            <div style={{display:'flex',gap:'2rem',alignItems:'center'}}>
              <span style={{fontSize:'2rem',flexShrink:0}}>{f.icon}</span>
              <div>
                <h3 style={{fontSize:'1.25rem',fontWeight:800,color:'var(--color-secondary)',
                  fontFamily:'var(--font-display)',marginBottom:'0.5rem'}}>{f.title}</h3>
                <p style={{fontSize:'0.95rem',lineHeight:1.7,opacity:0.7,color:'var(--color-text)',margin:0}}>{f.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── V2: Alternating — left/right alternating image-like panels ────────────────
function FeatAlternating({ sectionTitle, items }: FeatProps) {
  return (
    <section style={{padding:'6rem 2rem',background:'var(--color-bg)'}}>
      <div style={{maxWidth:'68rem',margin:'0 auto'}}>
        <h2 style={{
          fontSize:'clamp(2rem,5vw,3rem)',fontWeight:900,textAlign:'center',
          marginBottom:'5rem',color:'var(--color-secondary)',
          fontFamily:'var(--font-display)',letterSpacing:'-0.02em',
        }}>{sectionTitle}</h2>
        {items.map((f, i) => (
          <div key={f.title} style={{
            display:'grid',
            gridTemplateColumns: i % 2 === 0 ? '1fr 1fr' : '1fr 1fr',
            gap:'4rem',alignItems:'center',marginBottom:'6rem',
          }}>
            {i % 2 !== 0 && (
              <div style={{
                height:'16rem',borderRadius:'1.5rem',display:'flex',alignItems:'center',
                justifyContent:'center',fontSize:'6rem',
                background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',
                boxShadow:'inset 0 0 60px color-mix(in srgb,var(--color-secondary) 8%,transparent)',
              }}>
                {f.icon}
              </div>
            )}
            <div style={{padding: i % 2 === 0 ? '0 0 0 2rem' : '0 2rem 0 0'}}>
              <p style={{fontSize:'0.7rem',letterSpacing:'0.2em',textTransform:'uppercase',
                color:'var(--color-secondary)',fontWeight:700,marginBottom:'1rem'}}>
                Feature {String(i + 1).padStart(2, '0')}
              </p>
              <h3 style={{fontSize:'2rem',fontWeight:900,color:'var(--color-text)',
                fontFamily:'var(--font-display)',letterSpacing:'-0.02em',marginBottom:'1.25rem'}}>
                {f.title}
              </h3>
              <p style={{fontSize:'1.05rem',lineHeight:1.75,opacity:0.7,color:'var(--color-text)',margin:0}}>{f.desc}</p>
            </div>
            {i % 2 === 0 && (
              <div style={{
                height:'16rem',borderRadius:'1.5rem',display:'flex',alignItems:'center',
                justifyContent:'center',fontSize:'6rem',
                background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',
                boxShadow:'inset 0 0 60px color-mix(in srgb,var(--color-secondary) 8%,transparent)',
              }}>
                {f.icon}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

// ── V3: Timeline — vertical line, left/right alternating nodes ────────────────
function FeatTimeline({ sectionTitle, items }: FeatProps) {
  return (
    <section style={{padding:'6rem 2rem',background:'var(--color-bg)'}}>
      <div style={{maxWidth:'60rem',margin:'0 auto'}}>
        <h2 style={{
          fontSize:'clamp(2rem,5vw,3rem)',fontWeight:900,textAlign:'center',
          marginBottom:'5rem',color:'var(--color-secondary)',
          fontFamily:'var(--font-display)',letterSpacing:'-0.02em',
        }}>{sectionTitle}</h2>
        <div style={{position:'relative'}}>
          {/* Center line */}
          <div style={{
            position:'absolute',left:'50%',top:0,bottom:0,width:'2px',
            transform:'translateX(-50%)',
            background:'linear-gradient(to bottom,transparent,var(--color-secondary),transparent)',
            opacity:0.3,
          }}/>
          {items.map((f, i) => (
            <div key={f.title} style={{
              display:'flex',justifyContent: i%2===0 ? 'flex-end' : 'flex-start',
              paddingBottom:'4rem',position:'relative',
            }}>
              {/* Node dot */}
              <div style={{
                position:'absolute',left:'50%',top:'1rem',transform:'translateX(-50%)',
                width:'1rem',height:'1rem',borderRadius:'50%',
                background:'var(--color-secondary)',
                boxShadow:'0 0 16px color-mix(in srgb,var(--color-secondary) 60%,transparent)',
                zIndex:1,
              }}/>
              <div style={{
                width:'42%',padding:'2rem',borderRadius:'1rem',
                background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.1)',
                marginRight: i%2===0 ? '4rem' : 0,
                marginLeft: i%2===0 ? 0 : '4rem',
              }}>
                <span style={{fontSize:'2rem',display:'block',marginBottom:'1rem'}}>{f.icon}</span>
                <h3 style={{fontWeight:800,color:'var(--color-secondary)',fontFamily:'var(--font-display)',marginBottom:'0.6rem'}}>{f.title}</h3>
                <p style={{fontSize:'0.9rem',lineHeight:1.65,opacity:0.72,color:'var(--color-text)',margin:0}}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── V4: Cards — horizontal scroll cards with stat numbers ─────────────────────
function FeatCards({ sectionTitle, items }: FeatProps) {
  const stats = ['10×','99%','24/7','∞'];
  return (
    <section style={{padding:'6rem 0',background:'var(--color-bg)',overflow:'hidden'}}>
      <div style={{maxWidth:'72rem',margin:'0 auto',padding:'0 2rem'}}>
        <h2 style={{
          fontSize:'clamp(2rem,5vw,3rem)',fontWeight:900,
          marginBottom:'4rem',color:'var(--color-secondary)',
          fontFamily:'var(--font-display)',letterSpacing:'-0.02em',
        }}>{sectionTitle}</h2>
      </div>
      <div style={{display:'flex',gap:'1.5rem',padding:'0 2rem',overflowX:'auto',scrollbarWidth:'none'}}>
        {items.map((f, i) => (
          <div key={f.title} style={{
            flexShrink:0,width:'22rem',padding:'2.5rem',borderRadius:'1.5rem',
            background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.1)',
            borderTop:'4px solid var(--color-secondary)',
            transition:'transform 0.25s',
          }}
          onMouseEnter={e => e.currentTarget.style.transform='translateY(-6px)'}
          onMouseLeave={e => e.currentTarget.style.transform='translateY(0)'}>
            <div style={{
              fontSize:'2.5rem',fontWeight:900,color:'var(--color-secondary)',
              fontFamily:'var(--font-display)',opacity:0.25,marginBottom:'1.5rem',
            }}>{stats[i] ?? '★'}</div>
            <span style={{fontSize:'2.5rem',display:'block',marginBottom:'1rem'}}>{f.icon}</span>
            <h3 style={{fontWeight:800,color:'var(--color-secondary)',fontFamily:'var(--font-display)',marginBottom:'0.75rem'}}>{f.title}</h3>
            <p style={{fontSize:'0.9rem',lineHeight:1.65,opacity:0.72,color:'var(--color-text)',margin:0}}>{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function FeatureStrip() {
  const v = S.variants?.features ?? 0;
  const props = { sectionTitle: SITE.features.sectionTitle, items: SITE.features.items };
  if (v === 1) return <FeatNumbered {...props} />;
  if (v === 2) return <FeatAlternating {...props} />;
  if (v === 3) return <FeatTimeline {...props} />;
  if (v === 4) return <FeatCards {...props} />;
  return <FeatIconGrid {...props} />;
}
