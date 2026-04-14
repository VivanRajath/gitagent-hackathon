'use client';
import { useState, useRef } from 'react';
import { SITE } from '../app/site-content';

const S = SITE as any;
type Card = { title: string; desc: string; imageUrl: string };
type CardsProps = { cards: Card[] };

// ── V0: Grid — classic 3-column responsive cards ─────────────────────────────
function CardsGrid({ cards }: CardsProps) {
  return (
    <section style={{padding:'6rem 2rem',background:'var(--color-bg)'}}>
      <div style={{maxWidth:'72rem',margin:'0 auto'}}>
        <h2 style={{
          fontSize:'clamp(2rem,5vw,3.5rem)',fontWeight:900,textAlign:'center',
          marginBottom:'3.5rem',color:'var(--color-secondary)',
          fontFamily:'var(--font-display)',letterSpacing:'-0.02em',
        }}>Featured</h2>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(22rem,1fr))',gap:'2rem'}}>
          {cards.map((c, i) => (
            <div key={i} style={{
              borderRadius:'1rem',overflow:'hidden',
              background:'rgba(255,255,255,0.04)',
              border:'1px solid rgba(255,255,255,0.1)',
              borderTop:'3px solid var(--color-secondary)',
              transition:'transform 0.3s ease,box-shadow 0.3s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-8px)';
              e.currentTarget.style.boxShadow = '0 24px 48px rgba(0,0,0,0.5),0 0 24px color-mix(in srgb,var(--color-secondary) 20%,transparent)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}>
              <img src={c.imageUrl} alt={c.title} style={{width:'100%',height:'12rem',objectFit:'cover'}}/>
              <div style={{padding:'1.5rem'}}>
                <h3 style={{fontSize:'1.1rem',fontWeight:800,color:'var(--color-secondary)',
                  fontFamily:'var(--font-display)',marginBottom:'0.6rem'}}>{c.title}</h3>
                <p style={{fontSize:'0.9rem',lineHeight:1.65,opacity:0.75,color:'var(--color-text)',margin:0}}>{c.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── V1: Carousel — horizontal drag-scroll strip with peek effect ──────────────
function CardsCarousel({ cards }: CardsProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const scroll = (dir: number) => {
    const el = ref.current; if (!el) return;
    const w = el.offsetWidth;
    el.scrollBy({ left: dir * w * 0.75, behavior: 'smooth' });
  };
  return (
    <section style={{padding:'6rem 0',background:'var(--color-bg)',overflow:'hidden'}}>
      <div style={{maxWidth:'72rem',margin:'0 auto',padding:'0 2rem'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',marginBottom:'2.5rem'}}>
          <h2 style={{fontSize:'clamp(2rem,5vw,3rem)',fontWeight:900,color:'var(--color-secondary)',
            fontFamily:'var(--font-display)',letterSpacing:'-0.02em',margin:0}}>Explore</h2>
          <div style={{display:'flex',gap:'0.5rem'}}>
            {['←','→'].map((a,i) => (
              <button key={a} onClick={() => scroll(i===0?-1:1)} style={{
                width:'2.5rem',height:'2.5rem',borderRadius:'50%',
                background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.12)',
                color:'var(--color-text)',cursor:'pointer',fontSize:'1rem',display:'flex',
                alignItems:'center',justifyContent:'center',
              }}>{a}</button>
            ))}
          </div>
        </div>
      </div>
      <div ref={ref} style={{
        display:'flex',gap:'1.5rem',overflowX:'auto',
        padding:'1rem 2rem 2rem',scrollSnapType:'x mandatory',
        scrollbarWidth:'none',
      }}>
        {cards.map((c, i) => (
          <div key={i} onClick={() => setActive(i)} style={{
            flexShrink:0,width:'28rem',borderRadius:'1.25rem',overflow:'hidden',
            scrollSnapAlign:'start',cursor:'pointer',
            background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.1)',
            outline: active === i ? '2px solid var(--color-secondary)' : '2px solid transparent',
            transition:'outline 0.2s',
          }}>
            <img src={c.imageUrl} alt={c.title} style={{width:'100%',height:'15rem',objectFit:'cover'}}/>
            <div style={{padding:'1.5rem'}}>
              <h3 style={{fontWeight:800,color:'var(--color-secondary)',fontFamily:'var(--font-display)',marginBottom:'0.5rem'}}>{c.title}</h3>
              <p style={{fontSize:'0.875rem',lineHeight:1.65,opacity:0.75,color:'var(--color-text)',margin:0}}>{c.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── V2: Featured — one large card + stacked smalls ────────────────────────────
function CardsFeatured({ cards }: CardsProps) {
  const [main, ...rest] = cards;
  return (
    <section style={{padding:'6rem 2rem',background:'var(--color-bg)'}}>
      <div style={{maxWidth:'72rem',margin:'0 auto'}}>
        <h2 style={{
          fontSize:'clamp(2rem,5vw,3rem)',fontWeight:900,marginBottom:'3rem',
          color:'var(--color-secondary)',fontFamily:'var(--font-display)',letterSpacing:'-0.02em',
        }}>Top Stories</h2>
        <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:'1.5rem',alignItems:'start'}}>
          <div style={{
            borderRadius:'1.25rem',overflow:'hidden',
            background:'rgba(255,255,255,0.04)',
            border:'1px solid rgba(255,255,255,0.1)',
          }}>
            <img src={main.imageUrl} alt={main.title} style={{width:'100%',height:'22rem',objectFit:'cover'}}/>
            <div style={{padding:'2rem'}}>
              <span style={{
                fontSize:'0.65rem',fontWeight:700,letterSpacing:'0.15em',
                textTransform:'uppercase',color:'var(--color-secondary)',
                background:'color-mix(in srgb,var(--color-secondary) 15%,transparent)',
                padding:'0.2rem 0.6rem',borderRadius:'3px',
              }}>Featured</span>
              <h3 style={{fontSize:'1.75rem',fontWeight:900,color:'var(--color-text)',
                fontFamily:'var(--font-display)',margin:'1rem 0 0.75rem',letterSpacing:'-0.02em'}}>{main.title}</h3>
              <p style={{fontSize:'1rem',lineHeight:1.7,opacity:0.7,color:'var(--color-text)',margin:0}}>{main.desc}</p>
            </div>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
            {rest.map((c, i) => (
              <div key={i} style={{
                borderRadius:'1rem',overflow:'hidden',display:'flex',gap:'1rem',
                background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.1)',
                padding:'1rem',alignItems:'center',
              }}>
                <img src={c.imageUrl} alt={c.title} style={{width:'5rem',height:'5rem',objectFit:'cover',borderRadius:'0.5rem',flexShrink:0}}/>
                <div>
                  <h4 style={{fontWeight:700,color:'var(--color-secondary)',fontFamily:'var(--font-display)',
                    margin:'0 0 0.35rem',fontSize:'0.95rem'}}>{c.title}</h4>
                  <p style={{fontSize:'0.8rem',opacity:0.65,color:'var(--color-text)',margin:0,lineHeight:1.5}}>{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── V3: Masonry — 2-col staggered height ─────────────────────────────────────
function CardsMasonry({ cards }: CardsProps) {
  const col1 = cards.filter((_, i) => i % 2 === 0);
  const col2 = cards.filter((_, i) => i % 2 === 1);
  const renderCard = (c: Card, i: number, tall: boolean) => (
    <div key={i} style={{
      borderRadius:'1.25rem',overflow:'hidden',
      background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.1)',
      marginBottom:'1.5rem',
    }}>
      <img src={c.imageUrl} alt={c.title} style={{
        width:'100%',height: tall ? '22rem' : '14rem',objectFit:'cover',
      }}/>
      <div style={{padding:'1.25rem'}}>
        <h3 style={{fontWeight:800,color:'var(--color-secondary)',fontFamily:'var(--font-display)',marginBottom:'0.5rem'}}>{c.title}</h3>
        <p style={{fontSize:'0.875rem',lineHeight:1.65,opacity:0.72,color:'var(--color-text)',margin:0}}>{c.desc}</p>
      </div>
    </div>
  );
  return (
    <section style={{padding:'6rem 2rem',background:'var(--color-bg)'}}>
      <div style={{maxWidth:'72rem',margin:'0 auto'}}>
        <h2 style={{fontSize:'clamp(2rem,5vw,3rem)',fontWeight:900,marginBottom:'3rem',
          color:'var(--color-secondary)',fontFamily:'var(--font-display)',letterSpacing:'-0.02em'}}>
          Gallery
        </h2>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1.5rem',alignItems:'start'}}>
          <div>{col1.map((c,i) => renderCard(c, i, i % 2 === 0))}</div>
          <div style={{paddingTop:'3rem'}}>{col2.map((c,i) => renderCard(c, i, i % 2 !== 0))}</div>
        </div>
      </div>
    </section>
  );
}

// ── V4: List — horizontal media rows with alternating accent ─────────────────
function CardsList({ cards }: CardsProps) {
  return (
    <section style={{padding:'6rem 2rem',background:'var(--color-bg)'}}>
      <div style={{maxWidth:'68rem',margin:'0 auto'}}>
        <h2 style={{fontSize:'clamp(2rem,5vw,3rem)',fontWeight:900,marginBottom:'3rem',
          color:'var(--color-secondary)',fontFamily:'var(--font-display)',letterSpacing:'-0.02em'}}>
          Highlights
        </h2>
        <div style={{display:'flex',flexDirection:'column',gap:'0'}}>
          {cards.map((c, i) => (
            <div key={i} style={{
              display:'grid',gridTemplateColumns: i%2===0 ? '40% 60%' : '60% 40%',
              minHeight:'18rem',borderBottom:'1px solid rgba(255,255,255,0.06)',
              overflow:'hidden',
            }}>
              {i % 2 !== 0 && (
                <div style={{padding:'3rem',display:'flex',flexDirection:'column',justifyContent:'center'}}>
                  <span style={{fontSize:'0.65rem',fontWeight:700,letterSpacing:'0.15em',
                    textTransform:'uppercase',color:'var(--color-secondary)',marginBottom:'1rem',display:'block'}}>
                    0{i+1}
                  </span>
                  <h3 style={{fontSize:'1.75rem',fontWeight:900,color:'var(--color-text)',
                    fontFamily:'var(--font-display)',marginBottom:'1rem',letterSpacing:'-0.02em'}}>{c.title}</h3>
                  <p style={{opacity:0.7,color:'var(--color-text)',lineHeight:1.7,margin:0}}>{c.desc}</p>
                </div>
              )}
              <img src={c.imageUrl} alt={c.title} style={{width:'100%',height:'100%',objectFit:'cover',
                filter:'saturate(0.85) brightness(0.8)'}}/>
              {i % 2 === 0 && (
                <div style={{padding:'3rem',display:'flex',flexDirection:'column',justifyContent:'center',
                  background:'rgba(255,255,255,0.02)'}}>
                  <span style={{fontSize:'0.65rem',fontWeight:700,letterSpacing:'0.15em',
                    textTransform:'uppercase',color:'var(--color-secondary)',marginBottom:'1rem',display:'block'}}>
                    0{i+1}
                  </span>
                  <h3 style={{fontSize:'1.75rem',fontWeight:900,color:'var(--color-text)',
                    fontFamily:'var(--font-display)',marginBottom:'1rem',letterSpacing:'-0.02em'}}>{c.title}</h3>
                  <p style={{opacity:0.7,color:'var(--color-text)',lineHeight:1.7,margin:0}}>{c.desc}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function CardSection() {
  const v = S.variants?.cards ?? 0;
  const cards = SITE.cards;
  if (v === 1) return <CardsCarousel cards={cards} />;
  if (v === 2) return <CardsFeatured cards={cards} />;
  if (v === 3) return <CardsMasonry cards={cards} />;
  if (v === 4) return <CardsList cards={cards} />;
  return <CardsGrid cards={cards} />;
}
