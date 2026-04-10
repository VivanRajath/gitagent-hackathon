import { SITE } from '../app/site-content';
export default function FeatureStrip() {
  const { sectionTitle, items } = SITE.features;
  return (
    <section className="py-24 px-6" style={{background:'var(--color-bg)'}}>
      <h2 className="text-3xl md:text-5xl font-black text-center mb-16 fade-in-up" style={{color:'var(--color-secondary)',fontFamily:'var(--font-display)',letterSpacing:'-0.02em'}}>{sectionTitle}</h2>
      <div className="flex flex-wrap gap-8 justify-center max-w-6xl mx-auto">
        {items.map((f, i)=>(
          <div key={f.title} className={`fade-in-up-delay-${Math.min(i + 1, 3)}`} style={{
            display:'flex',flexDirection:'column',alignItems:'center',textAlign:'center',
            padding:'2.5rem 2rem',borderRadius:'1.5rem',width:'16rem',
            background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',
            transition:'transform 0.3s ease, background 0.3s ease'
          }} onMouseEnter={e=>{
            e.currentTarget.style.transform='translateY(-6px)';
            e.currentTarget.style.background='rgba(255,255,255,0.06)';
          }} onMouseLeave={e=>{
            e.currentTarget.style.transform='translateY(0)';
            e.currentTarget.style.background='rgba(255,255,255,0.03)';
          }}>
            <span className="float" style={{fontSize:'3.5rem',marginBottom:'1.5rem',display:'block',textShadow:'0 0 20px color-mix(in srgb,var(--color-secondary) 40%,transparent)'}}>{f.icon}</span>
            <h3 style={{fontSize:'1.2rem',fontWeight:800,marginBottom:'0.75rem',color:'var(--color-secondary)',fontFamily:'var(--font-display)'}}>{f.title}</h3>
            <p style={{fontSize:'0.95rem',lineHeight:1.6,opacity:0.75,color:'var(--color-text)',margin:0}}>{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
