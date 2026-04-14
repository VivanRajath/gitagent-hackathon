'use client';
import { SITE } from '../app/site-content';

const S = SITE as any;
type CTAProps = { headline: string; body: string; button: string; imageUrl: string };

// ── V0: Fullbleed — cinematic image BG, centered text, pulsing button ─────────
function CTAFullbleed({ headline, body, button, imageUrl }: CTAProps) {
  return (
    <section style={{position:'relative',overflow:'hidden',padding:'7rem 2rem',textAlign:'center',backgroundColor:'var(--color-primary)'}}>
      <img src={imageUrl} alt="cta" data-puter-zone="cta" style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',opacity:0.35}}/>
      <div style={{position:'absolute',inset:0,background:'linear-gradient(135deg,rgba(0,0,0,0.8) 0%,rgba(0,0,0,0.4) 100%)'}}/>
      <div className="hero-scan" style={{position:'absolute',inset:0,zIndex:1,opacity:0.06}}/>
      <div style={{position:'relative',zIndex:10,maxWidth:'46rem',margin:'0 auto'}}>
        <h2 className="neon-glow" style={{fontSize:'clamp(2rem,6vw,3.5rem)',fontWeight:900,marginBottom:'1.25rem',
          color:'var(--color-secondary)',lineHeight:1.1,letterSpacing:'-0.02em',fontFamily:'var(--font-display)'}}>
          {headline}
        </h2>
        <p style={{fontSize:'1.1rem',lineHeight:1.75,marginBottom:'3rem',opacity:0.85,
          color:'var(--color-text)',maxWidth:'36rem',margin:'0 auto 3rem'}}>
          {body}
        </p>
        <button className="float accent-pulse" style={{
          display:'inline-flex',alignItems:'center',gap:'0.5rem',
          padding:'1.1rem 2.8rem',borderRadius:'9999px',fontWeight:800,fontSize:'1.1rem',
          background:'var(--color-secondary)',color:'#000',border:'none',cursor:'pointer',
          fontFamily:'var(--font-display)',
        }}>
          {button} →
        </button>
      </div>
    </section>
  );
}

// ── V1: Split — left text, right image panel ──────────────────────────────────
function CTASplit({ headline, body, button, imageUrl }: CTAProps) {
  return (
    <section style={{display:'grid',gridTemplateColumns:'1fr 1fr',overflow:'hidden',
      background:'var(--color-bg)'}}>
      <div style={{
        padding:'6rem 4rem',display:'flex',flexDirection:'column',justifyContent:'center',
        borderRight:'1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{
          display:'inline-flex',width:'fit-content',padding:'0.4rem 1rem',
          borderRadius:'9999px',marginBottom:'2rem',
          border:'1px solid color-mix(in srgb,var(--color-secondary) 35%,transparent)',
          background:'color-mix(in srgb,var(--color-secondary) 10%,transparent)',
        }}>
          <span style={{fontSize:'0.72rem',fontWeight:700,letterSpacing:'0.15em',
            textTransform:'uppercase',color:'var(--color-secondary)'}}>
            Take action
          </span>
        </div>
        <h2 style={{fontSize:'clamp(2rem,4vw,3.5rem)',fontWeight:900,lineHeight:1.1,
          color:'var(--color-text)',fontFamily:'var(--font-display)',letterSpacing:'-0.02em',
          marginBottom:'1.5rem'}}>
          {headline}
        </h2>
        <p style={{fontSize:'1rem',lineHeight:1.75,opacity:0.7,color:'var(--color-text)',marginBottom:'2.5rem',maxWidth:'30rem'}}>
          {body}
        </p>
        <div style={{display:'flex',gap:'1rem',flexWrap:'wrap'}}>
          <button style={{
            padding:'0.9rem 2rem',borderRadius:'0.5rem',fontWeight:700,
            background:'var(--color-secondary)',color:'#000',
            border:'none',cursor:'pointer',fontSize:'0.95rem',fontFamily:'var(--font-display)',
          }}>{button}</button>
          <button style={{
            padding:'0.9rem 2rem',borderRadius:'0.5rem',fontWeight:600,
            background:'transparent',color:'var(--color-text)',
            border:'1px solid rgba(255,255,255,0.18)',cursor:'pointer',fontSize:'0.95rem',
          }}>Learn more</button>
        </div>
      </div>
      <div style={{position:'relative',overflow:'hidden',minHeight:'24rem'}}>
        <img src={imageUrl} alt="cta" data-puter-zone="cta" style={{width:'100%',height:'100%',objectFit:'cover',filter:'brightness(0.7)'}}/>
        <div style={{position:'absolute',inset:0,background:'linear-gradient(to right,var(--color-bg) 0%,transparent 30%)'}}/>
      </div>
    </section>
  );
}

// ── V2: Minimal — clean text-only, no image, thick left border accent ─────────
function CTAMinimal({ headline, body, button }: CTAProps) {
  return (
    <section style={{padding:'6rem 2rem',background:'var(--color-bg)'}}>
      <div style={{maxWidth:'56rem',margin:'0 auto',
        borderLeft:'4px solid var(--color-secondary)',paddingLeft:'3rem'}}>
        <h2 style={{fontSize:'clamp(2rem,5vw,4rem)',fontWeight:900,lineHeight:1.05,
          color:'var(--color-text)',fontFamily:'var(--font-display)',letterSpacing:'-0.03em',
          marginBottom:'1.5rem'}}>
          {headline.split(' ').map((w,i) => (
            <span key={i} style={{color: i===0||i===2 ? 'var(--color-secondary)' : 'var(--color-text)'}}>{w} </span>
          ))}
        </h2>
        <p style={{fontSize:'1.1rem',lineHeight:1.75,opacity:0.7,color:'var(--color-text)',marginBottom:'2.5rem',maxWidth:'40rem'}}>
          {body}
        </p>
        <button style={{
          padding:'0.85rem 2rem',background:'transparent',
          border:'2px solid var(--color-secondary)',color:'var(--color-secondary)',
          cursor:'pointer',fontWeight:700,fontSize:'0.9rem',letterSpacing:'0.06em',
          textTransform:'uppercase',fontFamily:'var(--font-display)',
          transition:'all 0.2s',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.background = 'var(--color-secondary)';
          (e.currentTarget as HTMLElement).style.color = '#000';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.background = 'transparent';
          (e.currentTarget as HTMLElement).style.color = 'var(--color-secondary)';
        }}>
          {button}
        </button>
      </div>
    </section>
  );
}

// ── V3: GlassCard — frosted card floating over dark section ───────────────────
function CTAGlassCard({ headline, body, button, imageUrl }: CTAProps) {
  return (
    <section style={{position:'relative',padding:'8rem 2rem',overflow:'hidden',background:'var(--color-bg)'}}>
      <img src={imageUrl} alt="cta" data-puter-zone="cta" style={{
        position:'absolute',inset:0,width:'100%',height:'100%',
        objectFit:'cover',opacity:0.15,filter:'blur(8px)',
      }}/>
      <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.6)'}}/>
      <div style={{
        position:'relative',zIndex:10,maxWidth:'44rem',margin:'0 auto',
        padding:'3.5rem',borderRadius:'2rem',
        background:'rgba(255,255,255,0.05)',backdropFilter:'blur(32px)',
        border:'1px solid rgba(255,255,255,0.12)',
        boxShadow:'0 0 80px color-mix(in srgb,var(--color-secondary) 15%,transparent)',
        textAlign:'center',
      }}>
        <div style={{
          width:'3rem',height:'3rem',borderRadius:'50%',
          background:'var(--color-secondary)',margin:'0 auto 2rem',
          display:'flex',alignItems:'center',justifyContent:'center',
          fontSize:'1.4rem',color:'#000',
        }}>★</div>
        <h2 style={{fontSize:'clamp(1.8rem,4vw,3rem)',fontWeight:900,color:'var(--color-text)',
          fontFamily:'var(--font-display)',letterSpacing:'-0.02em',marginBottom:'1.25rem'}}>
          {headline}
        </h2>
        <p style={{fontSize:'1rem',lineHeight:1.75,opacity:0.75,color:'var(--color-text)',marginBottom:'2.5rem'}}>
          {body}
        </p>
        <button style={{
          padding:'1rem 2.5rem',borderRadius:'9999px',fontWeight:800,
          background:'var(--color-secondary)',color:'#000',border:'none',cursor:'pointer',
          fontSize:'1rem',fontFamily:'var(--font-display)',letterSpacing:'0.04em',
          boxShadow:'0 0 24px color-mix(in srgb,var(--color-secondary) 50%,transparent)',
        }}>{button}</button>
        <p style={{margin:'1.5rem 0 0',fontSize:'0.75rem',opacity:0.45,color:'var(--color-text)'}}>
          No credit card required
        </p>
      </div>
    </section>
  );
}

// ── V4: HorizBar — thin full-width sticky-style banner ────────────────────────
function CTAHorizBar({ headline, body, button }: CTAProps) {
  return (
    <section style={{
      padding:'3rem 2rem',
      background:'linear-gradient(135deg,var(--color-primary) 0%,color-mix(in srgb,var(--color-secondary) 15%,var(--color-primary)) 100%)',
      borderTop:'1px solid rgba(255,255,255,0.08)',
      borderBottom:'1px solid rgba(255,255,255,0.08)',
    }}>
      <div style={{maxWidth:'72rem',margin:'0 auto',display:'flex',
        alignItems:'center',gap:'3rem',flexWrap:'wrap',justifyContent:'space-between'}}>
        <div style={{flex:'1 1 28rem'}}>
          <h2 style={{fontSize:'clamp(1.5rem,3vw,2.25rem)',fontWeight:900,color:'var(--color-secondary)',
            fontFamily:'var(--font-display)',letterSpacing:'-0.02em',marginBottom:'0.5rem'}}>
            {headline}
          </h2>
          <p style={{fontSize:'0.95rem',lineHeight:1.6,opacity:0.75,color:'var(--color-text)',margin:0}}>
            {body}
          </p>
        </div>
        <div style={{display:'flex',gap:'1rem',alignItems:'center',flexShrink:0}}>
          <button style={{
            padding:'0.85rem 2rem',borderRadius:'9999px',fontWeight:700,
            background:'var(--color-secondary)',color:'#000',border:'none',
            cursor:'pointer',fontSize:'0.9rem',fontFamily:'var(--font-display)',
            letterSpacing:'0.04em',whiteSpace:'nowrap',
          }}>{button}</button>
          <button style={{
            background:'none',border:'none',cursor:'pointer',
            color:'var(--color-text)',fontSize:'0.9rem',opacity:0.6,whiteSpace:'nowrap',
          }}>Maybe later →</button>
        </div>
      </div>
    </section>
  );
}

export default function CTABanner() {
  const v = S.variants?.cta ?? 0;
  const props = {
    headline: SITE.cta.headline,
    body: SITE.cta.body,
    button: SITE.cta.button,
    imageUrl: SITE.cta.imageUrl,
  };
  if (v === 1) return <CTASplit {...props} />;
  if (v === 2) return <CTAMinimal {...props} />;
  if (v === 3) return <CTAGlassCard {...props} />;
  if (v === 4) return <CTAHorizBar {...props} />;
  return <CTAFullbleed {...props} />;
}
