import Link from 'next/link';
import { SITE } from '../app/site-content';
export default function Footer() {
  const { brand, tagline, links } = SITE.footer;
  return (
    <footer className="py-16 px-8 border-t" style={{
      background:'rgba(0,0,0,0.6)',
      borderColor:'color-mix(in srgb,var(--color-secondary) 15%,transparent)'
    }}>
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
        <div>
          <p style={{fontSize:'1.5rem',fontWeight:900,color:'var(--color-secondary)',margin:0,fontFamily:'var(--font-display)'}}>{brand}</p>
          <p style={{fontSize:'0.9rem',marginTop:'0.5rem',opacity:0.6,color:'var(--color-text)',margin:0}}>{tagline}</p>
        </div>
        <ul className="flex flex-wrapjustify-center md:justify-end gap-x-8 gap-y-4" style={{margin:0,padding:0,listStyle:'none'}}>
          {links.map(l=>(
            <li key={l.href}>
              <Link href={l.href} className="nav-link" style={{fontSize:'0.95rem',color:'var(--color-text)',fontWeight:600}}>{l.label}</Link>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
