import { ArrowRight } from 'lucide-react';
import { SITE } from '../app/site-content';
export default function CTABanner() {
  const { headline, body, button, imageUrl } = SITE.cta;
  return (
    <section style={{position:'relative',overflow:'hidden',padding:'7rem 2rem',textAlign:'center',backgroundColor:'var(--color-primary)'}}>
      <img src={imageUrl} alt="cta overlay" style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',opacity:0.35}} />
      <div style={{position:'absolute',inset:0,background:'linear-gradient(135deg,rgba(0,0,0,0.8) 0%,rgba(0,0,0,0.4) 100%)'}}/>
      <div className="hero-scan" style={{position:'absolute',inset:0,zIndex:1,opacity:0.06}}/>
      <div style={{position:'relative',zIndex:10,maxWidth:'46rem',margin:'0 auto'}}>
        <h2 className="neon-glow" style={{fontSize:'3rem',fontWeight:900,marginBottom:'1.25rem',color:'var(--color-secondary)',lineHeight:1.1,letterSpacing:'-0.02em',fontFamily:'var(--font-display)'}}>{headline}</h2>
        <p style={{fontSize:'1.2rem',lineHeight:1.7,marginBottom:'3rem',opacity:0.9,color:'var(--color-text)',maxWidth:'36rem',margin:'0 auto 3rem'}}>{body}</p>
        <button className="float accent-pulse" style={{display:'inline-flex',alignItems:'center',gap:'0.5rem',padding:'1.1rem 2.8rem',borderRadius:'9999px',fontWeight:800,fontSize:'1.15rem',background:'var(--color-secondary)',color:'#000',border:'none',cursor:'pointer',fontFamily:'var(--font-display)'}}>
          {button} <ArrowRight size={22}/>
        </button>
      </div>
    </section>
  );
}
