import { SITE } from '../app/site-content';
export default function Hero() {
  const { headline, subtext, cta1, cta2, imageUrl } = SITE.hero;
  return (
    <section style={{position:'relative',minHeight:'100vh',display:'flex',
      alignItems:'center',justifyContent:'center',overflow:'hidden',
      backgroundColor:'var(--color-bg)'}}>
      {/* Background image */}
      <img src={imageUrl} alt="hero background" style={{position:'absolute',inset:0,
        width:'100%',height:'100%',objectFit:'cover',opacity:0.55}}/>
      {/* Dark gradient overlay */}
      <div style={{position:'absolute',inset:0,
        background:'linear-gradient(to bottom,rgba(0,0,0,0.1) 0%,rgba(0,0,0,0.78) 100%)'}}/>
      {/* Scan-line texture */}
      <div className="hero-scan" style={{position:'absolute',inset:0,zIndex:1,opacity:0.08}}/>
      {/* Content */}
      <div style={{position:'relative',zIndex:10,textAlign:'center',
        padding:'0 1.5rem',maxWidth:'52rem',margin:'0 auto'}}>
        <h1 className="fade-in-up neon-glow" style={{
          fontSize:'clamp(2.8rem,8vw,5rem)',fontWeight:900,
          marginBottom:'1.5rem',color:'var(--color-secondary)',
          lineHeight:1.05,fontFamily:'var(--font-display)',
          letterSpacing:'-0.01em'}}>
          {headline}
        </h1>
        <p className="fade-in-up-delay-1" style={{
          fontSize:'1.15rem',lineHeight:1.75,
          color:'var(--color-text)',opacity:0.88,
          maxWidth:'38rem',margin:'0 auto 2.5rem'}}>
          {subtext}
        </p>
        <div className="fade-in-up-delay-2" style={{
          display:'flex',flexWrap:'wrap',gap:'1rem',justifyContent:'center'}}>
          <button className="accent-pulse" style={{
            padding:'0.9rem 2.25rem',borderRadius:'9999px',fontWeight:700,
            background:'var(--color-secondary)',color:'#000',
            border:'none',cursor:'pointer',fontSize:'1.05rem',
            fontFamily:'var(--font-display)',letterSpacing:'0.03em'}}>
            {cta1}
          </button>
          <button style={{
            padding:'0.9rem 2.25rem',borderRadius:'9999px',fontWeight:700,
            background:'transparent',color:'var(--color-secondary)',
            border:'2px solid var(--color-secondary)',cursor:'pointer',
            fontSize:'1.05rem',fontFamily:'var(--font-display)',
            backdropFilter:'blur(8px)'}}>
            {cta2}
          </button>
        </div>
      </div>
    </section>
  );
}
