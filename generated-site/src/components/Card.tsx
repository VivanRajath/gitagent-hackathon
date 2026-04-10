import { SITE } from '../app/site-content';
export default function Card({ index }: { index: number }) {
  const card = SITE.cards[index] ?? SITE.cards[0];
  return (
    <div
      style={{borderRadius:'1rem',overflow:'hidden',width:'18rem',
        background:'rgba(255,255,255,0.06)',
        border:'1px solid rgba(255,255,255,0.12)',
        borderTop:'3px solid var(--color-secondary)',
        boxShadow:'0 20px 40px rgba(0,0,0,0.4)',
        transition:'transform 0.3s ease, box-shadow 0.3s ease'}}
      onMouseEnter={e=>{
        e.currentTarget.style.transform='translateY(-10px)';
        e.currentTarget.style.boxShadow='0 32px 64px rgba(0,0,0,0.5), 0 0 28px color-mix(in srgb,var(--color-secondary) 28%,transparent)';
      }}
      onMouseLeave={e=>{
        e.currentTarget.style.transform='translateY(0)';
        e.currentTarget.style.boxShadow='0 20px 40px rgba(0,0,0,0.4)';
      }}>
      <img src={card.imageUrl} alt={card.title}
        style={{width:'100%',height:'11rem',objectFit:'cover',display:'block',
          backgroundColor:'var(--color-primary)'}}/>
      <div style={{padding:'1.35rem'}}>
        <h3 style={{fontSize:'1.1rem',fontWeight:700,marginBottom:'0.5rem',
          color:'var(--color-secondary)',fontFamily:'var(--font-display)'}}>
          {card.title}
        </h3>
        <p style={{fontSize:'0.875rem',lineHeight:1.65,opacity:0.8,
          color:'var(--color-text)',margin:0}}>
          {card.desc}
        </p>
      </div>
    </div>
  );
}
