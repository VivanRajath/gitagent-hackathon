'use client';
import Link from 'next/link';
import { Menu } from 'lucide-react';
import { useState } from 'react';
import { SITE } from '../app/site-content';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { brand, links } = SITE.navbar;
  return (
    <nav className="glass" style={{
      position:'sticky',top:0,zIndex:50,width:'100%',
      padding:'1.25rem 1.5rem',display:'flex',
      alignItems:'center',justifyContent:'space-between',
      borderBottom:'1px solid color-mix(in srgb,var(--color-secondary) 25%,transparent)',
    }}>
      <Link href="/" style={{
        fontSize:'1.5rem',fontWeight:900,letterSpacing:'-0.02em',
        color:'var(--color-secondary)',textDecoration:'none',
        fontFamily:'var(--font-display)'
      }}>
        {brand}
      </Link>
      <ul style={{
        display:'none',alignItems:'center',gap:'2rem',
        margin:0,padding:0,listStyle:'none'
      }} className="md:flex">
        {links.map(l=>(
          <li key={l.href}>
            <Link href={l.href} className="nav-link" style={{
              fontSize:'0.9rem',fontWeight:600,color:'var(--color-text)',
              letterSpacing:'0.02em',fontFamily:'var(--font-display)'
            }}>
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
      <button className="md:hidden" onClick={()=>setOpen(o=>!o)} style={{
        color:'var(--color-text)',background:'none',border:'none',cursor:'pointer'
      }}>
        <Menu size={26}/>
      </button>
      {open&&(<div className="glass" style={{
        position:'absolute',top:'100%',left:0,width:'100%',
        padding:'1.5rem',display:'flex',flexDirection:'column',gap:'1rem',
        borderBottom:'1px solid color-mix(in srgb,var(--color-secondary) 20%,transparent)'
      }} className="md:hidden">
        {links.map(l=>(
          <Link key={l.href} href={l.href} onClick={()=>setOpen(false)} style={{
            fontSize:'1.1rem',fontWeight:600,color:'var(--color-text)',
            textDecoration:'none',fontFamily:'var(--font-display)'
          }}>
            {l.label}
          </Link>
        ))}
      </div>)}
    </nav>
  );
}
