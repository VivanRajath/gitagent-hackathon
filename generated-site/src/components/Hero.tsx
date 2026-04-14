'use client';
import { useState, useEffect } from 'react';
import { SITE } from '../app/site-content';

const S = SITE as any;
type HeroProps = { headline: string; subtext: string; cta1: string; cta2: string; imageUrl: string };

// ── V0: Cinematic — full-bleed image, centered glowing text ──────────────────
function HeroCinematic({ headline, subtext, cta1, cta2, imageUrl }: HeroProps) {
  return (
    <section style={{position:'relative',minHeight:'100vh',display:'flex',
      alignItems:'center',justifyContent:'center',overflow:'hidden',
      backgroundColor:'var(--color-bg)'}}>
      <img src={imageUrl} alt="hero background" data-puter-zone="hero" style={{position:'absolute',inset:0,
        width:'100%',height:'100%',objectFit:'cover',opacity:0.55}}/>
      <div style={{position:'absolute',inset:0,
        background:'linear-gradient(to bottom,rgba(0,0,0,0.1) 0%,rgba(0,0,0,0.78) 100%)'}}/>
      <div className="hero-scan" style={{position:'absolute',inset:0,zIndex:1,opacity:0.08}}/>
      <div style={{position:'relative',zIndex:10,textAlign:'center',
        padding:'0 1.5rem',maxWidth:'52rem',margin:'0 auto'}}>
        <h1 className="fade-in-up neon-glow" style={{
          fontSize:'clamp(2.8rem,8vw,5rem)',fontWeight:900,
          marginBottom:'1.5rem',color:'var(--color-secondary)',
          lineHeight:1.05,fontFamily:'var(--font-display)',letterSpacing:'-0.01em'}}>
          {headline}
        </h1>
        <p className="fade-in-up-delay-1" style={{
          fontSize:'1.15rem',lineHeight:1.75,color:'var(--color-text)',opacity:0.88,
          maxWidth:'38rem',margin:'0 auto 2.5rem'}}>
          {subtext}
        </p>
        <div className="fade-in-up-delay-2" style={{display:'flex',flexWrap:'wrap',gap:'1rem',justifyContent:'center'}}>
          <button className="accent-pulse" style={{
            padding:'0.9rem 2.25rem',borderRadius:'9999px',fontWeight:700,
            background:'var(--color-secondary)',color:'var(--color-on-secondary)',
            border:'none',cursor:'pointer',fontSize:'1.05rem',
            fontFamily:'var(--font-display)',letterSpacing:'0.03em'}}>
            {cta1}
          </button>
          <button style={{
            padding:'0.9rem 2.25rem',borderRadius:'9999px',fontWeight:700,
            background:'transparent',color:'var(--color-secondary)',
            border:'2px solid var(--color-secondary)',cursor:'pointer',
            fontSize:'1.05rem',fontFamily:'var(--font-display)',backdropFilter:'blur(8px)'}}>
            {cta2}
          </button>
        </div>
      </div>
    </section>
  );
}

// ── V1: Split — text left 55%, image right 45%, no bleed ─────────────────────
function HeroSplit({ headline, subtext, cta1, cta2, imageUrl }: HeroProps) {
  return (
    <section style={{
      minHeight:'100vh',display:'grid',gridTemplateColumns:'55% 45%',
      alignItems:'center',background:'var(--color-bg)',overflow:'hidden',
    }}>
      <div style={{padding:'5rem 3rem 5rem 6rem',display:'flex',flexDirection:'column',justifyContent:'center'}}>
        <p style={{fontSize:'0.75rem',letterSpacing:'0.2em',color:'var(--color-secondary)',
          marginBottom:'1.5rem',textTransform:'uppercase',fontWeight:600}}>
          — Welcome
        </p>
        <h1 style={{
          fontSize:'clamp(2.5rem,5vw,4.5rem)',fontWeight:900,lineHeight:1.08,
          color:'var(--color-text)',fontFamily:'var(--font-display)',
          letterSpacing:'-0.02em',marginBottom:'1.5rem',
        }}>
          {headline.split(' ').slice(0,3).join(' ')}{' '}
          <span style={{color:'var(--color-secondary)'}}>{headline.split(' ').slice(3).join(' ')}</span>
        </h1>
        <p style={{fontSize:'1.1rem',lineHeight:1.7,opacity:0.75,
          color:'var(--color-text)',marginBottom:'2.5rem',maxWidth:'32rem'}}>
          {subtext}
        </p>
        <div style={{display:'flex',gap:'1rem',flexWrap:'wrap'}}>
          <button style={{
            padding:'0.85rem 2rem',borderRadius:'0.5rem',fontWeight:700,
            background:'var(--color-secondary)',color:'var(--color-on-secondary)',border:'none',cursor:'pointer',
            fontSize:'0.95rem',fontFamily:'var(--font-display)',letterSpacing:'0.04em',
          }}>
            {cta1}
          </button>
          <button style={{
            padding:'0.85rem 2rem',borderRadius:'0.5rem',fontWeight:700,
            background:'transparent',color:'var(--color-text)',
            border:'1px solid rgba(255,255,255,0.2)',cursor:'pointer',fontSize:'0.95rem',
          }}>
            {cta2} →
          </button>
        </div>
      </div>
      <div style={{position:'relative',height:'100vh',overflow:'hidden'}}>
        <img src={imageUrl} alt="hero" data-puter-zone="hero" style={{
          width:'100%',height:'100%',objectFit:'cover',
          filter:'saturate(0.8) brightness(0.85)',
        }}/>
        <div style={{position:'absolute',inset:0,
          background:'linear-gradient(to right,var(--color-bg) 0%,transparent 30%)',
        }}/>
        <div style={{
          position:'absolute',bottom:'3rem',left:'1.5rem',right:'1.5rem',
          padding:'1.5rem',borderRadius:'1rem',
          background:'rgba(255,255,255,0.06)',backdropFilter:'blur(16px)',
          border:'1px solid rgba(255,255,255,0.12)',
        }}>
          <p style={{margin:0,fontSize:'0.8rem',opacity:0.6,color:'var(--color-text)',marginBottom:'0.5rem'}}>FEATURED</p>
          <p style={{margin:0,fontWeight:700,color:'var(--color-secondary)',fontSize:'1rem',fontFamily:'var(--font-display)'}}>
            {headline}
          </p>
        </div>
      </div>
    </section>
  );
}

// ── V2: Bold Typography — massive headline, gradient text, no image bg ────────
function HeroBoldType({ headline, subtext, cta1, cta2 }: HeroProps) {
  return (
    <section style={{
      minHeight:'100vh',display:'flex',flexDirection:'column',
      alignItems:'center',justifyContent:'center',
      background:'var(--color-bg)',padding:'4rem 2rem',
      textAlign:'center',overflow:'hidden',position:'relative',
    }}>
      <div style={{
        position:'absolute',top:'-10rem',left:'50%',transform:'translateX(-50%)',
        width:'80rem',height:'40rem',borderRadius:'50%',
        background:'radial-gradient(ellipse,color-mix(in srgb,var(--color-secondary) 12%,transparent) 0%,transparent 70%)',
        pointerEvents:'none',
      }}/>
      <p style={{
        fontSize:'0.72rem',letterSpacing:'0.25em',color:'var(--color-secondary)',
        marginBottom:'2rem',textTransform:'uppercase',fontWeight:700,
        border:'1px solid color-mix(in srgb,var(--color-secondary) 30%,transparent)',
        padding:'0.3rem 1rem',borderRadius:'9999px',display:'inline-block',
      }}>
        Introducing
      </p>
      <h1 style={{
        fontSize:'clamp(4rem,14vw,10rem)',fontWeight:900,lineHeight:0.9,
        fontFamily:'var(--font-display)',letterSpacing:'-0.04em',
        marginBottom:'2.5rem',maxWidth:'18ch',
        background:'linear-gradient(135deg,var(--color-text) 0%,var(--color-secondary) 50%,var(--color-primary) 100%)',
        WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text',
      }}>
        {headline}
      </h1>
      <p style={{
        fontSize:'1.2rem',lineHeight:1.7,opacity:0.65,
        color:'var(--color-text)',marginBottom:'3rem',maxWidth:'36rem',
      }}>
        {subtext}
      </p>
      <div style={{display:'flex',gap:'1rem',justifyContent:'center',flexWrap:'wrap'}}>
        <button style={{
          padding:'1rem 2.5rem',fontWeight:800,fontSize:'1rem',
          background:'var(--color-secondary)',color:'var(--color-on-secondary)',
          border:'none',cursor:'pointer',fontFamily:'var(--font-display)',
          letterSpacing:'0.06em',textTransform:'uppercase',
          clipPath:'polygon(0.5rem 0%,100% 0%,calc(100% - 0.5rem) 100%,0% 100%)',
        }}>
          {cta1}
        </button>
        <button style={{
          padding:'1rem 2.5rem',fontWeight:600,fontSize:'1rem',
          background:'transparent',color:'var(--color-secondary)',
          border:'2px solid var(--color-secondary)',cursor:'pointer',
          letterSpacing:'0.04em',
        }}>
          {cta2}
        </button>
      </div>
      <div style={{
        marginTop:'6rem',display:'flex',gap:'3rem',opacity:0.4,
        fontSize:'0.75rem',letterSpacing:'0.1em',color:'var(--color-text)',
        textTransform:'uppercase',
      }}>
        {['Award Winning','Industry Leader','Trusted Globally'].map(t => (
          <span key={t}>{t}</span>
        ))}
      </div>
    </section>
  );
}

// ── V3: Magazine — asymmetric headline overlapping a large image card ─────────
function HeroMagazine({ headline, subtext, cta1, cta2, imageUrl }: HeroProps) {
  return (
    <section style={{
      minHeight:'100vh',background:'var(--color-bg)',
      display:'grid',gridTemplateColumns:'1fr 1fr',gridTemplateRows:'auto',
      alignItems:'stretch',overflow:'hidden',
    }}>
      {/* Left: stacked content */}
      <div style={{
        padding:'6rem 3rem 4rem 5rem',display:'flex',flexDirection:'column',
        justifyContent:'space-between',borderRight:'1px solid rgba(255,255,255,0.06)',
      }}>
        <div>
          <div style={{display:'flex',gap:'0.5rem',marginBottom:'3rem'}}>
            {['Design','Tech','Innovation'].map((tag,i) => (
              <span key={tag} style={{
                fontSize:'0.65rem',padding:'0.25rem 0.6rem',borderRadius:'3px',
                background: i===0 ? 'var(--color-secondary)' : 'rgba(255,255,255,0.08)',
                color: i===0 ? 'var(--color-on-secondary)' : 'var(--color-text)',
                fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',
              }}>{tag}</span>
            ))}
          </div>
          <h1 style={{
            fontSize:'clamp(3rem,6vw,5.5rem)',fontWeight:900,lineHeight:1.0,
            color:'var(--color-text)',fontFamily:'var(--font-display)',
            letterSpacing:'-0.03em',marginBottom:'2rem',
          }}>
            {headline.split(' ').slice(0,2).join(' ')}{'\n'}
            <span style={{color:'var(--color-secondary)',display:'block'}}>
              {headline.split(' ').slice(2).join(' ')}
            </span>
          </h1>
          <p style={{
            fontSize:'1rem',lineHeight:1.75,opacity:0.65,
            color:'var(--color-text)',maxWidth:'28rem',
          }}>
            {subtext}
          </p>
        </div>
        <div style={{display:'flex',gap:'1rem',paddingTop:'2rem',borderTop:'1px solid rgba(255,255,255,0.08)'}}>
          <button style={{
            flex:1,padding:'1rem',fontWeight:700,fontSize:'0.9rem',
            background:'var(--color-secondary)',color:'var(--color-on-secondary)',border:'none',
            cursor:'pointer',fontFamily:'var(--font-display)',borderRadius:'0.25rem',
          }}>{cta1}</button>
          <button style={{
            flex:1,padding:'1rem',fontWeight:700,fontSize:'0.9rem',
            background:'transparent',color:'var(--color-text)',
            border:'1px solid rgba(255,255,255,0.15)',cursor:'pointer',borderRadius:'0.25rem',
          }}>{cta2}</button>
        </div>
      </div>
      {/* Right: large image with overlay card */}
      <div style={{position:'relative',overflow:'hidden'}}>
        <img src={imageUrl} alt="hero" data-puter-zone="hero" style={{
          width:'100%',height:'100%',objectFit:'cover',
          filter:'brightness(0.7) saturate(0.9)',
        }}/>
        <div style={{
          position:'absolute',top:'2rem',right:'2rem',left:'2rem',
          padding:'1.5rem',background:'rgba(0,0,0,0.75)',
          backdropFilter:'blur(20px)',borderRadius:'0.75rem',
          borderLeft:'3px solid var(--color-secondary)',
        }}>
          <p style={{margin:0,fontSize:'0.7rem',letterSpacing:'0.15em',
            color:'var(--color-secondary)',textTransform:'uppercase',fontWeight:700,marginBottom:'0.5rem'}}>
            Cover Story
          </p>
          <p style={{margin:0,fontWeight:800,fontSize:'1.1rem',
            color:'var(--color-text)',fontFamily:'var(--font-display)'}}>
            {headline}
          </p>
        </div>
      </div>
    </section>
  );
}

// ── V4: Asymmetric — dark cinematic, glitch strip accent, scroll indicator ───
function HeroAsymmetric({ headline, subtext, cta1, cta2, imageUrl }: HeroProps) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 3000);
    return () => clearInterval(t);
  }, []);
  const glitch = tick % 5 === 0;
  return (
    <section style={{
      minHeight:'100vh',position:'relative',display:'flex',
      alignItems:'flex-end',overflow:'hidden',background:'#000',
    }}>
      <img src={imageUrl} alt="hero" data-puter-zone="hero" style={{
        position:'absolute',inset:0,width:'100%',height:'100%',
        objectFit:'cover',opacity:0.4,
        filter:`saturate(0.6) ${glitch ? 'hue-rotate(20deg)' : ''}`,
        transition:'filter 0.1s',
      }}/>
      <div style={{position:'absolute',inset:0,
        background:'linear-gradient(to top right,rgba(0,0,0,0.95) 0%,rgba(0,0,0,0.3) 60%,transparent 100%)',
      }}/>
      {/* Vertical accent strip */}
      <div style={{
        position:'absolute',left:'4rem',top:0,bottom:0,width:'3px',
        background:'linear-gradient(to bottom,transparent,var(--color-secondary),transparent)',
        opacity:0.6,
      }}/>
      <div style={{position:'relative',zIndex:10,padding:'0 4.5rem 6rem',maxWidth:'56rem'}}>
        <p style={{
          fontSize:'0.7rem',letterSpacing:'0.25em',color:'var(--color-secondary)',
          marginBottom:'1.5rem',textTransform:'uppercase',fontWeight:700,
          display:'flex',alignItems:'center',gap:'0.75rem',
        }}>
          <span style={{display:'inline-block',width:'2rem',height:'1px',background:'var(--color-secondary)'}}/>
          Featured
        </p>
        <h1 style={{
          fontSize:'clamp(3rem,8vw,6.5rem)',fontWeight:900,lineHeight:0.95,
          color:'var(--color-text)',fontFamily:'var(--font-display)',
          letterSpacing:'-0.03em',marginBottom:'2rem',
          textShadow: glitch
            ? '2px 0 var(--color-secondary),-2px 0 var(--color-primary)'
            : 'none',
          transition:'text-shadow 0.05s',
        }}>
          {headline}
        </h1>
        <p style={{
          fontSize:'1.1rem',lineHeight:1.7,opacity:0.7,
          color:'var(--color-text)',marginBottom:'3rem',maxWidth:'34rem',
        }}>
          {subtext}
        </p>
        <div style={{display:'flex',gap:'1.25rem',alignItems:'center',flexWrap:'wrap'}}>
          <button style={{
            padding:'0.9rem 2.25rem',fontWeight:800,fontSize:'0.95rem',
            background:'var(--color-secondary)',color:'var(--color-on-secondary)',border:'none',
            cursor:'pointer',fontFamily:'var(--font-display)',letterSpacing:'0.05em',
            textTransform:'uppercase',
          }}>
            {cta1}
          </button>
          <button style={{
            background:'none',border:'none',cursor:'pointer',
            color:'var(--color-text)',fontSize:'0.9rem',
            display:'flex',alignItems:'center',gap:'0.5rem',fontWeight:600,
            opacity:0.75,
          }}>
            ▶ {cta2}
          </button>
        </div>
      </div>
      {/* Scroll indicator */}
      <div style={{
        position:'absolute',bottom:'2rem',right:'3rem',
        display:'flex',flexDirection:'column',alignItems:'center',gap:'0.4rem',
        opacity:0.4,
      }}>
        <span style={{fontSize:'0.6rem',letterSpacing:'0.15em',textTransform:'uppercase',color:'var(--color-text)'}}>Scroll</span>
        <div style={{width:'1px',height:'3rem',background:'var(--color-secondary)'}}/>
      </div>
    </section>
  );
}

export default function Hero() {
  const v = S.variants?.hero ?? 0;
  const props = {
    headline: SITE.hero.headline,
    subtext: SITE.hero.subtext,
    cta1: SITE.hero.cta1,
    cta2: SITE.hero.cta2,
    imageUrl: SITE.hero.imageUrl,
  };
  if (v === 1) return <HeroSplit {...props} />;
  if (v === 2) return <HeroBoldType {...props} />;
  if (v === 3) return <HeroMagazine {...props} />;
  if (v === 4) return <HeroAsymmetric {...props} />;
  return <HeroCinematic {...props} />;
}
