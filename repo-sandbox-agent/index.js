import { query } from "gitclaw";
import * as readline from "readline";
import { fileURLToPath } from "url";
import path from "path";
import { readFileSync, appendFileSync, readdirSync, rmSync, existsSync } from "fs";
import { spawn, exec } from "child_process";
import http from "http";

// ── ANSI color helpers ─────────────────────────────────────────────────────────
const _activePorts = new Set();
const C = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  magenta: "\x1b[35m",
  blue: "\x1b[34m",
  red: "\x1b[31m",
  white: "\x1b[37m",
};

// ── logEvent — structured, role-branded stderr output ─────────────────────────
// Usage: logEvent("ARCHITECT", "Planning website structure", "🏗️", C.yellow)
function logEvent(role, message, emojiIgnored = "", color = C.cyan) {
  const ts = new Date().toTimeString().slice(0, 8);
  process.stderr.write(
    `${C.dim}[${ts}]${C.reset} ${color}${C.bold}[${role.padEnd(12)}]${C.reset} ${message}\n`
  );
}

// ── logHandoff — shows agent-to-agent delegation in logs ──────────────────────
function logHandoff(fromRole, toRole, reason) {
  const ts = new Date().toTimeString().slice(0, 8);
  process.stderr.write(
    `${C.dim}[${ts}] ━━ handoff: ${C.reset}${C.bold}${fromRole}${C.reset}` +
    ` ${C.dim}──▶${C.reset} ${C.bold}${toRole}${C.reset}` +
    (reason ? ` ${C.dim}(${reason})${C.reset}` : '') + '\n'
  );
}

// ── classifyIntent — maps user prompt to an agent tier ────────────────────────
// Returns: "website" | "fix" | "feature" | "arch" | "visual" | "chat"
function classifyIntent(prompt) {
  const p = prompt.toLowerCase();
  // AgentBridge variation/commit prompts must never become website builds
  if (p.startsWith("[agent-bridge]") || p.startsWith("you are a ui code generator") ||
    p.startsWith("you are the jnr-developer persona")) return "feature";
  if (p.includes("[pinch-edit") || p.includes("[delete-node") || p.includes("[swipe")) return "website";
  if (/\b(website|landing page|site|make|create|build|theme|generate|themed)\b/.test(p) &&
    !/\bfix\b|\bdebug\b/.test(p)) return "website";
  if (/\b(visual editor|canvas|hand (draw|track)|draw the ui|edit visually|open editor)\b/.test(p)) return "visual";
  if (/\b(refactor|redesign|restructure|migrate|overhaul|rethink|full rewrite)\b/.test(p)) return "arch";
  if (/\b(fix|debug|repair|broken|error|crash|bug|issue)\b/.test(p)) return "fix";
  if (/\b(add|implement|extend|feature|new route|new page|integrate|update|change|modify|edit)\b/.test(p)) return "feature";
  return "chat";
}

// ── Load agent memory (known errors + past learnings) ─────────────────────────
function loadMemory() {
  try {
    return readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), "memory", "known-errors.md"), "utf-8");
  } catch { return ""; }
}
const AGENT_MEMORY = loadMemory();

// ── Restore critical scaffolding (CSS + layout — NOT component TSX files) ──────
// Component .tsx files are the design system — agents choose layouts via site-content.ts variants.
// Only restore layout.tsx + globals.css scaffolding if they're broken.
import { writeFileSync, mkdirSync } from "fs";

// Module-level so buildWebsiteDirect can also use it for full CSS reset
const FULL_GLOBALS_CSS_TEMPLATE = `@import "tailwindcss";

:root {
  --color-primary: #4a1942;
  --color-secondary: #c9a84c;
  --color-bg: #0d0d0d;
  --color-text: #e8d5b7;
  --color-on-primary: #ffffff;
  --color-on-secondary: #000000;
  --font-display: 'Cinzel', serif;
}

*, *::before, *::after { box-sizing: border-box; }
html { scroll-behavior: smooth; }

body {
  font-family: var(--font-display), system-ui, sans-serif;
  background-color: var(--color-bg);
  color: var(--color-text);
  margin: 0;
  padding: 0;
  overflow-x: hidden;
}

/* ── Animation utility classes ─────────────────────────────────────────────── */
/* agents_css_anchor — DO NOT REMOVE THIS COMMENT OR ANYTHING BELOW */
.fade-in-up {
  animation: fadeInUp 0.7s cubic-bezier(0.22,1,0.36,1) forwards;
}
.fade-in-up-delay-1 { animation: fadeInUp 0.7s 0.15s cubic-bezier(0.22,1,0.36,1) forwards; opacity: 0; }
.fade-in-up-delay-2 { animation: fadeInUp 0.7s 0.30s cubic-bezier(0.22,1,0.36,1) forwards; opacity: 0; }
.fade-in-up-delay-3 { animation: fadeInUp 0.7s 0.45s cubic-bezier(0.22,1,0.36,1) forwards; opacity: 0; }

.flicker   { animation: flicker 3s linear infinite; }
.float     { animation: float 5s ease-in-out infinite; }
.glitch    { animation: glitch 2.5s steps(1) infinite; }
.neon-glow { animation: neonGlow 2s ease-in-out infinite; }
.accent-pulse { animation: accentPulse 2s ease-out infinite; }
.red-pulse { animation: redPulse 2.2s ease-out infinite; }

/* ── Component enhancement classes ─────────────────────────────────────────── */
.glass {
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  background: rgba(0,0,0,0.45);
}

.hero-scan {
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0,0,0,0.04) 2px,
    rgba(0,0,0,0.04) 4px
  );
  pointer-events: none;
}

.nav-link {
  position: relative;
  text-decoration: none;
  transition: opacity 0.2s;
  opacity: 0.72;
}
.nav-link::after {
  content: '';
  position: absolute;
  bottom: -3px;
  left: 0;
  width: 0;
  height: 2px;
  background: var(--color-secondary);
  transition: width 0.25s ease;
}
.nav-link:hover { opacity: 1; }
.nav-link:hover::after { width: 100%; }

/* ── @keyframes ─────────────────────────────────────────────────────────────── */
@keyframes flicker {
  0%,100%{opacity:1} 41%{opacity:0.9} 42%{opacity:0.35} 43%{opacity:0.9}
  90%{opacity:0.95} 91%{opacity:0.5} 92%{opacity:0.95}
}

@keyframes float {
  0%,100%{transform:translateY(0px)} 50%{transform:translateY(-14px)}
}

@keyframes glitch {
  0%  { text-shadow: 2px 0 var(--color-primary), -2px 0 var(--color-secondary); }
  20% { text-shadow: -3px 0 var(--color-primary), 3px 0 var(--color-secondary); }
  40% { text-shadow: 2px 0 transparent; }
  60% { text-shadow: -3px 0 var(--color-primary), 3px 0 var(--color-secondary); }
  80% { text-shadow: 2px 0 var(--color-primary), -2px 0 var(--color-secondary); }
  100%{ text-shadow: none; }
}

@keyframes fadeInUp {
  from{opacity:0;transform:translateY(28px)}
  to{opacity:1;transform:translateY(0)}
}

@keyframes neonGlow {
  0%,100%{text-shadow:0 0 6px var(--color-secondary),0 0 12px var(--color-secondary),0 0 24px var(--color-secondary)}
  50%{text-shadow:0 0 12px var(--color-secondary),0 0 28px var(--color-secondary),0 0 55px var(--color-secondary)}
}

@keyframes accentPulse {
  0%,100%{box-shadow:0 0 0 0 color-mix(in srgb,var(--color-secondary) 50%,transparent)}
  70%{box-shadow:0 0 0 14px transparent}
}

@keyframes redPulse {
  0%,100%{box-shadow:0 0 0 0 color-mix(in srgb,var(--color-primary) 50%,transparent)}
  70%{box-shadow:0 0 0 16px transparent}
}

/* ── Reduced motion ─────────────────────────────────────────────────────────── */
@media (prefers-reduced-motion: reduce) {
  .flicker,.float,.glitch,.fade-in-up,.fade-in-up-delay-1,
  .fade-in-up-delay-2,.fade-in-up-delay-3,.red-pulse,.neon-glow,.accent-pulse {
    animation: none !important; opacity: 1 !important; transform: none !important;
  }
}
`;

function restoreComponents() {
  const site = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "generated-site", "src");
  const comps = path.join(site, "components");
  mkdirSync(comps, { recursive: true });

  const templates = {
    "Navbar.tsx": `'use client';
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
      }}>{brand}</Link>
      <ul style={{display:'none',alignItems:'center',gap:'2rem',margin:0,padding:0,listStyle:'none'}} className="md:flex">
        {links.map(l=>(
          <li key={l.href}><Link href={l.href} className="nav-link" style={{fontSize:'0.9rem',fontWeight:600,color:'var(--color-text)',letterSpacing:'0.02em',fontFamily:'var(--font-display)'}}>{l.label}</Link></li>
        ))}
      </ul>
      <button className="md:hidden" onClick={()=>setOpen(o=>!o)} style={{color:'var(--color-text)',background:'none',border:'none',cursor:'pointer'}}><Menu size={26}/></button>
      {open&&(<div className="glass" style={{position:'absolute',top:'100%',left:0,width:'100%',padding:'1.5rem',display:'flex',flexDirection:'column',gap:'1rem',borderBottom:'1px solid color-mix(in srgb,var(--color-secondary) 20%,transparent)'}} className="md:hidden">
        {links.map(l=>(<Link key={l.href} href={l.href} onClick={()=>setOpen(false)} style={{fontSize:'1.1rem',fontWeight:600,color:'var(--color-text)',textDecoration:'none',fontFamily:'var(--font-display)'}}>{l.label}</Link>))}
      </div>)}
    </nav>
  );
}`,

    "Hero.tsx": `import { SITE } from '../app/site-content';
export default function Hero() {
  const { headline, subtext, cta1, cta2, imageUrl } = SITE.hero;
  return (
    <section style={{position:'relative',minHeight:'100vh',display:'flex',
      alignItems:'center',justifyContent:'center',overflow:'hidden',
      backgroundColor:'var(--color-bg)'}}>
      <img src={imageUrl} alt="hero background" style={{position:'absolute',inset:0,
        width:'100%',height:'100%',objectFit:'cover',opacity:0.55}}/>
      <div style={{position:'absolute',inset:0,
        background:'linear-gradient(to bottom,rgba(0,0,0,0.1) 0%,rgba(0,0,0,0.78) 100%)'}}/>
      <div className="hero-scan" style={{position:'absolute',inset:0,zIndex:1,opacity:0.08}}/>
      <div style={{position:'relative',zIndex:10,textAlign:'center',
        padding:'0 1.5rem',maxWidth:'52rem',margin:'0 auto'}}>
        <h1 className="fade-in-up neon-glow" style={{
          fontSize:'clamp(2.8rem,8vw,5rem)',fontWeight:900,
          marginBottom:'1.5rem',color:'var(--color-secondary)',
          lineHeight:1.05,fontFamily:'var(--font-display)',
          letterSpacing:'-0.01em'}}>{headline}</h1>
        <p className="fade-in-up-delay-1" style={{
          fontSize:'1.15rem',lineHeight:1.75,color:'var(--color-text)',opacity:0.88,
          maxWidth:'38rem',margin:'0 auto 2.5rem'}}>{subtext}</p>
        <div className="fade-in-up-delay-2" style={{
          display:'flex',flexWrap:'wrap',gap:'1rem',justifyContent:'center'}}>
          <button className="accent-pulse" style={{
            padding:'0.9rem 2.25rem',borderRadius:'9999px',fontWeight:700,
            background:'var(--color-secondary)',color:'var(--color-on-secondary)',
            border:'none',cursor:'pointer',fontSize:'1.05rem',
            fontFamily:'var(--font-display)',letterSpacing:'0.03em'}}>{cta1}</button>
          <button style={{
            padding:'0.9rem 2.25rem',borderRadius:'9999px',fontWeight:700,
            background:'transparent',color:'var(--color-secondary)',
            border:'2px solid var(--color-secondary)',cursor:'pointer',
            fontSize:'1.05rem',fontFamily:'var(--font-display)',
            backdropFilter:'blur(8px)'}}>{cta2}</button>
        </div>
      </div>
    </section>
  );
}`,

    "Card.tsx": `import { SITE } from '../app/site-content';
export default function Card({ index }: { index: number }) {
  const card = SITE.cards[index] ?? SITE.cards[0];
  return (
    <div style={{borderRadius:'1rem',overflow:'hidden',width:'18rem',background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.12)',borderTop:'3px solid var(--color-secondary)',boxShadow:'0 20px 40px rgba(0,0,0,0.4)',transition:'transform 0.3s ease, box-shadow 0.3s ease'}}
      onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-10px)';e.currentTarget.style.boxShadow='0 32px 64px rgba(0,0,0,0.5), 0 0 28px color-mix(in srgb,var(--color-secondary) 28%,transparent)';}}
      onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='0 20px 40px rgba(0,0,0,0.4)';}}>
      <img src={card.imageUrl} alt={card.title} style={{width:'100%',height:'11rem',objectFit:'cover',display:'block',backgroundColor:'var(--color-primary)'}}/>
      <div style={{padding:'1.35rem'}}>
        <h3 style={{fontSize:'1.1rem',fontWeight:700,marginBottom:'0.5rem',color:'var(--color-secondary)',fontFamily:'var(--font-display)'}}>{card.title}</h3>
        <p style={{fontSize:'0.875rem',lineHeight:1.65,opacity:0.8,color:'var(--color-text)',margin:0}}>{card.desc}</p>
      </div>
    </div>
  );
}`,

    "FeatureStrip.tsx": `import { SITE } from '../app/site-content';
export default function FeatureStrip() {
  const { sectionTitle, items } = SITE.features;
  return (
    <section className="py-24 px-6" style={{background:'var(--color-bg)'}}>
      <h2 className="text-3xl md:text-5xl font-black text-center mb-16 fade-in-up" style={{color:'var(--color-secondary)',fontFamily:'var(--font-display)',letterSpacing:'-0.02em'}}>{sectionTitle}</h2>
      <div className="flex flex-wrap gap-8 justify-center max-w-6xl mx-auto">
        {items.map((f, i)=>(
          <div key={f.title} className={\`fade-in-up-delay-\${Math.min(i + 1, 3)}\`} style={{display:'flex',flexDirection:'column',alignItems:'center',textAlign:'center',padding:'2.5rem 2rem',borderRadius:'1.5rem',width:'16rem',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',transition:'transform 0.3s ease, background 0.3s ease'}} onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-6px)';e.currentTarget.style.background='rgba(255,255,255,0.06)';}} onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.background='rgba(255,255,255,0.03)';}}>
            <span className="float" style={{fontSize:'3.5rem',marginBottom:'1.5rem',display:'block',textShadow:'0 0 20px color-mix(in srgb,var(--color-secondary) 40%,transparent)'}}>{f.icon}</span>
            <h3 style={{fontSize:'1.2rem',fontWeight:800,marginBottom:'0.75rem',color:'var(--color-secondary)',fontFamily:'var(--font-display)'}}>{f.title}</h3>
            <p style={{fontSize:'0.95rem',lineHeight:1.6,opacity:0.75,color:'var(--color-text)',margin:0}}>{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}`,

    "CTABanner.tsx": `import { ArrowRight } from 'lucide-react';
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
        <button className="float accent-pulse" style={{display:'inline-flex',alignItems:'center',gap:'0.5rem',padding:'1.1rem 2.8rem',borderRadius:'9999px',fontWeight:800,fontSize:'1.15rem',background:'var(--color-secondary)',color:'var(--color-on-secondary)',border:'none',cursor:'pointer',fontFamily:'var(--font-display)'}}>
          {button} <ArrowRight size={22}/>
        </button>
      </div>
    </section>
  );
}`,

    "Footer.tsx": `import Link from 'next/link';
import { SITE } from '../app/site-content';
export default function Footer() {
  const { brand, tagline, links } = SITE.footer;
  return (
    <footer className="py-16 px-8 border-t" style={{background:'rgba(0,0,0,0.6)',borderColor:'color-mix(in srgb,var(--color-secondary) 15%,transparent)'}}>
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
        <div>
          <p style={{fontSize:'1.5rem',fontWeight:900,color:'var(--color-secondary)',margin:0,fontFamily:'var(--font-display)'}}>{brand}</p>
          <p style={{fontSize:'0.9rem',marginTop:'0.5rem',opacity:0.6,color:'var(--color-text)',margin:0}}>{tagline}</p>
        </div>
        <ul className="flex flex-wrapjustify-center md:justify-end gap-x-8 gap-y-4" style={{margin:0,padding:0,listStyle:'none'}}>
          {links.map(l=>(<li key={l.href}><Link href={l.href} className="nav-link" style={{fontSize:'0.95rem',color:'var(--color-text)',fontWeight:600}}>{l.label}</Link></li>))}
        </ul>
      </div>
    </footer>
  );
}`,

    "SpatialVoiceOverlay.tsx": `'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
type ChatLog = { role: string; msg: string };
export default function SpatialVoiceOverlay() {
  const [editMode, setEditMode] = useState(false);
  useEffect(() => { setEditMode(new URLSearchParams(window.location.search).get('edit')==='1'); }, []);
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [chatLogs, setChatLogs] = useState<ChatLog[]>([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [pinchedText, setPinchedText] = useState<string | null>(null);
  const [showPinchMenu, setShowPinchMenu] = useState(false);
  const [hint, setHint] = useState('');
  const [showColorSlider, setShowColorSlider] = useState(false);
  const [colorHue, setColorHue] = useState(0);
  const [mpLoaded, setMpLoaded] = useState(false);
  const videoRef = useRef<any>(null);
  const recognizerRef = useRef<any>(null);
  const camStreamRef = useRef<any>(null);
  const lastGestureRef = useRef<string>('');
  const pttRecRef = useRef<any>(null);
  const passiveRef = useRef<any>(null);
  const pinchedElRef = useRef<HTMLElement | null>(null);
  const busyRef = useRef(false);
  const holdingRef = useRef(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const editModeRef = useRef(false);
  useEffect(() => { editModeRef.current = editMode; }, [editMode]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatLogs]);
  const addLog = (role: string, msg: string) => setChatLogs(prev => [...prev.slice(-39), { role, msg }]);
  const openEditMode  = () => { const u=new URL(window.location.href); u.searchParams.set('edit','1'); window.location.href=u.toString(); };
  const closeEditMode = () => { const u=new URL(window.location.href); u.searchParams.delete('edit'); window.location.href=u.toString(); };
  const clearPinch = useCallback(() => {
    if (pinchedElRef.current) Object.assign(pinchedElRef.current.style, { outline:'', boxShadow:'', transform:'', transition:'' });
    pinchedElRef.current = null; setPinchedText(null); setShowPinchMenu(false);
  }, []);
  const selectElement = useCallback((el: HTMLElement) => {
    if (pinchedElRef.current && pinchedElRef.current !== el)
      Object.assign(pinchedElRef.current.style, { outline:'', boxShadow:'', transform:'' });
    pinchedElRef.current = el;
    setPinchedText(el.innerText.trim().slice(0, 80));
    setShowPinchMenu(false);
    Object.assign(el.style, { outline:'3px solid #f59e0b', boxShadow:'0 0 18px rgba(245,158,11,0.8),0 0 40px rgba(245,158,11,0.3)', transform:'scale(1.02)', transition:'all 0.18s ease' });
  }, []);
  const sendCommand = useCallback((payload: string, label: string) => {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true); setShowPinchMenu(false); setShowColorSlider(false);
    addLog('YOU', label); setChatOpen(true);
    setTimeout(() => addLog('ORCHESTRATOR', 'Routing intent…'), 350);
    setTimeout(() => addLog('SNR-DEV', 'Applying edit…'), 950);
    fetch('http://localhost:3002/command', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ prompt: payload }) })
      .then(() => { addLog('JNR-DEV', 'Done!'); clearPinch(); })
      .catch(() => addLog('SYS', 'Agent unreachable.'))
      .finally(() => setTimeout(() => { busyRef.current = false; setBusy(false); }, 2000));
  }, [clearPinch]);

  // Voice listener — always-on after first user interaction
  // Listens for "open edit mode" when NOT in edit mode, and "exit edit" when IN edit mode
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let stopped = false;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const startPassive = () => {
      if (stopped || passiveRef.current) return;
      const passive = new SR();
      passive.continuous = true; passive.interimResults = false; passive.lang = 'en-US';
      passiveRef.current = passive;
      passive.onresult = (ev: any) => {
        const t = ev.results[ev.results.length - 1][0].transcript.trim().toLowerCase();
        if (!editModeRef.current && t.includes('open') && t.includes('edit') && t.includes('mode')) { setHint('Opening edit mode…'); openEditMode(); }
        if (editModeRef.current && t.includes('exit') && (t.includes('edit') || t.includes('editor'))) { setHint('Closing editor…'); closeEditMode(); }
      };
      passive.onerror = (ev: any) => {
        if (ev.error === 'not-allowed' || ev.error === 'service-not-allowed') setHint('Mic blocked — click 🔒 in address bar.');
      };
      passive.onend = () => { if (!stopped) { try { passive.start(); } catch {} } };
      try { passive.start(); setHint('🎙 Voice ready'); } catch {}
    };
    // Browser requires user gesture before SpeechRecognition.start()
    const onFirstInteraction = () => { startPassive(); window.removeEventListener('click', onFirstInteraction); window.removeEventListener('touchstart', onFirstInteraction); };
    window.addEventListener('click', onFirstInteraction, { once: true });
    window.addEventListener('touchstart', onFirstInteraction, { once: true });
    // If already in edit mode (page loaded with ?edit=1), the button click already happened
    if (editModeRef.current) startPassive();
    return () => { stopped = true; try { passiveRef.current?.stop(); } catch {} passiveRef.current = null; window.removeEventListener('click', onFirstInteraction); window.removeEventListener('touchstart', onFirstInteraction); };
  }, []);

  // MediaPipe: load via native <script type="module"> to fully bypass webpack
  useEffect(() => {
    if (typeof window === 'undefined' || !editMode) return;
    if ((window as any).__svGestureRecognizer) {
      recognizerRef.current = (window as any).__svGestureRecognizer;
      setMpLoaded(true);
      return;
    }
    const script = document.createElement('script');
    script.type = 'module';
    script.textContent = \`
      (async () => {
        try {
          const { FilesetResolver, GestureRecognizer } = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs');
          const fileset = await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm');
          const recognizer = await GestureRecognizer.createFromOptions(fileset, {
            baseOptions: { modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task', delegate: 'GPU' },
            runningMode: 'VIDEO', numHands: 1,
          });
          window.__svGestureRecognizer = recognizer;
          window.dispatchEvent(new CustomEvent('sv-mp-ready'));
        } catch (err) {
          window.dispatchEvent(new CustomEvent('sv-mp-error', { detail: err?.message || String(err) }));
        }
      })();
    \`;
    const onReady = () => {
      recognizerRef.current = (window as any).__svGestureRecognizer;
      setMpLoaded(true);
      setHint('✌️ Gesture tracking ready!');
    };
    const onError = (e: any) => { setHint('Gesture error: ' + String(e.detail).slice(0, 60)); };
    window.addEventListener('sv-mp-ready', onReady);
    window.addEventListener('sv-mp-error', onError as any);
    setHint('Loading gesture model…');
    document.head.appendChild(script);
    return () => {
      window.removeEventListener('sv-mp-ready', onReady);
      window.removeEventListener('sv-mp-error', onError as any);
    };
  }, [editMode]);

  useEffect(() => {
    if (!mpLoaded || !editMode) return;
    let reqId = 0; let lastVideoTime = -1; let cancelled = false;
    let activeHue = 0; let lastHueState = 0;
    const startCam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240, facingMode: 'user' } });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        camStreamRef.current = stream;
        const vid = videoRef.current;
        if (vid) {
          vid.srcObject = stream;
          vid.onloadeddata = () => { if (!cancelled) { setHint('🎥 Camera actively tracking hands'); loop(); } };
        }
      } catch { setHint('Camera blocked — allow camera in browser settings.'); }
    };
    const loop = () => {
      if (cancelled || !recognizerRef.current || !videoRef.current) return;
      const vid = videoRef.current;
      if (vid.readyState >= 2 && vid.currentTime !== lastVideoTime) {
        lastVideoTime = vid.currentTime;
        try {
          const results = recognizerRef.current.recognizeForVideo(vid, Date.now());
          if (results.gestures && results.gestures.length > 0) {
            const cat = results.gestures[0][0].categoryName;
            
            // Map physical hand position to color hue when peace sign is active
            if (cat === 'Victory') {
              if (lastGestureRef.current !== 'Victory') {
                setShowColorSlider(true);
                setHint('✌️ Peace sign detected! Move hand left/right to shift hue.');
              }
              const x = results.landmarks[0][0].x; 
              // x is 0.0 to 1.0. Multiply by 360 to get a degree on the color wheel
              activeHue = Math.floor(Math.max(0, Math.min(1, x)) * 360);
              document.documentElement.style.filter = \`hue-rotate(\${activeHue}deg)\`;
              
              // Only trigger react re-render if enough delta has passed (prevents UI lagging)
              if (Math.abs(lastHueState - activeHue) > 5) {
                 lastHueState = activeHue;
                 setColorHue(activeHue);
              }
            } else if (lastGestureRef.current === 'Victory') {
              // They closed their hand or put it down! Commit the color!
              document.documentElement.style.filter = '';
              setShowColorSlider(false);
              sendCommand(\`[GLOBAL-COLOR-CHANGE hue=\${activeHue}] Shift the theme primary and secondary colours by rotating hue \${activeHue}deg on the colour wheel\`, '✌️ Gesture color committed');
              setHint('🎨 Color applied!');
            }
            lastGestureRef.current = cat;
          }
        } catch {}
      }
      reqId = requestAnimationFrame(loop);
    };
    startCam();
    return () => {
      cancelled = true; cancelAnimationFrame(reqId);
      if (camStreamRef.current) { camStreamRef.current.getTracks().forEach((t:any) => t.stop()); camStreamRef.current = null; }
    };
  }, [mpLoaded, editMode, sendCommand]);

  const startPTT = useCallback(() => {
    if (holdingRef.current || busy) return;
    holdingRef.current = true; setRecording(true);
    try { passiveRef.current?.stop(); } catch {}
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setHint('Voice API not supported'); holdingRef.current = false; setRecording(false); return; }
    const rec = new SR();
    rec.continuous = false; rec.interimResults = false; rec.lang = 'en-US';
    pttRecRef.current = rec;
    rec.onresult = (ev: any) => {
      const result = ev.results[0][0];
      const transcript = result.transcript.trim();
      if (result.confidence < 0.45) { setHint("Didn't catch that — try again"); return; }
      const t = transcript.toLowerCase();
      if (t.includes('scroll down'))   { window.scrollBy({ top: 350, behavior: 'smooth' }); addLog('YOU', 'Scroll ↓'); return; }
      if (t.includes('scroll up'))     { window.scrollBy({ top: -350, behavior: 'smooth' }); addLog('YOU', 'Scroll ↑'); return; }
      if (t.includes('scroll to top') || t.includes('go to top'))       { window.scrollTo({ top: 0, behavior: 'smooth' }); addLog('YOU', '↑ Top'); return; }
      if (t.includes('scroll to bottom') || t.includes('go to bottom')) { window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }); addLog('YOU', '↓ Bottom'); return; }
      if (t.includes('clear selection') || t.includes('deselect')) { clearPinch(); addLog('SYS', 'Selection cleared'); return; }
      if (t.includes('exit edit mode') || (t.includes('exit') && t.includes('editor'))) { closeEditMode(); return; }
      const payload = pinchedElRef.current
        ? \`[PINCH-EDIT context="\${pinchedElRef.current.innerText.trim().slice(0, 100)}"] \${transcript}\`
        : transcript;
      sendCommand(payload, transcript);
    };
    rec.onerror = (ev: any) => {
      if (ev.error === 'no-speech') setHint('No speech detected');
      else if (ev.error === 'not-allowed') setHint('Mic blocked — click 🔒 to allow.');
      else if (ev.error !== 'aborted') setHint('Mic error: ' + ev.error);
    };
    rec.onend = () => {
      holdingRef.current = false; setRecording(false); pttRecRef.current = null;
      try { passiveRef.current?.start(); } catch {}
    };
    try { rec.start(); } catch { holdingRef.current = false; setRecording(false); try { passiveRef.current?.start(); } catch {} }
  }, [busy, sendCommand, clearPinch]);
  const stopPTT = useCallback(() => {
    holdingRef.current = false;
    if (pttRecRef.current) { try { pttRecRef.current.stop(); } catch {} }
    setRecording(false);
  }, []);
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => { if (e.code === 'Space' && !e.repeat && editMode) { e.preventDefault(); startPTT(); } if (e.key === 'Escape') clearPinch(); };
    const onUp   = (e: KeyboardEvent) => { if (e.code === 'Space' && editMode) stopPTT(); };
    window.addEventListener('keydown', onDown); window.addEventListener('keyup', onUp);
    return () => { window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp); };
  }, [editMode, startPTT, stopPTT, clearPinch]);

  useEffect(() => {
    if (typeof window === 'undefined' || !editMode) return;
    let downX = 0, downY = 0, downAt = 0, t0dist = 0, t0midY = 0, twoFinger = false;
    const onMouseDown = (e: MouseEvent) => {
      downX = e.clientX; downY = e.clientY; downAt = Date.now();
      const el = e.target as HTMLElement;
      if (el.closest('[data-sv-overlay]')) return;
      if (el.innerText?.trim()) selectElement(el);
    };
    const onMouseUp = (e: MouseEvent) => {
      if (busyRef.current) return;
      const dx = e.clientX - downX, dy = e.clientY - downY, dt = Date.now() - downAt;
      if (Math.abs(dx) > 130 && Math.abs(dy) < 70 && dt < 500)
        sendCommand(dx > 0 ? '[SWIPE-RIGHT] Change to the next theme variant' : '[SWIPE-LEFT] Revert to the previous theme', dx > 0 ? 'Swipe Right → Next Theme' : 'Swipe Left → Revert');
    };
    const onDblClick = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      if (el.closest('[data-sv-overlay]') || busyRef.current) return;
      if (el.innerText?.trim()) sendCommand(\`[DELETE-NODE context="\${el.innerText.trim().slice(0, 100)}"] Delete this element\`, 'Double-click → Delete');
    };
    const onTouchStart = (e: TouchEvent) => {
      downAt = Date.now();
      if (e.touches.length === 1) {
        twoFinger = false; downX = e.touches[0].clientX; downY = e.touches[0].clientY;
        const el = e.target as HTMLElement;
        if (!el.closest('[data-sv-overlay]') && el.innerText?.trim()) selectElement(el);
      } else if (e.touches.length === 2) {
        twoFinger = true;
        const [a, b] = [e.touches[0], e.touches[1]];
        t0dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
        t0midY = (a.clientY + b.clientY) / 2;
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 2) return;
      twoFinger = true;
      const [a, b] = [e.touches[0], e.touches[1]];
      const midY = (a.clientY + b.clientY) / 2;
      window.scrollBy({ top: (t0midY - midY) * 1.8 }); t0midY = midY;
      if (!busyRef.current) {
        const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), ratio = dist / t0dist;
        if (Math.abs(ratio - 1) > 0.3) {
           t0dist = dist;
           if (pinchedElRef.current) {
             setShowPinchMenu(true);
             setHint(ratio > 1 ? 'Pinch opened options' : 'Pinch triggered options');
           } else {
             sendCommand(ratio > 1 ? '[PINCH-OUT] Increase size of selected section' : '[PINCH-IN] Decrease size of selected section', ratio > 1 ? 'Pinch Out → Enlarge' : 'Pinch In → Shrink');
           }
        }
      }
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (twoFinger || busyRef.current) return;
      const ch = e.changedTouches[0], dx = ch.clientX - downX, dy = ch.clientY - downY, dt = Date.now() - downAt;
      if (Math.abs(dx) > 100 && Math.abs(dy) < 60 && dt < 450)
        sendCommand(dx > 0 ? '[SWIPE-RIGHT] Change to the next theme variant' : '[SWIPE-LEFT] Revert to the previous theme', dx > 0 ? 'Swipe Right → Next Theme' : 'Swipe Left → Revert');
    };
    window.addEventListener('mousedown', onMouseDown); window.addEventListener('mouseup', onMouseUp); window.addEventListener('dblclick', onDblClick);
    window.addEventListener('touchstart', onTouchStart, { passive: true }); window.addEventListener('touchmove', onTouchMove, { passive: true }); window.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('mousedown', onMouseDown); window.removeEventListener('mouseup', onMouseUp); window.removeEventListener('dblclick', onDblClick);
      window.removeEventListener('touchstart', onTouchStart); window.removeEventListener('touchmove', onTouchMove); window.removeEventListener('touchend', onTouchEnd);
    };
  }, [editMode, selectElement, sendCommand]);
  useEffect(() => { if (!hint) return; const t = setTimeout(() => setHint(''), 4000); return () => clearTimeout(t); }, [hint]);
  return (
    <>
      <style>{\`
        @keyframes sv-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.5)} }
        @keyframes sv-in    { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .sv-pill:hover{opacity:.85}
        .sv-menu-btn { display:block; width:100%; text-align:left; padding:0.4rem 0.6rem; border:none; background:transparent; color:#fff; cursor:pointer; border-radius:0.3rem; font-size:0.78rem }
        .sv-menu-btn:hover { background:rgba(255,255,255,0.1) }
      \`}</style>
      <video ref={videoRef} autoPlay playsInline muted data-sv-overlay style={{position:'fixed',bottom:'6rem',right:'1.5rem',width:'120px',height:'90px',borderRadius:'0.5rem',border:'1px solid rgba(16,185,129,0.3)',objectFit:'cover',zIndex:9998,display:editMode&&mpLoaded?'block':'none',opacity:0.7}} />
      <div data-sv-overlay style={{position:'fixed',bottom:'1.5rem',right:'1.5rem',zIndex:9999,display:'flex',flexDirection:'column',alignItems:'flex-end',gap:'0.5rem',fontFamily:'ui-monospace,monospace',pointerEvents:'none'}}>
        {showColorSlider && (
           <div data-sv-overlay style={{background:'rgba(16,185,129,0.15)',border:'1px solid #10b981',borderRadius:'0.8rem',backdropFilter:'blur(20px)',width:'21rem',padding:'1rem',display:'flex',flexDirection:'column',gap:'0.5rem',color:'#fff',animation:'sv-in 0.2s ease-out',pointerEvents:'auto'}}>
             <div style={{fontSize:'0.8rem',fontWeight:'bold',color:'#10b981'}}>✌️ PEACE SIGN — COLOR SLIDER</div>
             <div style={{fontSize:'0.7rem',opacity:0.7}}>Drag to shift theme hue · release to commit</div>
             <input type="range" min="0" max="360" value={colorHue} onChange={e => { const v = parseInt(e.target.value); setColorHue(v); document.documentElement.style.filter = \`hue-rotate(\${v}deg)\`; }} onMouseUp={() => { document.documentElement.style.filter = ''; setShowColorSlider(false); sendCommand(\`[GLOBAL-COLOR-CHANGE hue=\${colorHue}] Shift the theme primary and secondary colours by rotating hue \${colorHue}deg on the colour wheel\`, 'Color changed via ✌️ gesture'); }} onTouchEnd={() => { document.documentElement.style.filter = ''; setShowColorSlider(false); sendCommand(\`[GLOBAL-COLOR-CHANGE hue=\${colorHue}] Shift the theme primary and secondary colours by rotating hue \${colorHue}deg on the colour wheel\`, 'Color changed via ✌️ gesture'); }} style={{width:'100%',cursor:'pointer',accentColor:'#10b981'}} />
             <button onClick={() => { document.documentElement.style.filter = ''; setShowColorSlider(false); setColorHue(0); }} style={{alignSelf:'flex-end',background:'none',border:'none',color:'#fca5a5',cursor:'pointer',fontSize:'0.7rem'}}>✕ Close</button>
           </div>
        )}
        {showPinchMenu && pinchedElRef.current && (
           <div data-sv-overlay style={{background:'rgba(3,3,14,0.95)',border:'1px solid rgba(245,158,11,0.5)',borderRadius:'0.8rem',backdropFilter:'blur(20px)',width:'14rem',padding:'0.5rem',display:'flex',flexDirection:'column',color:'#fff',fontSize:'0.8rem',animation:'sv-in 0.2s ease-out',pointerEvents:'auto'}}>
             <div style={{color:'#f59e0b',fontSize:'0.7rem',marginBottom:'0.3rem',paddingLeft:'0.2rem'}}>PINCH — EDIT COMPONENT</div>
             <button className="sv-menu-btn" onClick={() => sendCommand(\`[PINCH-EDIT context="\${pinchedElRef.current?.innerText.trim().slice(0, 100)}"] Rewrite the text for this element to be more engaging\`, 'Pinch → Edit Text')}>📝 Edit Text</button>
             <button className="sv-menu-btn" onClick={() => sendCommand(\`[PINCH-EDIT context="\${pinchedElRef.current?.innerText.trim().slice(0, 100)}"] Completely redesign the visual layout of this block\`, 'Pinch → Redesign')}>🖼 Redesign Block</button>
             <button className="sv-menu-btn" onClick={() => sendCommand(\`[PINCH-EDIT context="\${pinchedElRef.current?.innerText.trim().slice(0, 100)}"] Change the background or font color of this element to pop out\`, 'Pinch → Change Color')}>🎨 Change Color</button>
             <button className="sv-menu-btn" onClick={() => clearPinch()} style={{color:'#fca5a5',marginTop:'0.2rem'}}>✕ Cancel</button>
           </div>
        )}
        {chatOpen && chatLogs.length > 0 && (
          <div data-sv-overlay style={{background:'rgba(3,3,14,0.95)',border:'1px solid rgba(255,255,255,0.09)',borderRadius:'0.8rem',backdropFilter:'blur(20px)',width:'21rem',maxHeight:'13rem',overflowY:'auto',padding:'0.65rem',display:'flex',flexDirection:'column',gap:'0.4rem',color:'#fff',fontSize:'0.75rem',lineHeight:1.5,animation:'sv-in 0.2s ease-out',pointerEvents:'auto'}}>
            {chatLogs.map((l,i) => (
              <div key={i} style={{display:'flex',gap:'0.35rem',alignItems:'flex-start'}}>
                <b style={{flexShrink:0,color:l.role==='YOU'?'#10b981':l.role==='SNR-DEV'?'#06b6d4':l.role==='ORCHESTRATOR'?'#a78bfa':l.role==='JNR-DEV'?'#4ade80':'#f59e0b'}}>[{l.role}]</b>
                <span style={{opacity:0.85,wordBreak:'break-word'}}>{l.msg}</span>
              </div>
            ))}
            <div ref={chatEndRef}/>
          </div>
        )}
        {pinchedText && !showPinchMenu && (<div data-sv-overlay style={{background:'rgba(245,158,11,0.1)',border:'1px solid rgba(245,158,11,0.4)',borderRadius:'0.45rem',padding:'0.3rem 0.65rem',color:'#f59e0b',fontSize:'0.7rem',maxWidth:'21rem',animation:'sv-in 0.15s ease-out',pointerEvents:'none'}}>SELECTED: &ldquo;{pinchedText.slice(0,45)}{pinchedText.length>45?'…':''}&rdquo;</div>)}
        {hint && (<div data-sv-overlay style={{background:'rgba(0,0,0,0.75)',borderRadius:'0.4rem',padding:'0.3rem 0.7rem',color:'#fcd34d',fontSize:'0.7rem',animation:'sv-in 0.15s ease-out',pointerEvents:'none'}}>{hint}</div>)}
        <div data-sv-overlay style={{display:'flex',alignItems:'center',gap:'0.5rem',pointerEvents:'auto'}}>
          {!editMode ? (
            <button className="sv-pill" onClick={openEditMode} style={{background:'rgba(3,3,14,0.88)',backdropFilter:'blur(14px)',border:'1px solid rgba(99,102,241,0.5)',borderRadius:'9999px',color:'#a5b4fc',padding:'0.55rem 1rem',fontSize:'0.72rem',letterSpacing:'0.06em',cursor:'pointer',boxShadow:'0 0 16px rgba(99,102,241,0.2)'}}>
              ✏️ OPEN EDIT MODE
            </button>
          ) : (
            <button className="sv-pill" onClick={closeEditMode} style={{background:'rgba(3,3,14,0.88)',backdropFilter:'blur(14px)',border:'1px solid rgba(239,68,68,0.4)',borderRadius:'9999px',color:'#fca5a5',padding:'0.55rem 1rem',fontSize:'0.72rem',letterSpacing:'0.06em',cursor:'pointer'}}>
              ✕ EXIT EDITOR
            </button>
          )}
          {editMode && (
            <button className="sv-pill" data-sv-overlay onMouseDown={startPTT} onMouseUp={stopPTT} onMouseLeave={stopPTT}
              onTouchStart={(e)=>{e.preventDefault();startPTT();}} onTouchEnd={(e)=>{e.preventDefault();stopPTT();}} disabled={busy} title="Hold to speak"
              style={{width:'2.6rem',height:'2.6rem',borderRadius:'50%',border:recording?'2px solid #10b981':busy?'2px solid #06b6d4':'2px solid rgba(255,255,255,0.15)',background:recording?'rgba(16,185,129,0.18)':busy?'rgba(6,182,212,0.1)':'rgba(3,3,14,0.88)',backdropFilter:'blur(14px)',color:recording?'#10b981':busy?'#06b6d4':'rgba(255,255,255,0.5)',fontSize:'1.05rem',cursor:busy?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:recording?'0 0 18px rgba(16,185,129,0.45)':'none',transition:'all 0.15s ease',flexShrink:0}}>
              {busy?'⟳':recording?'●':'🎙'}
            </button>
          )}
          <button className="sv-pill" onClick={() => chatLogs.length > 0 && setChatOpen(v=>!v)}
            style={{display:'flex',alignItems:'center',gap:'0.55rem',background:'rgba(3,3,14,0.88)',backdropFilter:'blur(14px)',padding:'0.55rem 1rem',borderRadius:'9999px',border:recording?'1px solid #10b98144':busy?'1px solid #06b6d444':'1px solid rgba(255,255,255,0.1)',color:'#fff',cursor:chatLogs.length>0?'pointer':'default',fontSize:'0.72rem',letterSpacing:'0.06em',boxShadow:recording?'0 0 16px rgba(16,185,129,0.3)':'none',transition:'all 0.2s ease'}}>
            <div style={{width:'8px',height:'8px',borderRadius:'50%',flexShrink:0,background:recording?'#10b981':busy?'#06b6d4':editMode?'#f59e0b':'#6b7280',boxShadow:recording?'0 0 6px #10b981':busy?'0 0 6px #06b6d4':editMode?'0 0 6px #f59e0b':'none',animation:recording?'sv-pulse 0.9s ease-in-out infinite':'none'}}/>
            <span>{recording?'RECORDING…':busy?'WORKING…':editMode?'EDITOR ON':'VIEW MODE'}</span>
            {chatLogs.length>0&&(<span style={{opacity:0.5,fontSize:'0.62rem'}}>{chatOpen?'▾':'▴'}{chatLogs.length}</span>)}
          </button>
        </div>
        {editMode && chatLogs.length===0 && (
          <div data-sv-overlay style={{fontSize:'0.6rem',color:'rgba(255,255,255,0.25)',textAlign:'right',lineHeight:1.7,pointerEvents:'none'}}>
            Hold 🎙 or Space to speak · Click=select<br/>Dbl-click=delete · Swipe=theme<br/>2-finger drag=scroll<br/>2-finger pinch=menu · ✌️=Color Slider
          </div>
        )}
      </div>
    </>
  );
}`,
  };

  // NOTE: We do NOT restore component TSX files from templates.
  // The design system (Navbar/Hero/CardSection/etc.) has 5 variants each and
  // agents choose layouts via the variants object in site-content.ts.
  // Restoring old single-variant templates would break the design system.
  void templates; // keep templates defined for reference but don't write

  // Restore layout.tsx — always keep this exact structure, never let agent overwrite
  const layoutFile = path.join(site, "app", "layout.tsx");
  const layoutContent = readFileSync(layoutFile, "utf-8").trim();
  if (!layoutContent.includes("SpatialVoiceOverlay")) {
    writeFileSync(layoutFile, `import type { Metadata } from 'next';
import './globals.css';
import SpatialVoiceOverlay from '../components/SpatialVoiceOverlay';
import PuterImageLoader from '../components/PuterImageLoader';

export const metadata: Metadata = { title: 'My Site' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet" />
      </head>
      <body suppressHydrationWarning={true}>
        {children}
        <SpatialVoiceOverlay />
        <PuterImageLoader />
      </body>
    </html>
  );
}`, "utf-8");
    process.stderr.write("[restore] Rebuilt broken layout.tsx with Spatial Overlay + PuterImageLoader\n");
  }

  // Always validate globals.css — fix it every startup if broken
  const cssFile = path.join(site, "app", "globals.css");
  const cssExists = existsSync(cssFile);
  const cssContent = cssExists ? readFileSync(cssFile, "utf-8") : "";
  const cssIsBroken =
    !cssExists ||
    cssContent.split("\n").length < 20 ||
    cssContent.includes("rest of") ||
    cssContent.includes("unchanged") ||
    cssContent.includes("remains the same") ||
    cssContent.includes("\\n") ||       // literal \n escape instead of real newline
    !cssContent.includes("@keyframes"); // animations block was stripped
  if (cssIsBroken) {
    // Extract :root block the agent wrote (so we keep their theme colours)
    const rootMatch = cssContent.match(/:root\s*\{[^}]+\}/s);
    const rootBlock = rootMatch
      ? rootMatch[0]
      : ":root {\n  --color-primary: #4a1942;\n  --color-secondary: #c9a84c;\n  --color-bg: #0d0d0d;\n  --color-text: #e8d5b7;\n  --font-display: 'Cinzel', serif;\n}";
    // Rebuild: import + :root + everything after :root in the template
    const afterRoot = FULL_GLOBALS_CSS_TEMPLATE.indexOf("*, *::before");
    const tail = afterRoot !== -1 ? FULL_GLOBALS_CSS_TEMPLATE.slice(afterRoot) : "";
    writeFileSync(cssFile,
      `@import "tailwindcss";\n\n${rootBlock}\n\n${tail}`,
      "utf-8");
    process.stderr.write("[restore] Rebuilt broken globals.css — placeholder or missing @keyframes detected\n");
  }

  // Restore site-content.ts if missing OR if imageUrls are corrupted
  // (AgentBridge prompts sometimes get embedded into Pollinations URLs — detect + auto-fix)
  const contentFile = path.join(site, "app", "site-content.ts");
  const contentIsBroken = (() => {
    if (!existsSync(contentFile)) return true;
    const src = readFileSync(contentFile, "utf-8");
    // Corrupted: imageUrl longer than 400 chars, contains spaces/prose, or prompt text
    const urlMatches = [...src.matchAll(/imageUrl\s*:\s*["']([^"']+)["']/g)];
    return urlMatches.some(m => m[1].length > 400 || / [a-z]{4,} /.test(m[1]) || m[1].includes("you+are") || m[1].includes("persona"));
  })();
  if (contentIsBroken) {
    writeFileSync(contentFile, `export const SITE = {
  navbar: { brand: "My Site", links: [{label:"Home",href:"/"},{label:"About",href:"/about"},{label:"Contact",href:"/contact"}] },
  hero: { headline:"Welcome", subtext:"A great place to start.", cta1:"Get Started", cta2:"Learn More", imageUrl:"https://image.pollinations.ai/prompt/abstract+cinematic+dark?width=1600&height=900&nologo=true&model=turbo&seed=73421" },
  cards: [
    {title:"Feature One",desc:"An amazing feature.",imageUrl:"https://image.pollinations.ai/prompt/cinematic+portrait?width=400&height=300&nologo=true&model=turbo&seed=11111"},
    {title:"Feature Two",desc:"Another great aspect.",imageUrl:"https://image.pollinations.ai/prompt/cinematic+landscape?width=400&height=300&nologo=true&model=turbo&seed=22222"},
    {title:"Feature Three",desc:"Built for the future.",imageUrl:"https://image.pollinations.ai/prompt/cinematic+product?width=400&height=300&nologo=true&model=turbo&seed=33333"},
  ],
  features: { sectionTitle:"Why This Stands Out", items:[{icon:"⭐",title:"Quality",desc:"Built with care."},{icon:"🚀",title:"Speed",desc:"Fast and smooth."},{icon:"🎨",title:"Design",desc:"Beautiful visuals."},{icon:"🔒",title:"Reliable",desc:"Always dependable."}] },
  cta: { headline:"Ready to Begin?", body:"Take the next step.", button:"Start Now", imageUrl:"https://image.pollinations.ai/prompt/cinematic+epic+wide?width=1200&height=400&nologo=true&model=turbo&seed=55555" },
  footer: { brand:"My Site", tagline:"Building the future, one pixel at a time.", links:[{label:"About",href:"/about"},{label:"Contact",href:"/contact"}] },
  variants: { navbar:0, hero:0, cards:0, features:0, cta:0, footer:0 },
};`, "utf-8");
    process.stderr.write("[restore] Rebuilt corrupted site-content.ts (bad imageUrl detected)\n");
  }
}
restoreComponents();

// ── Component snapshots — taken once at startup, restored before each new build ──
// This ensures a new website build never inherits modifications from previous
// agent feature requests (CSS residue, hardcoded content, layout drift).
const _COMP_DIR = path.join(
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "generated-site", "src"),
  "components"
);
const _COMP_FILES = [
  "Navbar.tsx", "Hero.tsx", "CardSection.tsx", "Card.tsx",
  "FeatureStrip.tsx", "CTABanner.tsx", "Footer.tsx",
];
const COMPONENT_SNAPSHOTS = {};
for (const f of _COMP_FILES) {
  const fp = path.join(_COMP_DIR, f);
  if (existsSync(fp)) COMPONENT_SNAPSHOTS[f] = readFileSync(fp, "utf-8");
}
process.stderr.write(`[snapshot] ${Object.keys(COMPONENT_SNAPSHOTS).length} component baselines captured\n`);

// Patch fetch to cap max_tokens on Groq requests (free-tier 12k TPM limit).
const _origFetch = globalThis.fetch;
globalThis.fetch = async function patchedFetch(url, opts) {
  if (typeof url === "string" && url.includes("groq.com") && opts?.body) {
    try {
      const body = JSON.parse(typeof opts.body === "string" ? opts.body : await new Response(opts.body).text());
      body.max_tokens = Math.min(body.max_tokens ?? 4096, 4096);
      body.max_completion_tokens = Math.min(body.max_completion_tokens ?? 4096, 4096);
      opts = { ...opts, body: JSON.stringify(body) };
    } catch { /* skip non-JSON bodies */ }
  }
  return _origFetch(url, opts);
};

// Load .env
try {
  const envPath = path.join(path.dirname(fileURLToPath(import.meta.url)), ".env");
  const lines = readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (key && !(key in process.env)) process.env[key] = val;
  }
} catch { /* .env is optional */ }

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Multi-org Groq key pool ───────────────────────────────────────────────────
// Reads GROQ_API_KEY_1…5 from .env (falls back to GROQ_API_KEY for compat).
// Round-robins across all configured keys; on 429 marks the key as cooling down
// and immediately retries with the next available key.
const KEY_POOL = (() => {
  const pool = [];
  // Collect all numbered keys
  for (let i = 1; i <= 5; i++) {
    const val = process.env[`GROQ_API_KEY_${i}`]?.trim();
    if (val) pool.push({ key: val, label: `org-${i}`, cooldownUntil: 0, uses: 0, errors: 0 });
  }
  // Backward-compat: plain GROQ_API_KEY if no numbered keys found
  if (pool.length === 0) {
    const val = process.env.GROQ_API_KEY?.trim();
    if (val) pool.push({ key: val, label: "org-1", cooldownUntil: 0, uses: 0, errors: 0 });
  }
  if (pool.length === 0) throw new Error("No Groq API keys found. Set GROQ_API_KEY_1 … GROQ_API_KEY_5 in .env");
  process.stderr.write(`[keypool] ${pool.length} key(s) loaded: ${pool.map(k => k.label).join(", ")}\n`);
  return pool;
})();

let _poolIdx = 0; // round-robin cursor

/** Return the next available (not rate-limited) key entry.
 *  If every key is on cooldown, sleeps until the soonest one recovers. */
async function getKey() {
  const now = Date.now();
  // Try each key in round-robin order
  for (let i = 0; i < KEY_POOL.length; i++) {
    const idx = (_poolIdx + i) % KEY_POOL.length;
    const entry = KEY_POOL[idx];
    if (entry.cooldownUntil <= now) {
      _poolIdx = (idx + 1) % KEY_POOL.length; // advance cursor for next call
      return entry;
    }
  }
  // All keys cooling — wait for the soonest one
  const soonest = KEY_POOL.reduce((a, b) => a.cooldownUntil < b.cooldownUntil ? a : b);
  const wait = Math.max(0, soonest.cooldownUntil - Date.now());
  logEvent("KEYPOOL", `All ${KEY_POOL.length} keys rate-limited — waiting ${(wait / 1000).toFixed(1)}s for ${soonest.label}`, "⏳", C.red);
  await new Promise(r => setTimeout(r, wait + 200));
  soonest.cooldownUntil = 0;
  return soonest;
}

/** Mark a key as rate-limited; parse retry-after from response headers if present. */
function coolKey(entry, headers) {
  const retryAfter = parseInt(headers?.get?.("retry-after") ?? headers?.["retry-after"] ?? "60", 10);
  const secs = isNaN(retryAfter) ? 60 : Math.max(retryAfter, 5);
  entry.cooldownUntil = Date.now() + secs * 1000;
  entry.errors++;
  logEvent("KEYPOOL", `${entry.label} rate-limited (429) — cooldown ${secs}s`, "🔴", C.red);
  // Move cursor past this key
  const idx = KEY_POOL.indexOf(entry);
  _poolIdx = (idx + 1) % KEY_POOL.length;
}

/** Print key-pool status to stderr (called by /key-status endpoint). */
function keyPoolStatus() {
  const now = Date.now();
  return KEY_POOL.map(e => ({
    label: e.label,
    uses: e.uses,
    errors: e.errors,
    status: e.cooldownUntil > now
      ? `COOLING (${((e.cooldownUntil - now) / 1000).toFixed(1)}s)`
      : "READY",
  }));
}

// ── Agent directory roots ────────────────────────────────────────────────────
const AGENTS_DIR_ROOT = path.join(__dirname, "agents");

// ── Load an agent's identity context from SOUL.md / DUTIES.md / SKILL.md ─────
function loadAgentContext(agentDir) {
  return ['SOUL.md', 'DUTIES.md', 'SKILL.md', 'RULES.md']
    .map(f => {
      try { return readFileSync(path.join(agentDir, f), 'utf-8').trim(); }
      catch { return ''; }
    })
    .filter(Boolean)
    .join('\n\n---\n\n');
}

// ── Synchronous guardrails — runs before every file_write (no LLM call) ───────
// Returns { verdict: "ALLOW"|"BLOCK", agent?, reason?, checked_by? }
function guardrailsSync(filePath, content) {
  const fp = filePath ?? '';
  const ct = content ?? '';
  const bn = path.basename(fp);

  // policy-enforcer: only lock UX infrastructure — design components are writable
  const LOCKED = [
    'layout.tsx', 'page.tsx',
    'SpatialVoiceOverlay.tsx', 'SpatialLayout.tsx', 'SpatialTarget.tsx',
    'SpatialEditor.tsx', 'SpatialContext.tsx', 'AgentBridge.ts',
  ];
  if (LOCKED.includes(bn))
    return {
      verdict: 'BLOCK', agent: 'policy-enforcer',
      reason: `${bn} is locked UX infrastructure — agents should write site-content.ts instead`
    };

  // secret-sentinel: blocked file extensions
  if (/\.(env|pem|key|pfx|p12|secret)$/.test(fp))
    return {
      verdict: 'BLOCK', agent: 'secret-sentinel',
      reason: `Writes to *${path.extname(fp)} files are blocked`
    };

  // secret-sentinel: credential patterns in content
  if (/(?:GROQ_API_KEY|API_KEY|SECRET_KEY|PASSWORD|PRIVATE_KEY)\s*[=:]\s*["'][^"']{8,}/i.test(ct))
    return {
      verdict: 'BLOCK', agent: 'secret-sentinel',
      reason: 'Potential secret/credential pattern in file content'
    };

  // diff-auditor: dangerous shell patterns
  if (/(?:rm\s+-rf\s+\/|>\s*\/etc\/|chmod\s+777|eval\s*\(process\.env)/.test(ct))
    return {
      verdict: 'BLOCK', agent: 'diff-auditor',
      reason: 'Dangerous shell/eval pattern detected in content'
    };

  return {
    verdict: 'ALLOW',
    checked_by: ['policy-enforcer', 'secret-sentinel', 'diff-auditor', 'scope-validator'],
  };
}

// ── Classify intent into a code-editor tier ──────────────────────────────────
function classifyTier(intent, prompt) {
  const p = prompt.toLowerCase();
  if (intent === 'arch') return 'architect';
  if (/\b(ui|component|layout|tailwind|css|design|visual|color|font|style)\b/.test(p)) return 'uiux';
  if (/\b(all|entire|every|across|multiple|multi|files|routes|pages)\b/.test(p)) return 'snr';
  if (intent === 'fix' && !/\b(all|multiple|routes|pages)\b/.test(p)) return 'jnr';
  return 'snr';
}

// ── Active model ──────────────────────────────────────────────────────────────
// Groq free-tier daily TPD limits are PER MODEL — each model has its own bucket.
// Priority order when quotas are exhausted:
//   1. groq:llama-3.3-70b-versatile   — 100k TPD, separate from llama-4-scout
//   2. groq:llama-3.1-8b-instant      — fastest, own quota bucket
//   3. groq:meta-llama/llama-4-scout-17b-16e-instruct — 500k TPD (exhausts fastest)
//   4. google:gemini-2.0-flash        — free tier 50 RPD
//   5. google:gemini-2.0-flash-lite   — higher free-tier RPM than flash
//
// Model priority by TPM headroom (free tier):
//   llama-4-scout  : ~30k TPM, 500k TPD  ← default
//   llama-3.3-70b  : 12k TPM, 100k TPD
//   llama-3.1-8b   : 6k TPM, 500k TPD
// Override: MODEL=groq:llama-3.3-70b-versatile node index.js
const MODEL = process.env.MODEL || "groq:meta-llama/llama-4-scout-17b-16e-instruct";

function makeScriptTool({ name, description, inputSchema, scriptFile }) {
  return {
    name,
    description,
    inputSchema,
    handler: (args, signal) =>
      new Promise((resolve, reject) => {
        const child = spawn("node", [path.join(__dirname, "tools", scriptFile)], {
          cwd: __dirname,
          stdio: ["pipe", "pipe", "pipe"],
          env: { ...process.env },
        });
        let stdout = "";
        let stderr = "";
        child.stdout.on("data", (d) => { stdout += d.toString("utf-8"); });
        child.stderr.on("data", (d) => { stderr += d.toString("utf-8"); });
        child.stdin.write(JSON.stringify(args));
        child.stdin.end();
        const timer = setTimeout(() => { child.kill("SIGTERM"); reject(new Error(`Tool "${name}" timed out`)); }, 120_000);
        const onAbort = () => child.kill("SIGTERM");
        if (signal) signal.addEventListener("abort", onAbort, { once: true });
        child.on("error", (err) => { clearTimeout(timer); reject(err); });
        child.on("close", (code) => {
          clearTimeout(timer);
          if (signal) signal.removeEventListener("abort", onAbort);
          if (signal?.aborted) return reject(new Error("Aborted"));
          if (code !== 0 && code !== null) return reject(new Error(`Tool "${name}" exited ${code}: ${stderr.trim()}`));
          let text = stdout.trim();
          try {
            const parsed = JSON.parse(text);
            if (parsed.text) text = parsed.text;
            else if (parsed.result) text = typeof parsed.result === "string" ? parsed.result : JSON.stringify(parsed.result);
          } catch { /* raw text output is fine */ }
          resolve(text || "(no output)");
        });
      }),
  };
}

// ── append_memory tool — lets the agent persist new learnings ─────────────────
function makeAppendMemoryTool() {
  const memFile = path.join(__dirname, "memory", "known-errors.md");
  return {
    name: "append_memory",
    description: "Append a new known-error rule to agent memory so it is avoided in future sessions. Call this whenever you encounter a new build error or import mistake that isn't already in memory.",
    inputSchema: {
      type: "object",
      required: ["category", "rule"],
      properties: {
        category: { type: "string", description: "Short category heading, e.g. 'IMPORTS'" },
        rule: { type: "string", description: "The rule to remember, written as a bullet point" },
      },
    },
    handler: ({ category, rule }) => {
      try {
        const entry = `\n## ${category} (auto-learned)\n- ${rule}\n`;
        appendFileSync(memFile, entry, "utf-8");
        return `Memory updated: [${category}] ${rule}`;
      } catch (e) {
        return `Memory write failed: ${e.message}`;
      }
    },
  };
}

const TOOLS = [
  makeAppendMemoryTool(),
  makeScriptTool({
    name: "file_read",
    description: "Read contents of a file at a given path.",
    inputSchema: { type: "object", required: ["path"], properties: { path: { type: "string" } } },
    scriptFile: "scripts/file-read.js",
  }),
  makeScriptTool({
    name: "file_write",
    description: "Write full content to a file. You must provide the complete file content.",
    inputSchema: { type: "object", required: ["path", "content"], properties: { path: { type: "string" }, content: { type: "string" } } },
    scriptFile: "scripts/file-write.js",
  }),
  makeScriptTool({
    name: "search",
    description: "Search for patterns within files. Returns matching lines with file paths and line numbers.",
    inputSchema: { type: "object", required: ["pattern", "path"], properties: { pattern: { type: "string" }, path: { type: "string" }, file_glob: { type: "string" }, case_insensitive: { type: "boolean" } } },
    scriptFile: "scripts/search.js",
  }),
  makeScriptTool({
    name: "shell_exec",
    description: "Execute a read-only shell command (ls, find, grep, cat). Architect sub-agent only.",
    inputSchema: { type: "object", required: ["command"], properties: { command: { type: "string" }, cwd: { type: "string" } } },
    scriptFile: "scripts/shell-exec.js",
  }),
  makeScriptTool({
    name: "github_search",
    description: "Search GitHub repositories, code, or issues.",
    inputSchema: { type: "object", required: ["query"], properties: { query: { type: "string" }, type: { type: "string", enum: ["repositories", "code", "issues"] }, per_page: { type: "number" } } },
    scriptFile: "scripts/github-search.js",
  }),
  makeScriptTool({
    name: "devpost_search",
    description: "Search Devpost for hackathon projects matching a query.",
    inputSchema: { type: "object", required: ["query"], properties: { query: { type: "string" }, per_page: { type: "number" } } },
    scriptFile: "scripts/devpost-search.js",
  }),
  makeScriptTool({
    name: "http_get",
    description: "Fetch content of a public URL. Strips HTML tags. Blocks internal/private IPs.",
    inputSchema: { type: "object", required: ["url"], properties: { url: { type: "string" }, headers: { type: "object" } } },
    scriptFile: "scripts/http-get.js",
  }),
  // ── qa_site ──────────────────────────────────────────────────────────────────
  // Fetches the running dev site, checks HTTP status, parses HTML for Next.js
  // compile/runtime errors, checks section presence, and returns a structured
  // error report for snr-developer to act on.
  makeScriptTool({
    name: "qa_site",
    description: "QA the running Next.js dev site. Fetches the page, detects compile/runtime/hydration errors, checks that key sections (navbar, hero, footer, cards) are rendered, and returns { status, visual_score, errors[], warnings[], section_check, summary, fix_instruction }. Call this after every website generation and after every fix cycle.",
    inputSchema: {
      type: "object",
      required: ["url"],
      properties: {
        url: { type: "string", description: "URL to test, e.g. http://localhost:3001" },
        intent: { type: "string", description: "Original user request — used to check that the right sections exist" },
      },
    },
    scriptFile: "scripts/qa-site.js",
  }),
  // ── fetch_images ─────────────────────────────────────────────────────────────
  // Generates Pollinations.ai AI image URLs and CSS animation blocks for a theme.
  // Returns { images: [{url, alt, zone, width, height}], animations_css, meta }.
  // Pure URL-building — no external HTTP calls, instant response.
  makeScriptTool({
    name: "fetch_images",
    description: "Build themed image URLs (Pollinations.ai AI or Unsplash stock) and CSS animation blocks for a given design theme. Call this during website generation to get real image URLs for every layout zone. Returns { images: [{url, alt, zone, width, height}], animations_css: string }.",
    inputSchema: {
      type: "object",
      required: ["theme"],
      properties: {
        theme: { type: "string", description: "Primary theme keyword(s), e.g. 'stranger things supernatural 1980s'" },
        vibe: { type: "string", description: "Mood descriptor e.g. 'dark horror retro'" },
        style: { type: "string", description: "Art direction e.g. 'cinematic photorealistic'" },
        type: { type: "string", enum: ["ai", "photo"], description: "'ai' = Pollinations.ai generated, 'photo' = Unsplash stock" },
        count: { type: "number", description: "Number of images to generate (default 4, max 6)" },
        zones: { type: "array", items: { type: "string" }, description: "Layout zones needing images: hero, card, background, cta" },
        width: { type: "number", description: "Default image width (overridden per zone)" },
        height: { type: "number", description: "Default image height (overridden per zone)" },
      },
    },
    scriptFile: "scripts/fetch-images.js",
  }),
  // ── launch_frontend ─────────────────────────────────────────────────────────
  // Port layout:
  //   :3000  — generated-site PREVIEW  (read-only, no spatial editor)
  //   :3001  — generated-site EDITOR   (spatial hand-tracking overlay active)
  //   :3002  — agent HTTP API          (started lazily on first frontend call)
  {
    name: "launch_frontend",
    description: "Start the generated-site dev server and open the given URL. Use http://localhost:3000 for preview. Use http://localhost:3001 for the spatial editor (when user says 'edit', 'redesign', or 'visual editor'). NEVER auto-open on startup.",
    inputSchema: {
      type: "object",
      required: ["url"],
      properties: {
        url: { type: "string", description: "URL to open: http://localhost:3000 (preview) OR http://localhost:3001 (spatial editor)" },
      },
    },
    handler: ({ url }) =>
      new Promise((resolve) => {
        startApiServerIfNeeded();
        const ROOT = path.resolve(__dirname, "..");
        const isWin = process.platform === "win32";
        const isMac = process.platform === "darwin";
        const siteDir = path.join(ROOT, "generated-site");

        // Determine which port the user needs
        const port = url.includes("3001") ? 3001 : 3000;
        const title = port === 3001 ? "generated-site :3001 EDITOR" : "generated-site :3000 PREVIEW";

        const openBrowser = () => {
          const cmd = isWin ? `start "" "${url}"` : isMac ? `open "${url}"` : `xdg-open "${url}"`;
          exec(cmd, { shell: true }, (err) => {
            resolve(err
              ? `Server on :${port} running. Failed to open browser: ${err.message}`
              : `Server on :${port} running. Opened ${url} in browser.`
            );
          });
        };

        if (_activePorts.has(port)) {
          return openBrowser();
        }

        _activePorts.add(port);

        if (isWin) {
          exec(`start "${title}" cmd /k "cd /d "${siteDir}" && npm run dev -- -p ${port}"`);
        } else {
          const c = spawn("npm", ["run", "dev", "--", "-p", String(port)], { cwd: siteDir, stdio: "ignore", detached: true });
          c.unref();
        }

        setTimeout(openBrowser, 5000);
      }),
  },
];

// ── Wrap file_write with guardrails interception ──────────────────────────────
// Every write goes through secret-sentinel, policy-enforcer, diff-auditor,
// scope-validator before the actual file is touched. No LLM call needed.
{
  const fw = TOOLS.find(t => t.name === "file_write");
  if (fw) {
    const _orig = fw.handler;
    fw.handler = async (args, signal) => {
      const fp = args?.path ?? '';
      logEvent("GUARDRAILS", `Intercepting write → ${path.basename(fp)}…`, "🛡️", C.red);
      const check = guardrailsSync(fp, args?.content);
      if (check.verdict === 'BLOCK') {
        logEvent("GUARDRAILS", `BLOCKED [${check.agent}]: ${check.reason}`, "🚫", C.red);
        return `BLOCKED: ${check.reason}`;
      }
      logEvent("GUARDRAILS", `ALLOW — ${(check.checked_by ?? []).join(', ')}`, "✅", C.green);
      return _orig(args, signal);
    };
  }
}

const GENERATED_SITE = path.resolve(__dirname, "..", "generated-site");

const SYSTEM_PROMPT = `You are repo-sandbox-agent — a full-stack web designer backed by a research + UIUX pipeline.

== DESIGN SYSTEM: HOW THE SITE WORKS ==
The site has 6 components, each with 5 genuinely different layout variants (0–4).
You choose variants by writing the "variants" object in site-content.ts — this changes the actual layout, not just colors.

COMPONENT VARIANTS (choose based on the site type and personality):
  navbar:   0=Classic(logo-left)   1=Centered(logo-middle)   2=Animated(typewriter logo)   3=GlassCTA(frosted+button)   4=Minimal(hamburger drawer)
  hero:     0=Cinematic(fullbleed) 1=Split(text+img side)    2=BoldType(huge gradient text) 3=Magazine(editorial)        4=Asymmetric(dramatic glitch)
  cards:    0=Grid(3col)           1=Carousel(scroll strip)  2=Featured(1big+smalls)        3=Masonry(staggered)         4=List(alternating rows)
  features: 0=IconGrid             1=Numbered(01 02 03)      2=Alternating(left/right)      3=Timeline(vertical line)    4=StatCards(scroll+stats)
  cta:      0=Fullbleed(imgbg)     1=Split(text+img)         2=Minimal(border accent)       3=GlassCard(frosted card)    4=HorizBar(banner strip)
  footer:   0=TwoCol               1=Centered                2=Minimal(1 line)              3=BigBrand(watermark text)   4=DarkCard(raised frosted)

Examples by site type:
  E-commerce shop   → navbar:3 hero:1 cards:0 features:4 cta:1 footer:0
  Creative portfolio → navbar:4 hero:4 cards:3 features:2 cta:2 footer:3
  SaaS landing      → navbar:3 hero:2 cards:2 features:1 cta:3 footer:1
  Restaurant/food   → navbar:1 hero:0 cards:0 features:0 cta:0 footer:1
  Dark/gaming       → navbar:2 hero:4 cards:1 features:4 cta:0 footer:4

== FILES YOU WRITE ==
  MAIN: ${GENERATED_SITE}/src/app/site-content.ts   ← content + variants (always set ALL 6 variant indices)
  CSS:  ${GENERATED_SITE}/src/app/globals.css        ← only the :root { } block

== LOCKED FILES (do not touch) ==
  layout.tsx · page.tsx · SpatialVoiceOverlay.tsx · SpatialLayout.tsx · SpatialTarget.tsx

== WHEN BUILDING A WEBSITE ==
STEP 1 — Write site-content.ts with ALL sections AND variants block:
  export const SITE = {
    navbar: { brand: "...", links: [{label:"...",href:"/..."},...] },
    hero: { headline:"...", subtext:"...", cta1:"...", cta2:"...",
            imageUrl:"https://image.pollinations.ai/prompt/THEME+cinematic?width=1600&height=900&nologo=true&model=turbo&seed=NNNNN" },
    cards: [
      {title:"...",desc:"...",imageUrl:"https://image.pollinations.ai/prompt/THEME+scene?width=400&height=300&nologo=true&model=turbo&seed=NNNNN"},
      {title:"...",desc:"...",imageUrl:"https://image.pollinations.ai/prompt/THEME+scene2?width=400&height=300&nologo=true&model=turbo&seed=NNNNN"},
      {title:"...",desc:"...",imageUrl:"https://image.pollinations.ai/prompt/THEME+scene3?width=400&height=300&nologo=true&model=turbo&seed=NNNNN"},
    ],
    features: { sectionTitle:"...", items:[
      {icon:"emoji",title:"...",desc:"..."},
      {icon:"emoji",title:"...",desc:"..."},
      {icon:"emoji",title:"...",desc:"..."},
      {icon:"emoji",title:"...",desc:"..."},
    ]},
    cta: { headline:"...", body:"...", button:"...",
           imageUrl:"https://image.pollinations.ai/prompt/THEME+wide?width=1200&height=400&nologo=true&model=turbo&seed=NNNNN" },
    footer: { brand:"...", tagline:"...", links:[{label:"...",href:"/..."},...] },
    variants: {
      navbar:   N,   // 0-4 — MUST match the site personality
      hero:     N,
      cards:    N,
      features: N,
      cta:      N,
      footer:   N,
    },
  };
  Rules: themed content · Pollinations image URLs with random seeds · no imports · plain strings only

STEP 2 — Read globals.css then write back replacing ONLY :root { }:
  Variable names: --color-primary  --color-secondary  --color-bg  --color-text  --font-display
  ❌ NEVER delete anything below :root · NEVER add body{} or @keyframes · write the FULL file
  ❌ NEVER write "/* rest of file unchanged */" — include every line

STEP 3 — launch_frontend("http://localhost:3000") — final step, nothing after

== CODE EDIT ("fix/add/refactor/change") ==
1. Read the target file at the exact path
2. Apply minimal change — do not rewrite unrelated code
3. Write back to the same path
NEVER use next/image — always plain <img src="...">
NEVER import from paths other than lucide-react, next/link, or react

${AGENT_MEMORY ? "== MEMORY: KNOWN ERRORS ==\n" + AGENT_MEMORY : ""}`;
// ── Lazy HTTP API server on :3002 (started only when frontend work begins) ─────

let _apiServer = null;

function startApiServerIfNeeded() {
  if (_apiServer) return;
  _apiServer = http.createServer(async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.writeHead(200);
      res.end();
      return;
    }

    if (req.method === "POST" && req.url === "/command") {
      let body = "";
      req.on("data", (d) => { body += d; });
      req.on("end", async () => {
        let prompt = "";
        try {
          prompt = JSON.parse(body).prompt?.trim() ?? "";
        } catch {
          res.writeHead(400, { "Content-Type": "text/plain" });
          res.end("Invalid JSON");
          return;
        }

        if (!prompt) {
          res.writeHead(400, { "Content-Type": "text/plain" });
          res.end("Empty prompt");
          return;
        }

        res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });

        try {
          const voiceIntent = classifyIntent(prompt);

          // ── Website build: use the full Research→UIUX→SNR-DEV pipeline ──────
          if (voiceIntent === "website") {
            res.write("[ORCHESTRATOR] Building website via Research→UIUX pipeline…\n");
            await buildWebsiteDirect(prompt);
            res.end("\n[done]");
            return;
          }

          // ── Visual editor: launch directly ────────────────────────────────
          if (voiceIntent === "visual") {
            const lt = TOOLS.find(t => t.name === "launch_frontend");
            if (lt) await lt.handler({ url: "http://localhost:3001" });
            res.end("[CANVAS] Spatial editor launched\n[done]");
            return;
          }

          // ── All other intents (fix / feature / arch / chat): tool-calling ──
          const voiceToolMap = Object.fromEntries(TOOLS.map(t => [t.name, t]));
          const voicePick = (...names) => names.map(n => voiceToolMap[n]).filter(Boolean);
          const voiceTools = {
            fix: voicePick("file_read", "file_write", "search", "qa_site", "launch_frontend", "append_memory"),
            feature: voicePick("file_read", "file_write", "search", "qa_site", "launch_frontend", "append_memory"),
            arch: voicePick("file_read", "file_write", "search", "shell_exec", "qa_site", "launch_frontend", "append_memory"),
            chat: [],
          }[voiceIntent] ?? voicePick("file_read", "file_write", "search", "append_memory");

          // Inject active pool key so gitclaw's query() picks it up
          const _activeKey = await getKey();
          process.env.GROQ_API_KEY = _activeKey.key;
          logEvent("KEYPOOL", `query() using ${_activeKey.label}`, "🔑", C.dim);

          for await (const msg of query({
            prompt,
            dir: __dirname,
            model: MODEL,
            tools: voiceTools,
            replaceBuiltinTools: true,
            systemPrompt: SYSTEM_PROMPT,
            constraints: { maxTokens: 4096 },
          })) {
            if (msg.type === "delta") res.write(msg.content);
            else if (msg.type === "assistant") res.write("\n");
          }
          _activeKey.uses++;
          res.end("\n[done]");
        } catch (e) {
          res.end(`\n[error] ${e.message}`);
        }
      });
      return;
    }

    // ── GET /key-status — key pool health (which orgs are ready / cooling) ────
    if (req.method === "GET" && req.url === "/key-status") {
      const status = keyPoolStatus();
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ keys: status, totalKeys: KEY_POOL.length }, null, 2));
      // Also print to stderr for terminal visibility
      process.stderr.write(`[keypool] status:\n${status.map(k => `  ${k.label}: ${k.status} | uses:${k.uses} err:${k.errors}`).join('\n')}\n`);
      return;
    }

    // ── GET /variants — return generated design variants as JSON ─────────────
    if (req.method === "GET" && req.url === "/variants") {
      res.writeHead(200, { "Content-Type": "application/json" });
      try {
        const vp = path.join(GENERATED_SITE, "src", "app", "design-variants.json");
        res.end(existsSync(vp) ? readFileSync(vp, "utf-8") : "[]");
      } catch { res.end("[]"); }
      return;
    }

    // ── POST /apply-variant — patch globals.css with component-scoped vars ───
    if (req.method === "POST" && req.url === "/apply-variant") {
      let body = "";
      req.on("data", d => { body += d; });
      req.on("end", () => {
        try {
          const { id, component } = JSON.parse(body);
          const vp = path.join(GENERATED_SITE, "src", "app", "design-variants.json");
          if (!existsSync(vp)) throw new Error("No variants file — build a site first");
          const variants = JSON.parse(readFileSync(vp, "utf-8"));
          const variant = variants.find(v => v.id === id);
          if (!variant) throw new Error(`Variant id=${id} not found`);

          // Map component name → CSS selector
          const SEL = {
            navbar: "nav",
            hero: "section:first-of-type",
            cards: "section:nth-of-type(2)",
            features: "section:nth-of-type(3)",
            cta: "section:nth-of-type(4)",
            footer: "footer",
            header: "header",
          };
          const selector = SEL[component] ?? component;

          // Compute contrast colors
          const hexLum = (hex) => {
            const c = hex.replace(/^#/, "");
            const r = parseInt(c.slice(0,2)||"00",16);
            const g = parseInt(c.slice(2,4)||"00",16);
            const b = parseInt(c.slice(4,6)||"00",16);
            return (0.299*r + 0.587*g + 0.114*b) / 255;
          };
          const onPrimary   = hexLum(variant.palette.primary)   > 0.45 ? "#000000" : "#ffffff";
          const onSecondary = hexLum(variant.palette.secondary) > 0.45 ? "#000000" : "#ffffff";

          // Build override block
          const block =
            `\n/* [COMPONENT-OVERRIDE: ${component}] */\n` +
            `${selector} {\n` +
            `  --color-primary:      ${variant.palette.primary};\n` +
            `  --color-secondary:    ${variant.palette.secondary};\n` +
            `  --color-bg:           ${variant.palette.bg};\n` +
            `  --color-text:         ${variant.palette.text};\n` +
            `  --color-on-primary:   ${onPrimary};\n` +
            `  --color-on-secondary: ${onSecondary};\n` +
            `}\n`;

          // Remove any existing override for this component, then append new one
          const cssPath = path.join(GENERATED_SITE, "src", "app", "globals.css");
          let css = readFileSync(cssPath, "utf-8");
          const existing = new RegExp(
            `\\n\\/\\* \\[COMPONENT-OVERRIDE: ${component}\\] \\*\\/[\\s\\S]*?\\}\\n`, "g"
          );
          css = css.replace(existing, "").trimEnd() + "\n" + block;
          writeFileSync(cssPath, css, "utf-8");

          logEvent("SNR-DEV", `Applied variant "${variant.name}" → ${selector}`, "", C.cyan);
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ ok: true, variant: variant.name, component, selector }));
        } catch (e) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ ok: false, error: e.message }));
        }
      });
      return;
    }

    // ── POST /apply-design-variant — switch layout variant for a component ────
    if (req.method === "POST" && req.url === "/apply-design-variant") {
      let body = "";
      req.on("data", d => { body += d; });
      req.on("end", () => {
        try {
          const { component, variantIndex } = JSON.parse(body);
          const validComponents = ["navbar", "hero", "cards", "features", "cta", "footer"];
          if (!validComponents.includes(component)) throw new Error(`Unknown component: ${component}`);
          const idx = Number(variantIndex);
          if (isNaN(idx) || idx < 0 || idx > 4) throw new Error(`variantIndex must be 0-4, got ${variantIndex}`);

          const siteContentPath = path.join(GENERATED_SITE, "src", "app", "site-content.ts");
          let src = readFileSync(siteContentPath, "utf-8");

          // Update the specific variant number in the variants block
          // Matches:  navbar:   0,  or  navbar:   3,  etc.
          const re = new RegExp(`(\\b${component}:\\s*)\\d+(,)`);
          if (!re.test(src)) throw new Error(`Could not find variants.${component} in site-content.ts`);
          src = src.replace(re, `$1${idx}$2`);
          writeFileSync(siteContentPath, src, "utf-8");

          logEvent("SNR-DEV", `Layout variant → ${component}=${idx}`, "", C.cyan);
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ ok: true, component, variantIndex: idx }));
        } catch (e) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ ok: false, error: e.message }));
        }
      });
      return;
    }

    // ── GET /site-variants — read current variant indices from site-content.ts ─
    if (req.method === "GET" && req.url === "/site-variants") {
      try {
        const siteContentPath = path.join(GENERATED_SITE, "src", "app", "site-content.ts");
        const src = readFileSync(siteContentPath, "utf-8");
        const match = src.match(/variants\s*:\s*\{([^}]+)\}/s);
        if (!match) { res.writeHead(200, { "Content-Type": "application/json" }); res.end("{}"); return; }
        const vars = {};
        for (const line of match[1].split("\n")) {
          const m = line.match(/(\w+)\s*:\s*(\d+)/);
          if (m) vars[m[1]] = Number(m[2]);
        }
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(vars));
      } catch {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end("{}");
      }
      return;
    }

    res.writeHead(404);
    res.end();
  });

  _apiServer.listen(3002, () => {
    process.stderr.write("[agent-api] HTTP server on http://localhost:3002\n");
  }).on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
      process.stderr.write("[agent-api] Port 3002 in use (expected if another instance is running).\n");
    } else {
      console.error("[agent-api] Error:", e);
    }
  });
}

// ── Agent runner ───────────────────────────────────────────────────────────────
// Role → display config  (covers all 18 agents + system roles)
const ROLE_CONFIG = {
  ORCHESTRATOR: { emoji: "🤖", color: C.white },
  "CODE-EDITOR": { emoji: "📋", color: C.yellow },
  ARCHITECT: { emoji: "🏗️", color: C.yellow },
  "SNR-DEV": { emoji: "📦", color: C.cyan },
  "JNR-DEV": { emoji: "🔧", color: C.blue },
  UIUX: { emoji: "🎨", color: C.magenta },
  QA: { emoji: "🔍", color: C.magenta },
  CANVAS: { emoji: "✏️", color: C.magenta },
  PREVIEW: { emoji: "🌐", color: C.green },
  MEMORY: { emoji: "💾", color: C.yellow },
  GUARDRAILS: { emoji: "🛡️", color: C.red },
  RESEARCH: { emoji: "🔭", color: C.cyan },
  RESOURCER: { emoji: "🖼️", color: C.cyan },
  "IMAGE-GEN": { emoji: "🎨", color: C.magenta },
  EDITOR: { emoji: "✏️", color: C.magenta },
};

function emitRoleBanner(role) {
  const cfg = ROLE_CONFIG[role] ?? { emoji: "●", color: C.white };
  logEvent(role, `${getPhaseDescription(role)}`, cfg.emoji, cfg.color);
}

function getPhaseDescription(role) {
  const map = {
    ORCHESTRATOR: "Routing intent…",
    "CODE-EDITOR": "Assessing tier — dispatching to sub-agent…",
    ARCHITECT: "Architect analyzing — planning build…",
    "SNR-DEV": "Senior Developer splitting work across files…",
    "JNR-DEV": "Junior Developer applying targeted edit…",
    UIUX: "UI/UX Designer applying visual changes…",
    QA: "Site-tester running validation…",
    CANVAS: "Opening visual / spatial editor…",
    PREVIEW: "Launching preview server…",
    MEMORY: "Writing to agent memory…",
    GUARDRAILS: "Guardrails checking operation…",
    RESEARCH: "Research agent searching…",
    RESOURCER: "Resourcer curating visual assets…",
    "IMAGE-GEN": "Image-gen crafting Puter.js prompts & injecting loader…",
  };
  return map[role] ?? "Working…";
}

// Map tool names to roles for mid-stream role detection
function detectRoleFromToolName(toolName) {
  if (toolName === "launch_frontend") return null; // handled inline
  if (toolName === "qa_site") return "QA";
  if (toolName === "append_memory") return "MEMORY";
  if (toolName === "shell_exec") return "ARCHITECT";
  if (["file_read", "file_write", "search"].includes(toolName)) return null; // shown inline
  return null;
}

// ── Shared Groq chat helper — uses key pool with automatic 429 rotation ────────
async function callGroq(systemPrompt, userMessage, maxTokens = 1200, temperature = 0.7) {
  const GROQ_MODEL = "llama-3.3-70b-versatile";
  let lastErr;

  // Try every key in the pool (round-robin + fallback on 429)
  for (let attempt = 0; attempt < KEY_POOL.length * 2; attempt++) {
    const entry = await getKey();
    logEvent("KEYPOOL", `Using ${entry.label} (uses:${entry.uses})`, "🔑", C.dim);

    let r;
    try {
      r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${entry.key}` },
        body: JSON.stringify({
          model: GROQ_MODEL,
          max_tokens: Math.min(maxTokens, 4096),
          temperature,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage },
          ],
        }),
      });
    } catch (netErr) {
      lastErr = netErr;
      logEvent("KEYPOOL", `${entry.label} network error: ${netErr.message}`, "⚠️", C.red);
      continue;
    }

    if (r.status === 429) {
      coolKey(entry, r.headers);
      lastErr = new Error(`${entry.label} rate-limited`);
      continue; // rotate to next key
    }

    const j = await r.json();
    if (!r.ok) {
      lastErr = new Error(`Groq ${r.status}: ${JSON.stringify(j).slice(0, 200)}`);
      logEvent("KEYPOOL", `${entry.label} error ${r.status} — skipping`, "⚠️", C.red);
      entry.errors++;
      continue;
    }

    entry.uses++;
    let text = j.choices?.[0]?.message?.content?.trim() ?? "";
    text = text.replace(/^```[a-z]*\n?/m, "").replace(/\n?```$/m, "").trim();
    return text;
  }

  throw lastErr ?? new Error("All Groq keys exhausted");
}

// ── WEBSITE-BUILDER AGENT LOADER ──────────────────────────────────────────────
// Supports the gitagent standard: composes system prompt from SOUL.md + RULES.md
// + skills/*/SKILL.md (stripping YAML frontmatter). Falls back to SYSTEM.md for
// agents that haven't been migrated yet.
// image-gen-agent lives at agents/image-gen-agent/ (not inside website-builder/).
const WB_AGENTS_DIR = path.join(__dirname, "agents", "website-builder");
const AGENTS_DIR    = path.join(__dirname, "agents");

function _stripFrontmatter(text) {
  // Remove YAML frontmatter block (--- ... ---) from SKILL.md files
  return text.replace(/^---[\s\S]*?---\s*/m, "").trim();
}

function _loadGitagentSystem(agentDir) {
  const soulPath  = path.join(agentDir, "SOUL.md");
  const rulesPath = path.join(agentDir, "RULES.md");
  const skillsDir = path.join(agentDir, "skills");

  if (!existsSync(soulPath)) return null;

  const parts = [readFileSync(soulPath, "utf-8").trim()];

  if (existsSync(rulesPath)) {
    parts.push(readFileSync(rulesPath, "utf-8").trim());
  }

  if (existsSync(skillsDir)) {
    for (const skillName of readdirSync(skillsDir)) {
      const skillMd = path.join(skillsDir, skillName, "SKILL.md");
      if (existsSync(skillMd)) {
        parts.push(_stripFrontmatter(readFileSync(skillMd, "utf-8")));
      }
    }
  }

  return parts.join("\n\n---\n\n");
}

function loadAgentSystem(agentName) {
  // image-gen-agent lives outside website-builder/
  const agentDir = agentName === "image-gen-agent"
    ? path.join(AGENTS_DIR, "image-gen-agent")
    : path.join(WB_AGENTS_DIR, agentName);

  // Try gitagent standard first (SOUL.md + RULES.md + skills/)
  const gitagent = _loadGitagentSystem(agentDir);
  if (gitagent) return gitagent;

  // Fall back to legacy SYSTEM.md
  const systemPath = path.join(agentDir, "SYSTEM.md");
  if (existsSync(systemPath)) {
    return readFileSync(systemPath, "utf-8").trim();
  }

  throw new Error(`[agent-loader] No system prompt found for agent: ${agentName} (checked ${agentDir} for SOUL.md and SYSTEM.md)`);
}

// ── RESEARCH AGENT — discovers what this type of website needs ─────────────────
// Returns JSON: { siteType, aesthetic, keyFeatures[], targetAudience,
//                 designInspiration, variants:{navbar,hero,cards,features,cta,footer},
//                 colorPalette:{primary,secondary,bg,text}, fontDisplay, imageKeywords[] }
async function runResearchAgent(userPrompt) {
  logHandoff("ORCHESTRATOR", "RESEARCH", "discovering design DNA for request");
  emitRoleBanner("RESEARCH");
  const SYSTEM = loadAgentSystem("research-agent");

  const text = await callGroq(SYSTEM, `Website request: ${ userPrompt } `, 1000, 0.6);
  try {
    const research = JSON.parse(text);
    logEvent("RESEARCH", `Site type: ${ research.siteType } | Variants: navbar = ${ research.variants?.navbar } hero = ${ research.variants?.hero } cards = ${ research.variants?.cards } `, "", C.cyan);
    return research;
  } catch (err) {
    logEvent("RESEARCH", `JSON parse failed. Raw: ${text.slice(0, 100).replace(/\\n/g, ' ')}...`, "", C.red);
    return { siteType: "landing", variants: { navbar: 0, hero: 0, cards: 0, features: 0, cta: 0, footer: 0 }, colorPalette: {}, fontDisplay: "'Inter', sans-serif", imageKeywords: [] };
  }
}

// ── RESOURCER AGENT — curates specific images + enriches design brief ──────────
// Returns JSON: { imageTheme, heroSeed, cardSeeds[], ctaSeed, palette, fontDisplay }
async function runResourcerAgent(research, userPrompt) {
  logHandoff("RESEARCH", "RESOURCER", "curating visual assets and image prompts");
  emitRoleBanner("RESOURCER");
  const aesthetic = research.aesthetic ?? "";
  const keywords  = (research.imageKeywords ?? []).join(", ");
  const SYSTEM = loadAgentSystem("resourcer-agent");
  const text = await callGroq(SYSTEM, `Site: ${ userPrompt } \nAesthetic: ${ aesthetic } \nKeywords: ${ keywords } `, 400, 0.8);
  try {
    const res = JSON.parse(text);
    logEvent("RESOURCER", `Image theme: "${res.imageTheme}" | Seeds: ${ res.heroSeed }, ${ res.cardSeeds?.join(",") } `, "", C.cyan);
    return res;
  } catch (err) {
    logEvent("RESOURCER", `JSON parse failed. Raw: ${text.slice(0, 100).replace(/\\n/g, ' ')}...`, "", C.red);
    return { imageTheme: userPrompt.toLowerCase().replace(/\\s+/g, "+"), heroSeed: 73421, cardSeeds: [11111,22222,33333], ctaSeed: 55555, fontDisplay: "'Inter', sans-serif" };
  }
}

// ── UIUX AGENT — decides final design: sectionTitle copy, CTA text, feature labels ──
async function runUIUXAgent(research, resources, userPrompt) {
  logHandoff("RESOURCER", "UIUX", "designing content + copy for each section");
  emitRoleBanner("UIUX");
  const theme = resources.imageTheme ?? userPrompt;
  const SYSTEM = loadAgentSystem("uiux-agent");
  const text = await callGroq(SYSTEM, `Design brief:\n- Site: ${userPrompt}\n- Style: ${research.aesthetic}\n- Audience: ${research.targetAudience}\n- Inspiration: ${research.designInspiration}`, 1400, 0.75);
  try {
    const ux = JSON.parse(text);
    logEvent("UIUX", `Brand: "${ux.brand}" | Headline: "${ux.heroHeadline}"`, "", C.magenta);
    return ux;
  } catch (err) {
    logEvent("UIUX", `JSON parse failed. Raw: ${text.slice(0, 100).replace(/\\n/g, ' ')}...`, "", C.red);
    return null;
  }
}

// ── GEMINI IMAGE GENERATION ────────────────────────────────────────────────────
const GEMINI_KEY = process.env.GEMINI_API_KEY || "";

async function generateWithGemini(prompt, width, height) {
  if (!GEMINI_KEY) return null;
  const aspectRatio = width >= 1400 ? "16:9" : width >= 800 ? "4:3" : "1:1";
  try {
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${GEMINI_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instances: [{ prompt }],
          parameters: { sampleCount: 1, aspectRatio },
        }),
        signal: AbortSignal.timeout(25000),
      }
    );
    if (!resp.ok) return null;
    const data = await resp.json();
    const b64 = data.predictions?.[0]?.bytesBase64Encoded;
    return b64 ?? null;
  } catch {
    return null;
  }
}

async function downloadFromPollinations(prompt, width, height) {
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&nologo=true&model=turbo`;
  try {
    const resp = await fetch(url, { signal: AbortSignal.timeout(30000) });
    if (!resp.ok) return null;
    const buf = await resp.arrayBuffer();
    return { buffer: Buffer.from(buf), url };
  } catch {
    return null;
  }
}

// Pre-generates all site images server-side BEFORE launching the browser.
// Tries: Gemini Imagen → Pollinations download → Pollinations URL fallback
// Returns a map: { hero, "card-0", "card-1", "card-2", cta } → public path or URL
async function prefetchImages(heroPrompt, cardPrompts, ctaPrompt, publicDir) {
  const imgDir = path.join(publicDir, "images");
  mkdirSync(imgDir, { recursive: true });

  const zones = [
    { name: "hero", prompt: heroPrompt, w: 1600, h: 900 },
    { name: "card-0", prompt: cardPrompts[0] ?? "", w: 400, h: 300 },
    { name: "card-1", prompt: cardPrompts[1] ?? "", w: 400, h: 300 },
    { name: "card-2", prompt: cardPrompts[2] ?? "", w: 400, h: 300 },
    { name: "cta", prompt: ctaPrompt, w: 1200, h: 400 },
  ];

  const results = {};

  for (const zone of zones) {
    if (!zone.prompt) { results[zone.name] = null; continue; }
    const filePath = path.join(imgDir, `${zone.name}.jpg`);
    const publicPath = `/images/${zone.name}.jpg`;
    const polUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(zone.prompt)}?width=${zone.w}&height=${zone.h}&nologo=true&model=turbo`;

    // ── Try Gemini first ──
    logEvent("IMAGE-GEN", `Gemini  ⟶  ${zone.name}: "${zone.prompt.slice(0, 60)}"`, "", C.magenta);
    const b64 = await generateWithGemini(zone.prompt, zone.w, zone.h);
    if (b64) {
      writeFileSync(filePath, Buffer.from(b64, "base64"));
      logEvent("IMAGE-GEN", `✅ Gemini saved  →  ${publicPath}`, "", C.magenta);
      results[zone.name] = publicPath;
      continue;
    }

    // ── Fallback: download from Pollinations ──
    logEvent("IMAGE-GEN", `Pollinations  ⟶  ${zone.name} (Gemini unavailable)`, "", C.magenta);
    const polResult = await downloadFromPollinations(zone.prompt, zone.w, zone.h);
    if (polResult) {
      writeFileSync(filePath, polResult.buffer);
      logEvent("IMAGE-GEN", `✅ Pollinations saved  →  ${publicPath}`, "", C.magenta);
      results[zone.name] = publicPath;
      continue;
    }

    // ── Last resort: use Pollinations URL directly (no download) ──
    logEvent("IMAGE-GEN", `⚠️  Using URL directly for ${zone.name}`, "", C.red);
    results[zone.name] = polUrl;
  }

  return results;
}

// ── IMAGE-GEN AGENT — crafts Puter.js txt2img prompts based on architect brief ──
// Writes puter-image-config.js to public/, and creates PuterImageLoader.tsx.
// Returns { heroPrompt, cardPrompts[], ctaPrompt }
async function runImageGenAgent(research, resources, ux, userPrompt) {
  logHandoff("UIUX", "IMAGE-GEN", "crafting Puter.js AI image prompts from architect brief");
  emitRoleBanner("IMAGE-GEN");

  const aesthetic = research.aesthetic ?? "cinematic, dramatic";
  const siteType = research.siteType ?? "website";
  const theme = resources.imageTheme ?? userPrompt;
  const brand = ux?.brand ?? userPrompt;
  const headline = ux?.heroHeadline ?? "";
  const cards = ux?.cards ?? [];

  const SYSTEM = loadAgentSystem("image-gen-agent");

  const brief = `Brand: ${brand} | Type: ${siteType} | Aesthetic: ${aesthetic} | Theme: ${theme} | Cards: ${cards.map(c => c.title).join(', ')}`;

  let prompts;
  try {
    const raw = await callGroq(SYSTEM, brief, 600, 0.65);
    // Robust extraction: try JSON.parse first, then regex fallback
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // Try to extract values even from malformed JSON using regex
      const heroM = raw.match(/"heroPrompt"\s*:\s*"([^"]{5,200})"/);
      const ctaM = raw.match(/"ctaPrompt"\s*:\s*"([^"]{5,200})"/);
      const cardsM = [...raw.matchAll(/"([^"]{5,150})"/g)]
        .map(m => m[1])
        .filter(s => s !== 'heroPrompt' && s !== 'ctaPrompt' && s !== 'cardPrompts' && s.length > 10)
        .slice(0, 3);
      if (heroM) {
        parsed = { heroPrompt: heroM[1], cardPrompts: cardsM, ctaPrompt: ctaM?.[1] ?? cardsM[0] ?? '' };
      } else {
        throw new Error('regex extraction also failed');
      }
    }
    prompts = parsed;
    logEvent("IMAGE-GEN", `Hero: "${String(prompts.heroPrompt).slice(0, 70)}…"`, "", C.magenta);
    logEvent("IMAGE-GEN", `Cards: ${(prompts.cardPrompts ?? []).length} prompts generated`, "", C.magenta);
    logEvent("IMAGE-GEN", `CTA:   "${String(prompts.ctaPrompt).slice(0, 70)}…"`, "", C.magenta);
  } catch (e) {
    logEvent("IMAGE-GEN", `Prompt generation failed (${e.message}) — using theme fallback`, "", C.red);
    const base = theme.replace(/[^a-zA-Z0-9 ,\-]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
    prompts = {
      heroPrompt: `${base} - cinematic hero wide shot - dramatic lighting - ultra detailed`,
      cardPrompts: [`${base} - scene one - photorealistic`, `${base} - scene two - cinematic`, `${base} - scene three - artistic`],
      ctaPrompt: `${base} - wide panoramic banner - dramatic sky - cinematic color grade`,
    };
  }

  return {
    heroPrompt: prompts.heroPrompt ?? "",
    cardPrompts: prompts.cardPrompts ?? [],
    ctaPrompt: prompts.ctaPrompt ?? "",
  };
}

// ── Website builder: RESEARCH → RESOURCER → UIUX → IMAGE-GEN → SNR-DEV → PREVIEW ─────
async function buildWebsiteDirect(prompt) {
  if (!KEY_POOL.length) throw new Error("No Groq API keys configured");
  const startMs = Date.now();

  // ── Pre-build reset: wipe component residue from previous agent edits ─────
  // Restore all component files to the clean baseline captured at server startup.
  // This prevents styles/content from a prior website leaking into the new build.
  let restoredCount = 0;
  for (const [fname, content] of Object.entries(COMPONENT_SNAPSHOTS)) {
    const fp = path.join(_COMP_DIR, fname);
    writeFileSync(fp, content, "utf-8");
    restoredCount++;
  }
  if (restoredCount > 0)
    process.stderr.write(`[prebuild] Restored ${restoredCount} component baselines — clean slate\n`);

  logHandoff("ORCHESTRATOR", "ARCHITECT", "beginning site build pipeline");
  emitRoleBanner("ARCHITECT");
  logEvent("ARCHITECT", `Planning: "${prompt.slice(0, 60)}"`, "", C.yellow);

  const siteContentPath = path.join(GENERATED_SITE, "src", "app", "site-content.ts");
  const cssPath = path.join(GENERATED_SITE, "src", "app", "globals.css");
  const variantsPath = path.join(GENERATED_SITE, "src", "app", "design-variants.json");
  const variantsTsPath = path.join(GENERATED_SITE, "src", "app", "design-variants.ts");

  // ── Stage 1: RESEARCH ─────────────────────────────────────────────────────
  const research = await runResearchAgent(prompt);
  const v = research.variants ?? { navbar: 0, hero: 0, cards: 0, features: 0, cta: 0, footer: 0 };

  // ── Stage 2: RESOURCER ────────────────────────────────────────────────────
  const resources = await runResourcerAgent(research, prompt);
  const imgTheme = (resources.imageTheme ?? prompt.toLowerCase()).replace(/\s+/g, "+");
  const heroSeed = resources.heroSeed ?? 73421;
  const [cs1, cs2, cs3] = resources.cardSeeds ?? [11111, 22222, 33333];
  const ctaSeed = resources.ctaSeed ?? 55555;

  // ── Stage 3: UIUX ─────────────────────────────────────────────────────────
  const ux = await runUIUXAgent(research, resources, prompt);

  // ── Stage 3.5: IMAGE-GEN — prompt engineering ────────────────────────────
  const imageGenResult = await runImageGenAgent(research, resources, ux, prompt);
  const { heroPrompt, cardPrompts, ctaPrompt } = imageGenResult;

  // Write puter-image-config.js (kept for client-side fallback reference)
  const publicDir = path.join(GENERATED_SITE, "public");
  mkdirSync(publicDir, { recursive: true });
  const puterConfigPath = path.join(publicDir, "puter-image-config.js");
  const puterConfigContent = `// Auto-generated by IMAGE-GEN agent — do not edit\nwindow.__puterImageConfig = ${JSON.stringify({
    hero: heroPrompt,
    cards: cardPrompts,
    cta: ctaPrompt,
  }, null, 2)};\n`;
  writeFileSync(puterConfigPath, puterConfigContent, "utf-8");
  logEvent("IMAGE-GEN", `puter-image-config.js written`, "", C.magenta);

  // ── Stage 3.6: Pre-fetch all images server-side (Gemini → Pollinations) ──
  logHandoff("IMAGE-GEN", "IMAGE-GEN", "pre-fetching images server-side before launch");
  logEvent("IMAGE-GEN", "Pre-generating images: Gemini → Pollinations → URL fallback", "", C.magenta);
  const imgPaths = await prefetchImages(heroPrompt, cardPrompts, ctaPrompt, publicDir);
  logEvent("IMAGE-GEN", `Images ready: ${Object.values(imgPaths).filter(Boolean).length}/5 zones`, "", C.magenta);

  // Write PuterImageLoader.tsx to the components directory
  const puterLoaderPath = path.join(GENERATED_SITE, "src", "components", "PuterImageLoader.tsx");
  const puterLoaderContent = `'use client';
import { useEffect, useState } from 'react';

type PuterConfig = {
  hero:  string;
  cards: string[];
  cta:   string;
};

const BASE = 'https://image.pollinations.ai/prompt/';

function pollinationsUrl(prompt: string, width: number, height: number): string {
  return \`\${BASE}\${encodeURIComponent(prompt)}?width=\${width}&height=\${height}&nologo=true&model=turbo\`;
}

const LOG_LIMIT = 20;

export default function PuterImageLoader() {
  const [logs, setLogs]       = useState<string[]>(['[IMAGE-GEN] 🎨 Loading images via Pollinations.ai…']);
  const [done, setDone]       = useState(false);
  const [visible, setVisible] = useState(true);

  const addLog = (msg: string) =>
    setLogs(prev => [...prev.slice(-(LOG_LIMIT - 1)), msg]);

  useEffect(() => {
    const cfgScript = document.createElement('script');
    cfgScript.src = '/puter-image-config.js';
    cfgScript.onload = () => applyImages();
    cfgScript.onerror = () => addLog('[IMAGE-GEN] ❌ Config load failed — check public/puter-image-config.js');
    document.head.appendChild(cfgScript);
    return () => { document.head.removeChild(cfgScript); };
  }, []);

  function applyImages() {
    const cfg = (window as any).__puterImageConfig as PuterConfig | undefined;
    if (!cfg) {
      addLog('[IMAGE-GEN] ❌ Config not available');
      return;
    }

    // ── Hero ────────────────────────────────────────────────────────────────────
    const heroEl = document.querySelector<HTMLImageElement>('img[data-puter-zone="hero"]');
    if (heroEl && cfg.hero) {
      // Skip if already loaded from a local path (server pre-generated)
      if (heroEl.src.includes('/images/')) { addLog('[IMAGE-GEN] ✅ Hero already pre-loaded'); }
      else {
        const url = pollinationsUrl(cfg.hero, 1600, 900);
        if (heroEl.src !== url) heroEl.src = url;
        addLog(\`[IMAGE-GEN] ✅ Hero  →  "\${cfg.hero}"\`);
      }
    }

    // ── Cards ───────────────────────────────────────────────────────────────────
    const cardEls = document.querySelectorAll<HTMLImageElement>('img[data-puter-zone^="card"]');
    Array.from(cardEls).forEach((el, i) => {
      const prompt = cfg.cards[i] ?? cfg.cards[0];
      if (!prompt) return;
      el.src = pollinationsUrl(prompt, 400, 300);
      addLog(\`[IMAGE-GEN] ✅ Card \${i + 1}  →  "\${prompt}"\`);
    });

    // ── CTA ─────────────────────────────────────────────────────────────────────
    const ctaEl = document.querySelector<HTMLImageElement>('img[data-puter-zone="cta"]');
    if (ctaEl && cfg.cta) {
      ctaEl.src = pollinationsUrl(cfg.cta, 1200, 400);
      addLog(\`[IMAGE-GEN] ✅ CTA  →  "\${cfg.cta}"\`);
    }

    addLog('[IMAGE-GEN] 🏁 All images live via Pollinations.ai');
    setDone(true);
    setTimeout(() => setVisible(false), 5000);
  }

  if (!visible) return null;

  return (
    <div
      data-puter-log
      style={{
        position:       'fixed',
        bottom:         '1.5rem',
        left:           '1.5rem',
        zIndex:         9997,
        fontFamily:     'ui-monospace, monospace',
        fontSize:       '0.68rem',
        lineHeight:     1.55,
        maxWidth:       '28rem',
        maxHeight:      '14rem',
        overflowY:      'auto',
        background:     'rgba(3,3,14,0.92)',
        border:         '1px solid rgba(167,139,250,0.35)',
        borderRadius:   '0.6rem',
        backdropFilter: 'blur(18px)',
        padding:        '0.65rem 0.8rem',
        color:          '#c4b5fd',
        boxShadow:      '0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(167,139,250,0.08)',
        transition:     'opacity 0.4s ease',
        opacity:        done ? 0.5 : 1,
      }}
    >
      <div style={{ fontWeight: 700, color: '#a78bfa', marginBottom: '0.35rem', letterSpacing: '0.04em' }}>
        🖼 IMAGE-GEN · Pollinations.ai
      </div>
      {logs.map((l, i) => (
        <div key={i} style={{ opacity: i === logs.length - 1 ? 1 : 0.65 }}>{l}</div>
      ))}
      {done && (
        <button
          onClick={() => setVisible(false)}
          style={{ marginTop: '0.4rem', background: 'none', border: 'none', color: '#7c3aed', cursor: 'pointer', fontSize: '0.65rem' }}
        >
          ✕ dismiss
        </button>
      )}
    </div>
  );
}
`;
  writeFileSync(puterLoaderPath, puterLoaderContent, "utf-8");
  logEvent("IMAGE-GEN", `PuterImageLoader.tsx → components/`, "", C.magenta);

  // ── Stage 4: SNR-DEV assembles site-content.ts ───────────────────────────
  logHandoff("UIUX", "SNR-DEV", "assembling site-content.ts from research");
  emitRoleBanner("SNR-DEV");

  // Build SITE object from UIUX output (or fall back to Groq-generated content)
  let siteContent;
  if (ux) {
    const navLinks = (ux.navLinks ?? [{ label: "Home", href: "/" }, { label: "About", href: "/about" }, { label: "Contact", href: "/contact" }])
      .map(l => `{label:"${l.label}",href:"${l.href}"}`)
      .join(", ");
    const cards = (ux.cards ?? []).map((c, i) =>
      `{title:"${c.title}",desc:"${c.desc}",imageUrl:"${imgPaths[`card-${i}`] ?? `https://image.pollinations.ai/prompt/${encodeURIComponent(cardPrompts[i] ?? '')}?width=400&height=300&nologo=true&model=turbo`}",pzCard:${i}}`
    ).join(",\n    ");
    const features = (ux.features ?? []).map(f =>
      `{icon:"${f.icon}",title:"${f.title}",desc:"${f.desc}"}`
    ).join(",\n      ");
    const footerLinks = (ux.footerLinks ?? [{ label: "About", href: "/about" }, { label: "Contact", href: "/contact" }])
      .map(l => `{label:"${l.label}",href:"${l.href}"}`)
      .join(", ");

    siteContent = `export const SITE = {
  navbar: { brand: "${ux.brand ?? "My Site"}", links: [${navLinks}] },
  hero: {
    headline: "${ux.heroHeadline ?? "Welcome"}",
    subtext: "${ux.heroSubtext ?? ""}",
    cta1: "${ux.heroCTA1 ?? "Get Started"}",
    cta2: "${ux.heroCTA2 ?? "Learn More"}",
    imageUrl: "${imgPaths['hero'] ?? `https://image.pollinations.ai/prompt/${encodeURIComponent(heroPrompt)}?width=1600&height=900&nologo=true&model=turbo`}",
  },
  cards: [
    ${cards}
  ],
  features: {
    sectionTitle: "${ux.featureSectionTitle ?? "Features"}",
    items: [
      ${features}
    ],
  },
  cta: {
    headline: "${ux.ctaHeadline ?? "Get Started"}",
    body: "${ux.ctaBody ?? ""}",
    button: "${ux.ctaButton ?? "Start Now"}",
    imageUrl: "${imgPaths['cta'] ?? `https://image.pollinations.ai/prompt/${encodeURIComponent(ctaPrompt)}?width=1200&height=400&nologo=true&model=turbo`}",
  },
  footer: {
    brand: "${ux.brand ?? "My Site"}",
    tagline: "${ux.tagline ?? ""}",
    links: [${footerLinks}],
  },
  // Layout variant indices — set by UIUX agent based on site type
  // navbar: 0=Classic 1=Centered 2=Animated 3=GlassCTA 4=Minimal
  // hero:   0=Cinematic 1=Split 2=BoldType 3=Magazine 4=Asymmetric
  // cards:  0=Grid 1=Carousel 2=Featured 3=Masonry 4=List
  // features: 0=IconGrid 1=Numbered 2=Alternating 3=Timeline 4=StatCards
  // cta:    0=Fullbleed 1=Split 2=Minimal 3=GlassCard 4=HorizBar
  // footer: 0=TwoCol 1=Centered 2=Minimal 3=BigBrand 4=DarkCard
  variants: {
    navbar:   ${v.navbar ?? 0},
    hero:     ${v.hero ?? 0},
    cards:    ${v.cards ?? 0},
    features: ${v.features ?? 0},
    cta:      ${v.cta ?? 0},
    footer:   ${v.footer ?? 0},
  },
};`;
  } else {
    // UIUX failed — fall back to a single Groq call for content
    logEvent("SNR-DEV", "UIUX failed — generating content directly", "", C.red);
    const fallbackText = await callGroq(
      `Output ONLY valid TypeScript (no markdown). Generate: export const SITE = { navbar:{brand:"...",links:[{label:"...",href:"/..."}]}, hero:{headline:"...",subtext:"...",cta1:"...",cta2:"...",imageUrl:"https://image.pollinations.ai/prompt/${imgTheme}+cinematic?width=1600&height=900&nologo=true&model=turbo&seed=${heroSeed}"}, cards:[{title:"...",desc:"...",imageUrl:"https://image.pollinations.ai/prompt/${imgTheme}+card?width=400&height=300&nologo=true&model=turbo&seed=${cs1}"},{title:"...",desc:"...",imageUrl:"https://image.pollinations.ai/prompt/${imgTheme}+card2?width=400&height=300&nologo=true&model=turbo&seed=${cs2}"},{title:"...",desc:"...",imageUrl:"https://image.pollinations.ai/prompt/${imgTheme}+card3?width=400&height=300&nologo=true&model=turbo&seed=${cs3}"}], features:{sectionTitle:"...",items:[{icon:"emoji",title:"...",desc:"..."},{icon:"emoji",title:"...",desc:"..."},{icon:"emoji",title:"...",desc:"..."},{icon:"emoji",title:"...",desc:"..."}]}, cta:{headline:"...",body:"...",button:"...",imageUrl:"https://image.pollinations.ai/prompt/${imgTheme}+wide?width=1200&height=400&nologo=true&model=turbo&seed=${ctaSeed}"}, footer:{brand:"...",tagline:"...",links:[{label:"About",href:"/about"},{label:"Contact",href:"/contact"}]}, variants:{navbar:${v.navbar ?? 0},hero:${v.hero ?? 0},cards:${v.cards ?? 0},features:${v.features ?? 0},cta:${v.cta ?? 0},footer:${v.footer ?? 0}}, };`,
      `Theme: ${prompt}`,
      2000, 0.7
    );
    siteContent = fallbackText;
  }

  writeFileSync(siteContentPath, siteContent, "utf-8");
  logEvent("SNR-DEV", `site-content.ts written (variants: nb=${v.navbar} hero=${v.hero} cards=${v.cards} feat=${v.features} cta=${v.cta} ft=${v.footer})`, "", C.cyan);

  // ── Stage 4b: CSS :root from research palette ─────────────────────────────
  logHandoff("SNR-DEV", "SNR-DEV", "writing globals.css :root");
  const p = research.colorPalette ?? {};
  const primary   = p.primary   ?? "#1a0a00";   // dark warm, not blue
  const secondary = p.secondary ?? "#c9843a";   // warm amber, not blue/purple
  const bg        = p.bg        ?? "#0a0805";
  const text      = p.text      ?? "#f0e8d8";
  const font      = resources.fontDisplay ?? research.fontDisplay ?? "'Inter', sans-serif";

  // Compute contrast text colors so buttons always stay readable regardless of theme
  function luminance(hex) {
    const c = hex.replace(/^#/, "");
    const r = parseInt(c.slice(0,2)||"00", 16);
    const g = parseInt(c.slice(2,4)||"00", 16);
    const b = parseInt(c.slice(4,6)||"00", 16);
    return (0.299*r + 0.587*g + 0.114*b) / 255;
  }
  const onPrimary   = luminance(primary)   > 0.45 ? "#000000" : "#ffffff";
  const onSecondary = luminance(secondary) > 0.45 ? "#000000" : "#ffffff";

  const rootBlock = `:root {\n  --color-primary: ${primary};\n  --color-secondary: ${secondary};\n  --color-bg: ${bg};\n  --color-text: ${text};\n  --color-on-primary: ${onPrimary};\n  --color-on-secondary: ${onSecondary};\n  --font-display: ${font};\n}`;

  // Full globals.css reset — replace :root in the canonical template.
  // This eliminates CSS residue (component-specific rules, old color overrides)
  // that accumulate when agents append to globals.css for feature requests.
  const newCss = FULL_GLOBALS_CSS_TEMPLATE.replace(
    /:root\s*\{[^}]+\}/s,
    rootBlock
  );
  writeFileSync(cssPath, newCss, "utf-8");
  logEvent("SNR-DEV", `globals.css — primary:${primary} secondary:${secondary}`, "", C.cyan);

  // ── Stage 5: ARCHITECT generates 5 color variants for Template Library ────
  logHandoff("SNR-DEV", "ARCHITECT", "generate 5 color variants for template library");
  logEvent("ARCHITECT", "Generating 5 color themes…", "", C.yellow);
  try {
    const rawVars = await callGroq(
      `Output ONLY a valid JSON array of exactly 5 objects. No markdown.
Each: {"id":N,"name":"Two Word","palette":{"primary":"#hex","secondary":"#hex","bg":"#hex","text":"#hex"},"fontDisplay":"'FontName',sans-serif","animationStyle":"flicker|float|glitch|neon-glow|fade-in-up","spacingScale":"compact|normal|airy","shadowStyle":"neon|soft|flat","previewGradient":"linear-gradient(135deg,#hex 0%,#hex 100%)"}
ids 0-4. All 5 visually distinct (dark, light, neon, muted, vibrant). Themed to subject.`,
      `5 color themes for: ${prompt}`,
      2400, 0.95
    );
    const variantsData = JSON.parse(rawVars);
    writeFileSync(variantsPath, JSON.stringify(variantsData, null, 2), "utf-8");
    writeFileSync(variantsTsPath,
      `// Auto-generated by architect. Do not edit.\nexport type DesignVariant={id:number;name:string;palette:{primary:string;secondary:string;bg:string;text:string};fontDisplay:string;animationStyle:string;spacingScale:string;shadowStyle:string;previewGradient:string;};\nexport const DESIGN_VARIANTS:DesignVariant[]=${JSON.stringify(variantsData)};\n`,
      "utf-8"
    );
    logEvent("ARCHITECT", `${variantsData.length} color themes ready in template library`, "", C.yellow);
  } catch (e) {
    logEvent("ARCHITECT", `Color variants failed: ${e.message}`, "", C.red);
  }

  logHandoff("ARCHITECT", "PREVIEW", "launch");
  const elapsed = ((Date.now() - startMs) / 1000).toFixed(1);
  process.stderr.write(`${C.dim}[pipeline ${elapsed}s]${C.reset}\n`);

  const launchTool = TOOLS.find(t => t.name === "launch_frontend");
  if (launchTool) {
    emitRoleBanner("PREVIEW");
    await launchTool.handler({ url: "http://localhost:3000" });
    logEvent("PREVIEW", "Launched at http://localhost:3000", "", C.green);
  }
}

async function runAgent(prompt) {
  const intent = classifyIntent(prompt);
  const startMs = Date.now();

  // ── Step 1: Orchestrator classifies intent ─────────────────────────────────
  logEvent("ORCHESTRATOR", `Intent classified: "${intent}" — routing…`, "", C.white);

  // ── Website intent: bypass tool-calling, call Groq directly ───────────────
  if (intent === "website") {
    logHandoff("ORCHESTRATOR", "ARCHITECT", "website generation pipeline");
    try {
      await buildWebsiteDirect(prompt);
    } catch (e) {
      process.stderr.write(`${C.red}[💥 ERROR]${C.reset} Website build failed: ${e.message}\n`);
    }
    return;
  }

  // ── Visual editor — direct launch, no sub-agent dispatch needed ────────────
  if (intent === "visual") {
    logHandoff("ORCHESTRATOR", "CANVAS", "spatial editor launch");
    emitRoleBanner("CANVAS");
    const launchTool = TOOLS.find(t => t.name === "launch_frontend");
    if (launchTool) await launchTool.handler({ url: "http://localhost:3001" });
    return;
  }

  // ── Step 2: CODE-EDITOR tier routing ──────────────────────────────────────
  logHandoff("ORCHESTRATOR", "CODE-EDITOR", `intent=${intent}`);
  emitRoleBanner("CODE-EDITOR");

  const tier = classifyTier(intent, prompt);

  // Determine the active sub-agent role and load its soul
  let subRole;
  let agentSoul = '';
  const ceDir = path.join(AGENTS_DIR_ROOT, "code-editor");

  if (tier === 'architect') {
    subRole = "ARCHITECT";
    agentSoul = loadAgentContext(path.join(ceDir, "agents", "architect"));
    logEvent("CODE-EDITOR", `Tier=arch — dispatching to ARCHITECT`, "", C.yellow);
    logHandoff("CODE-EDITOR", "ARCHITECT", "system-level scope");
  } else if (tier === 'uiux') {
    subRole = "UIUX";
    agentSoul = loadAgentContext(path.join(ceDir, "agents", "uiux-designer"));
    logEvent("CODE-EDITOR", `Tier=ui — dispatching to UIUX-DESIGNER`, "", C.yellow);
    logHandoff("CODE-EDITOR", "UIUX", "UI/UX layer");
  } else if (tier === 'jnr') {
    subRole = "JNR-DEV";
    agentSoul = loadAgentContext(path.join(ceDir, "agents", "jnr-developer"));
    logEvent("CODE-EDITOR", `Tier=jnr — dispatching to JNR-DEV (single-file fix)`, "", C.yellow);
    logHandoff("CODE-EDITOR", "JNR-DEV", "single-file scope");
  } else {
    subRole = "SNR-DEV";
    agentSoul = loadAgentContext(path.join(ceDir, "agents", "snr-developer"));
    logEvent("CODE-EDITOR", `Tier=snr — dispatching to SNR-DEV (multi-file)`, "", C.yellow);
    logHandoff("CODE-EDITOR", "SNR-DEV", `${intent} scope`);
  }

  emitRoleBanner(subRole);

  // ── Step 3: Tool set for this tier ────────────────────────────────────────
  const TOOL_MAP = Object.fromEntries(TOOLS.map(t => [t.name, t]));
  const pick = (...names) => names.map(n => TOOL_MAP[n]).filter(Boolean);

  // qa_site added to fix/feature so site-tester can run post-write validation
  const tierTools = {
    architect: pick("file_read", "file_write", "search", "shell_exec", "qa_site", "launch_frontend", "append_memory"),
    uiux: pick("file_read", "file_write", "search", "qa_site", "launch_frontend", "append_memory"),
    snr: pick("file_read", "file_write", "search", "qa_site", "append_memory"),
    jnr: pick("file_read", "file_write", "append_memory"),
  };
  const activeTools = tierTools[tier] ?? tierTools.snr;

  // ── Step 4: Build sub-agent system prompt (base + loaded soul) ────────────
  const agentSystemPrompt = agentSoul
    ? `${SYSTEM_PROMPT}\n\n== ACTIVE SUB-AGENT CONTEXT (read and follow this identity) ==\n${agentSoul}`
    : SYSTEM_PROMPT;

  // llama-3.3-70b is more reliable for tool-calling than llama-4-scout
  const editModel = "groq:llama-3.3-70b-versatile";

  // ── Step 5: Run the sub-agent query ──────────────────────────────────────
  // Inject active pool key for gitclaw's query()
  const _agentKey = await getKey();
  process.env.GROQ_API_KEY = _agentKey.key;
  logEvent("KEYPOOL", `agent query() using ${_agentKey.label}`, "🔑", C.dim);

  let lastToolName = null;
  let snrSplitLogged = false;

  for await (const msg of query({
    prompt,
    dir: __dirname,
    model: editModel,
    tools: activeTools,
    replaceBuiltinTools: true,
    systemPrompt: agentSystemPrompt,
    maxTurns: 20,
    constraints: { maxTokens: 4096 },
  })) {
    switch (msg.type) {

      case "delta":
        process.stdout.write(msg.content);
        // Detect structured plan blocks emitted by agent personas
        if (msg.content.includes("[ARCHITECT PLAN]")) {
          process.stderr.write(
            `\n${C.yellow}${C.bold}[ARCHITECT   ]${C.reset} ${C.yellow}Plan received — beginning build pipeline…${C.reset}\n`
          );
        }
        if (msg.content.includes("[SNR SPLIT]") && !snrSplitLogged) {
          snrSplitLogged = true;
          process.stderr.write(
            `\n${C.cyan}${C.bold}[SNR-DEV     ]${C.reset} ${C.cyan}Work split confirmed — writing files…${C.reset}\n`
          );
        }
        break;

      case "assistant": {
        process.stdout.write("\n");
        const elapsed = ((Date.now() - startMs) / 1000).toFixed(1);
        const tokens = msg.usage?.totalTokens ?? "?";
        process.stderr.write(`${C.dim}[  ${elapsed}s | tokens: ${tokens} / 4096]${C.reset}\n`);
        break;
      }

      case "tool_use": {
        lastToolName = msg.toolName;
        const argsPreview = JSON.stringify(msg.args ?? {}).slice(0, 100);
        const roleColor = ROLE_CONFIG[subRole]?.color ?? C.cyan;

        if (msg.toolName === "append_memory") {
          logEvent("MEMORY", `Learning: ${msg.args?.category ?? ""} — ${String(msg.args?.rule ?? "").slice(0, 80)}`, "", C.yellow);

        } else if (msg.toolName === "qa_site") {
          // site-tester sub-agent takes over for QA
          logHandoff(subRole, "QA", "post-write validation");
          emitRoleBanner("QA");
          logEvent("QA", `Validating ${msg.args?.url ?? "site"}…`, "", C.magenta);

        } else if (msg.toolName === "launch_frontend") {
          const port = (msg.args?.url ?? "").includes("3001") ? 3001 : 3000;
          if (port === 3001) {
            logEvent("EDITOR", `Opening spatial editor at http://localhost:3001`, "", C.magenta);
          } else {
            logEvent("PREVIEW", `Launching preview at http://localhost:3000`, "", C.green);
          }

        } else if (msg.toolName === "file_write") {
          // Guardrails log emitted by the wrapped handler — we just confirm dispatch here
          const filePath = msg.args?.path ?? "";
          logEvent(subRole, `Dispatching write → ${filePath}`, "", roleColor);

        } else if (msg.toolName === "file_read") {
          process.stderr.write(
            `${C.dim}[${new Date().toTimeString().slice(0, 8)}] [${subRole.padEnd(12)}] ← file_read ${path.basename(msg.args?.path ?? "")}${C.reset}\n`
          );

        } else if (msg.toolName === "shell_exec") {
          logEvent("ARCHITECT", `shell_exec → ${String(msg.args?.command ?? "").slice(0, 80)}`, "", C.yellow);

        } else if (msg.toolName === "search") {
          logEvent(subRole, `search → ${String(msg.args?.pattern ?? "").slice(0, 60)}`, "", roleColor);

        } else {
          process.stderr.write(`${C.dim}[→ ${subRole}:${msg.toolName}] ${argsPreview}${C.reset}\n`);
        }
        break;
      }

      case "tool_result": {
        if (lastToolName === "qa_site") {
          try {
            const result = JSON.parse(msg.content ?? "{}");
            const ok = result.status === "ok" || (result.errors ?? []).length === 0;
            const errCount = (result.errors ?? []).length;
            const score = result.visual_score ?? "?";
            logEvent("QA",
              `${ok ? "PASS" : "FAIL"} | score=${score} | errors=${errCount}`,
              "", ok ? C.green : C.red
            );
            if (!ok && result.fix_instruction) {
              // QA hands back to the sub-agent for fixes
              logHandoff("QA", subRole, "fix cycle");
              logEvent(subRole, `Fix instruction → ${String(result.fix_instruction).slice(0, 120)}`, "", ROLE_CONFIG[subRole]?.color ?? C.cyan);
            }
          } catch { /* non-JSON QA result */ }

        } else if (lastToolName === "file_write") {
          const content = msg.content ?? "";
          if (content.startsWith("BLOCKED:")) {
            // Already logged by the guardrails wrapper — just show summary
            logEvent("GUARDRAILS", `Write aborted — ${content.slice(9, 120)}`, "", C.red);
          }
        }
        break;
      }

      case "system":
        if (msg.subtype === "error") {
          process.stderr.write(`${C.red}[💥 ERROR]${C.reset} ${msg.content}\n`);
        }
        break;
    }
  }

  const totalElapsed = ((Date.now() - startMs) / 1000).toFixed(1);
  process.stderr.write(`${C.dim}[✓ ${subRole ?? "ORCHESTRATOR"} done in ${totalElapsed}s]${C.reset}\n`);
}

// ── REPL ────────────────────────────────────────────────────────────────────────

const cliPrompt = process.argv.slice(2).join(" ").trim();

async function repl() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: process.stdin.isTTY,
  });



  const ask = () =>
    new Promise((resolve, reject) => {
      const onClose = () => reject(new Error("closed"));
      rl.once("close", onClose);
      if (process.stdin.isTTY) {
        rl.question("you> ", (answer) => { rl.removeListener("close", onClose); resolve(answer); });
      } else {
        const onLine = (line) => { rl.removeListener("close", onClose); resolve(line); };
        rl.once("line", onLine);
      }
    });

  while (true) {
    let line;
    try { line = await ask(); } catch { break; }
    if (line === null || line === undefined) break;
    const prompt = line.trim();
    if (!prompt) continue;

    if (prompt.toLowerCase() === '/skills') {
      const skillsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "skills");
      if (existsSync(skillsDir)) {
        const skills = readdirSync(skillsDir).filter(f => !f.startsWith('.'));
        console.log(`\n${C.cyan}${C.bold}Available Skills (${skills.length}):${C.reset}`);
        skills.forEach(s => console.log(`  ${C.blue}•${C.reset} ${s}`));
        console.log();
      } else {
        console.log(`\n${C.red}No skills directory found.${C.reset}\n`);
      }
      continue;
    }

    await runAgent(prompt);
  }

  rl.close();
}

if (cliPrompt) {
  runAgent(cliPrompt).catch((e) => { console.error(e.message); process.exit(1); });
} else {
  repl().catch((e) => { console.error(e.message); process.exit(1); });
}
