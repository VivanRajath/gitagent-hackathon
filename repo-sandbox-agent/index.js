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
    `${C.dim}[${ts}]${C.reset} ${color}${C.bold}[${role.padEnd(10)}]${C.reset} ${message}\n`
  );
}

// ── classifyIntent — maps user prompt to an agent tier ────────────────────────
// Returns: "website" | "fix" | "feature" | "arch" | "visual" | "chat"
function classifyIntent(prompt) {
  const p = prompt.toLowerCase();
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

// ── Restore golden component templates if missing ──────────────────────────────
// Components are permanent scaffolds. If deleted by accident, restore them here.
import { writeFileSync, mkdirSync } from "fs";
function restoreComponents() {
  const site = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "generated-site", "src");
  const comps = path.join(site, "components");
  mkdirSync(comps, { recursive: true });

  const FULL_GLOBALS_CSS_TEMPLATE = `@import "tailwindcss";

:root {
  --color-primary: #4a1942;
  --color-secondary: #c9a84c;
  --color-bg: #0d0d0d;
  --color-text: #e8d5b7;
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
  0%{text-shadow:2px 0 #f00,-2px 0 #0ff} 20%{text-shadow:-3px 0 #f00,3px 0 #0ff}
  40%{text-shadow:2px 0 transparent} 60%{text-shadow:-3px 0 #f00,3px 0 #0ff}
  80%{text-shadow:2px 0 #f00,-2px 0 #0ff} 100%{text-shadow:none}
}

@keyframes fadeInUp {
  from{opacity:0;transform:translateY(28px)}
  to{opacity:1;transform:translateY(0)}
}

@keyframes neonGlow {
  0%,100%{text-shadow:0 0 5px currentColor,0 0 10px currentColor,0 0 20px currentColor}
  50%{text-shadow:0 0 10px currentColor,0 0 25px currentColor,0 0 50px currentColor}
}

@keyframes accentPulse {
  0%,100%{box-shadow:0 0 0 0 color-mix(in srgb,var(--color-secondary) 50%,transparent)}
  70%{box-shadow:0 0 0 14px transparent}
}

@keyframes redPulse {
  0%,100%{box-shadow:0 0 0 0 rgba(204,0,0,0.5)} 70%{box-shadow:0 0 0 16px rgba(204,0,0,0)}
}

/* ── Reduced motion ─────────────────────────────────────────────────────────── */
@media (prefers-reduced-motion: reduce) {
  .flicker,.float,.glitch,.fade-in-up,.fade-in-up-delay-1,
  .fade-in-up-delay-2,.fade-in-up-delay-3,.red-pulse,.neon-glow,.accent-pulse {
    animation: none !important; opacity: 1 !important; transform: none !important;
  }
}
`;

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
            background:'var(--color-secondary)',color:'#000',
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
        <button className="float accent-pulse" style={{display:'inline-flex',alignItems:'center',gap:'0.5rem',padding:'1.1rem 2.8rem',borderRadius:'9999px',fontWeight:800,fontSize:'1.15rem',background:'var(--color-secondary)',color:'#000',border:'none',cursor:'pointer',fontFamily:'var(--font-display)'}}>
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

  for (const [name, content] of Object.entries(templates)) {
    const filePath = path.join(comps, name);
    if (!existsSync(filePath)) {
      writeFileSync(filePath, content, "utf-8");
      process.stderr.write(`[restore] Wrote missing ${name}\n`);
    }
  }

  // Restore layout.tsx — always keep this exact structure, never let agent overwrite
  const layoutFile = path.join(site, "app", "layout.tsx");
  const layoutContent = readFileSync(layoutFile, "utf-8").trim();
  if (!layoutContent.includes("SpatialVoiceOverlay")) {
    writeFileSync(layoutFile, `import type { Metadata } from 'next';
import './globals.css';
import SpatialVoiceOverlay from '../components/SpatialVoiceOverlay';

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
      </body>
    </html>
  );
}`, "utf-8");
    process.stderr.write("[restore] Rebuilt broken layout.tsx with Spatial Overlay\n");
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

  // Restore site-content.ts if missing
  const contentFile = path.join(site, "app", "site-content.ts");
  if (!existsSync(contentFile)) {
    writeFileSync(contentFile, `export const SITE = {
  navbar: { brand: "My Site", links: [{label:"Home",href:"/"}] },
  hero: { headline:"Welcome", subtext:"A great place to start.", cta1:"Get Started", cta2:"Learn More", imageUrl:"https://image.pollinations.ai/prompt/abstract+cinematic+dark?width=1600&height=900&nologo=true" },
  cards: [{title:"Feature One",desc:"An amazing feature.",imageUrl:"https://image.pollinations.ai/prompt/cinematic+portrait?width=400&height=300&nologo=true"},{title:"Feature Two",desc:"Another great aspect.",imageUrl:"https://image.pollinations.ai/prompt/cinematic+landscape?width=400&height=300&nologo=true"}],
  features: { sectionTitle:"Why This Stands Out", items:[{icon:"⭐",title:"Quality",desc:"Built with care."},{icon:"🚀",title:"Speed",desc:"Fast and smooth."},{icon:"🎨",title:"Design",desc:"Beautiful visuals."},{icon:"🔒",title:"Reliable",desc:"Always dependable."}] },
  cta: { headline:"Ready to Begin?", body:"Take the next step.", button:"Start Now", imageUrl:"https://image.pollinations.ai/prompt/cinematic+epic+wide?width=1200&height=400&nologo=true" },
  footer: { brand:"My Site", tagline:"© 2025 All rights reserved.", links:[{label:"About",href:"/about"},{label:"Contact",href:"/contact"}] },
};`, "utf-8");
    process.stderr.write("[restore] Wrote missing site-content.ts\n");
  }
}
restoreComponents();


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

const GENERATED_SITE = path.resolve(__dirname, "..", "generated-site");

const SYSTEM_PROMPT = `You are repo-sandbox-agent. You theme websites by writing ONE data file. Component files are locked — never touch them.

FILES YOU ARE ALLOWED TO EDIT:
  content : ${GENERATED_SITE}/src/app/site-content.ts   ← THE ONLY file you write for theming
  css     : ${GENERATED_SITE}/src/app/globals.css        ← only the :root { } block

FILES YOU MUST NEVER TOUCH (auto-restored on startup — any change is overwritten anyway):
  ${GENERATED_SITE}/src/app/layout.tsx        ← LOCKED
  ${GENERATED_SITE}/src/app/page.tsx          ← LOCKED
  ${GENERATED_SITE}/src/components/*.tsx      ← ALL LOCKED

== THEMING A WEBSITE ("create/make/theme a website for X") ==
Do NOT call fetch_images. Construct Pollinations URLs yourself as plain strings.
URL pattern: https://image.pollinations.ai/prompt/[theme+keywords+cinematic]?width=W&height=H&nologo=true&seed=NNNNN
Always add &seed= with a random 5-digit number — this caches the image so it loads instantly on repeat visits.
Example: https://image.pollinations.ai/prompt/spongebob+underwater+city+cinematic?width=1600&height=900&nologo=true&seed=73421

STEP 1 — write the data file ${GENERATED_SITE}/src/app/site-content.ts
  Write the full SITE object immediately — no preamble, no explanation, just use the writing tool:
  export const SITE = {
    navbar: { brand: "...", links: [{label:"...",href:"/..."},...] },
    hero: { headline:"...", subtext:"...", cta1:"...", cta2:"...", imageUrl:"https://image.pollinations.ai/prompt/..." },
    cards: [{title:"...",desc:"...",imageUrl:"https://..."},{title:"...",desc:"...",imageUrl:"https://..."}],
    features: { sectionTitle:"...", items:[{icon:"emoji",title:"...",desc:"..."},...] },
    cta: { headline:"...", body:"...", button:"...", imageUrl:"https://..." },
    footer: { brand:"...", tagline:"...", links:[{label:"...",href:"/..."},...] },
  };
  Rules: themed content matching the request · no imports · no JSX · plain strings only

STEP 2 — file_read globals.css → replace ONLY the :root { } block → file_write the full file unchanged except :root.
  Variable names are EXACTLY: --color-primary  --color-secondary  --color-bg  --color-text  --font-display
  NEVER use --primary, --secondary, --bg, --text — components only read --color-* names.
  Themes:
    Harry Potter    → --color-primary:#4a1942; --color-secondary:#c9a84c; --color-bg:#0d0d0d; --color-text:#e8d5b7; --font-display:'Cinzel',serif;
    Iron Man        → --color-primary:#b91c1c; --color-secondary:#f59e0b; --color-bg:#111827; --color-text:#f3f4f6; --font-display:'Orbitron',sans-serif;
    Captain America → --color-primary:#1a3a6b; --color-secondary:#c8a951; --color-bg:#0d0d0d; --color-text:#e8e0c8; --font-display:'Oswald',sans-serif;
    SpongeBob       → --color-primary:#e88c00; --color-secondary:#ffe44d; --color-bg:#003f7f; --color-text:#fff9e6; --font-display:'Bangers',cursive;
    Stranger Things → --color-primary:#8b0000; --color-secondary:#e50914; --color-bg:#0a0a0a; --color-text:#e8d5b7; --font-display:'Courier New',monospace;
    Cyberpunk       → --color-primary:#7c3aed; --color-secondary:#06b6d4; --color-bg:#030712; --color-text:#e2e8f0; --font-display:'Share Tech Mono',monospace;
    Wakanda         → --color-primary:#4f1c87; --color-secondary:#c0a060; --color-bg:#0a0a0f; --color-text:#e8e0c8; --font-display:'Cinzel',serif;
  GLOBALS.CSS — ABSOLUTE RULES:
  ✅ You MAY edit: the :root { } block only (CSS variables)
  ❌ NEVER delete anything below the :root block
  ❌ NEVER rewrite the entire file — always read it first, change ONLY :root { }
  ❌ NEVER add body{} or @keyframes — they already exist below :root
  ❌ NEVER write "/* rest of the file remains unchanged */" or "..." — write the FULL file or only :root
  ❌ NEVER use \n escape sequences — use real newlines
  The file is 100+ lines. If you see it's shorter, restore it — do NOT overwrite.

STEP 3 — launch_frontend("http://localhost:3000")
  That is the FINAL step. Do NOT call qa_site, do NOT read files after launching.
  The site is scaffold-protected — all component files are correct. Just launch and stop.

== CODE EDIT ("fix/add/refactor") ==
When the user references a file path outside the generated-site directory:
1. Load the target file at the EXACT path provided by the user using the available read tool.
2. Apply the requested change — minimal edit, do not rewrite unrelated code.
3. Write the updated content to the EXACT same path using the available write tool.
4. Always use ABSOLUTE paths as given by the user. Do NOT rewrite paths to generated-site.
CRITICAL JSON RULE: When providing the "content" argument to the write tool, you MUST properly escape all newlines as \n and quotes as \". Do NOT use raw line breaks inside the JSON string.
This mode works for ANY language (Python, JavaScript, TypeScript, etc.) — not just Next.js.
== CANVAS / PREVIEW == launch_frontend(:3000)
== SPATIAL EDITOR == launch_frontend(:3001)

ABSOLUTE RULES — violating any of these breaks the build:
- NEVER write to any component .tsx file — they are locked
- NEVER import fetch_images anywhere — it is an agent tool, not a module
- NEVER use next/image — always plain <img src="...">
- NEVER import from lib/animations or any path that is not lucide-react, framer-motion, or next/link
- Image values in site-content.ts must be plain URL strings — never function calls
DO NOT call qa_site, fetch_images, or shell_exec during website theming — they are not part of the workflow.

${AGENT_MEMORY ? "== MEMORY: KNOWN ERRORS (mandatory — violations cause build failures) ==\n" + AGENT_MEMORY : ""}`;
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
          // Classify the voice/overlay command and pick minimal tool set
          const voiceIntent = classifyIntent(prompt);
          const voiceToolMap = Object.fromEntries(TOOLS.map(t => [t.name, t]));
          const voicePick = (...names) => names.map(n => voiceToolMap[n]).filter(Boolean);
          const voiceTools = {
            website: voicePick("file_read", "file_write", "fetch_images", "launch_frontend", "append_memory"),
            fix:     voicePick("file_read", "file_write", "search", "qa_site", "launch_frontend", "append_memory"),
            feature: voicePick("file_read", "file_write", "search", "qa_site", "launch_frontend", "append_memory"),
            arch:    voicePick("file_read", "file_write", "search", "shell_exec", "qa_site", "launch_frontend", "append_memory"),
            visual:  voicePick("launch_frontend", "append_memory"),
            chat:    [],
          }[voiceIntent] ?? voicePick("file_read", "file_write", "search", "append_memory");

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
          res.end("\n[done]");
        } catch (e) {
          res.end(`\n[error] ${e.message}`);
        }
      });
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
// Role → display config
const ROLE_CONFIG = {
  ORCHESTRATOR: { emoji: "🤖", color: C.white },
  ARCHITECT: { emoji: "🏗️", color: C.yellow },
  "SNR-DEV": { emoji: "📦", color: C.cyan },
  "JNR-DEV": { emoji: "🔧", color: C.blue },
  QA: { emoji: "🔍", color: C.magenta },
  CANVAS: { emoji: "✏️", color: C.magenta },
  PREVIEW: { emoji: "🌐", color: C.green },
  MEMORY: { emoji: "💾", color: C.yellow },
  GUARDRAILS: { emoji: "🛡️", color: C.red },
};

function emitRoleBanner(role) {
  const cfg = ROLE_CONFIG[role] ?? { emoji: "●", color: C.white };
  logEvent(role, `${getPhaseDescription(role)}`, cfg.emoji, cfg.color);
}

function getPhaseDescription(role) {
  const map = {
    ORCHESTRATOR: "Routing intent…",
    ARCHITECT: "Architect analyzing — planning build…",
    "SNR-DEV": "Senior Developer splitting work across files…",
    "JNR-DEV": "Junior Developer applying targeted edit…",
    QA: "Site-tester running validation…",
    CANVAS: "Opening visual / spatial editor…",
    PREVIEW: "Launching preview server…",
    MEMORY: "Writing to agent memory…",
    GUARDRAILS: "Guardrails checking operation…",
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

// ── Direct Groq website builder — bypasses tool-calling entirely ──────────────
// llama-3.3-70b-versatile fails with "failed_generation" when it has to pick
// tools from a schema. For website creation we don't need tools — we just ask
// the model to output file content directly, then write it ourselves.
async function buildWebsiteDirect(prompt) {
  const GROQ_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_KEY) throw new Error("GROQ_API_KEY not set");

  const startMs = Date.now();
  emitRoleBanner("ARCHITECT");
  logEvent("ARCHITECT", "Generating website content…", "🏗️", C.yellow);

  const siteContentPath = path.join(GENERATED_SITE, "src", "app", "site-content.ts");
  const cssPath         = path.join(GENERATED_SITE, "src", "app", "globals.css");

  // ── Step 1: generate site-content.ts ──────────────────────────────────────
  const contentReq = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${GROQ_KEY}` },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      max_tokens: 3000,
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: `You output ONLY valid TypeScript — no markdown, no explanation, no code fences.
Output exactly this structure for the given theme:
export const SITE = {
  navbar: { brand: "...", links: [{label:"...",href:"/..."},...] },
  hero: { headline:"...", subtext:"...", cta1:"...", cta2:"...", imageUrl:"https://image.pollinations.ai/prompt/THEME+cinematic?width=1600&height=900&nologo=true&seed=NNNNN" },
  cards: [{title:"...",desc:"...",imageUrl:"https://image.pollinations.ai/prompt/THEME+card?width=400&height=300&nologo=true&seed=NNNNN"},{title:"...",desc:"...",imageUrl:"https://image.pollinations.ai/prompt/THEME+card2?width=400&height=300&nologo=true&seed=NNNNN"},{title:"...",desc:"...",imageUrl:"https://image.pollinations.ai/prompt/THEME+card3?width=400&height=300&nologo=true&seed=NNNNN"}],
  features: { sectionTitle:"...", items:[{icon:"emoji",title:"...",desc:"..."},{icon:"emoji",title:"...",desc:"..."},{icon:"emoji",title:"...",desc:"..."},{icon:"emoji",title:"...",desc:"..."}] },
  cta: { headline:"...", body:"...", button:"...", imageUrl:"https://image.pollinations.ai/prompt/THEME+wide?width=1200&height=400&nologo=true&seed=NNNNN" },
  footer: { brand:"...", tagline:"...", links:[{label:"...",href:"/..."},...] },
};
Rules: all text themed to the request · no imports · no JSX · plain strings only · real seed numbers`
        },
        { role: "user", content: `Create site content for: ${prompt}` }
      ],
    }),
  });
  const contentJson = await contentReq.json();
  if (!contentReq.ok) throw new Error(`Groq error: ${JSON.stringify(contentJson)}`);
  let siteContent = contentJson.choices?.[0]?.message?.content?.trim() ?? "";
  // Strip markdown code fences if model added them anyway
  siteContent = siteContent.replace(/^```[a-z]*\n?/m, "").replace(/\n?```$/m, "").trim();

  writeFileSync(siteContentPath, siteContent, "utf-8");
  logEvent("SNR-DEV", "Wrote site-content.ts", "✍️", C.cyan);

  // ── Step 2: generate CSS :root variables ──────────────────────────────────
  const cssReq = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${GROQ_KEY}` },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      max_tokens: 200,
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content: `Output ONLY a CSS :root block — no explanation, no markdown. Use exactly these variable names:
:root {
  --color-primary: #hex;
  --color-secondary: #hex;
  --color-bg: #hex;
  --color-text: #hex;
  --font-display: 'FontName', fallback;
}`
        },
        { role: "user", content: `CSS theme for: ${prompt}` }
      ],
    }),
  });
  const cssJson = await cssReq.json();
  if (!cssReq.ok) throw new Error(`Groq CSS error: ${JSON.stringify(cssJson)}`);
  let rootBlock = cssJson.choices?.[0]?.message?.content?.trim() ?? "";
  rootBlock = rootBlock.replace(/^```[a-z]*\n?/m, "").replace(/\n?```$/m, "").trim();

  // Ensure globals.css is healthy before patching :root
  let existingCss = "";
  try { existingCss = readFileSync(cssPath, "utf-8"); } catch {}
  if (!existingCss.includes("@keyframes")) {
    // CSS is broken/missing — restoreComponents will rebuild it
    restoreComponents();
    try { existingCss = readFileSync(cssPath, "utf-8"); } catch {}
  }
  // Replace only the :root block, keep everything else
  const newCss = existingCss.includes(":root")
    ? existingCss.replace(/:root\s*\{[^}]+\}/s, rootBlock)
    : `@import "tailwindcss";\n\n${rootBlock}\n\n${existingCss}`;
  writeFileSync(cssPath, newCss, "utf-8");
  logEvent("SNR-DEV", "Wrote globals.css :root", "✍️", C.cyan);

  // ── Step 3: launch preview ─────────────────────────────────────────────────
  const elapsed = ((Date.now() - startMs) / 1000).toFixed(1);
  process.stderr.write(`${C.dim}[  ${elapsed}s]${C.reset}\n`);

  // Use the launch_frontend tool handler directly
  const launchTool = TOOLS.find(t => t.name === "launch_frontend");
  if (launchTool) {
    const result = await launchTool.handler({ url: "http://localhost:3000" });
    logEvent("PREVIEW", "Launched at http://localhost:3000", "🌐", C.green);
  }
}

async function runAgent(prompt) {
  const intent = classifyIntent(prompt);
  const startMs = Date.now();
  let lastToolName = null;

  // ── Website intent: bypass tool-calling, call Groq directly ───────────────
  if (intent === "website") {
    try {
      await buildWebsiteDirect(prompt);
    } catch (e) {
      process.stderr.write(`${C.red}[💥 ERROR]${C.reset} Website build failed: ${e.message}\n`);
    }
    return;
  }

  // Emit role banner based on intent
  if (intent === "fix") {
    emitRoleBanner("SNR-DEV");
    logEvent("SNR-DEV", "Loading context — preparing fix…", "🔎", C.cyan);
  } else if (intent === "feature") {
    emitRoleBanner("SNR-DEV");
    logEvent("SNR-DEV", "Feature boundary scoped — planning implementation…", "📐", C.cyan);
  } else if (intent === "arch") {
    emitRoleBanner("ARCHITECT");
    logEvent("ARCHITECT", "Full-codebase scope — system-level analysis…", "🗺️", C.yellow);
  } else if (intent === "visual") {
    emitRoleBanner("CANVAS");
  } else {
    emitRoleBanner("ORCHESTRATOR");
  }

  let snrDevLogged = false;

  // ── Tool filtering — only give the model what it needs for this intent.
  // Passing all 11 tools causes Groq to return "Failed to call a function"
  // because the combined schema exceeds what llama-3.3-70b can reliably handle.
  const TOOL_MAP = Object.fromEntries(TOOLS.map(t => [t.name, t]));
  const pick = (...names) => names.map(n => TOOL_MAP[n]).filter(Boolean);

  const intentTools = {
    website: pick("file_read", "file_write", "fetch_images", "launch_frontend", "append_memory"),
    fix:     pick("file_read", "file_write", "append_memory"),
    feature: pick("file_read", "file_write", "append_memory"),
    arch:    pick("file_read", "file_write", "search", "shell_exec", "append_memory"),
    visual:  pick("launch_frontend", "append_memory"),
    chat:    [],
  };
  const activeTools = intentTools[intent] ?? TOOLS;

  // Use llama-3.3-70b for tool-calling intents — Llama 4 Scout mangles function call format
  const editModel = intent === "website" ? MODEL : "groq:llama-3.3-70b-versatile";

  for await (const msg of query({
    prompt,
    dir: __dirname,
    model: editModel,
    tools: activeTools,
    replaceBuiltinTools: true,
    systemPrompt: SYSTEM_PROMPT,
    maxTurns: 20,
    constraints: { maxTokens: 4096 },
  })) {
    switch (msg.type) {
      case "delta":
        process.stdout.write(msg.content);
        // Detect structured plan blocks emitted by agent personas
        if (msg.content.includes("[ARCHITECT PLAN]")) {
          process.stderr.write(`\n${C.yellow}${C.bold}[ARCHITECT ]${C.reset} ${C.yellow}Plan received — beginning build pipeline…${C.reset}\n`);
        }
        if (msg.content.includes("[SNR SPLIT]") && !snrDevLogged) {
          snrDevLogged = true;
          process.stderr.write(`\n${C.cyan}${C.bold}[SNR-DEV   ]${C.reset} ${C.cyan}Work split confirmed — writing files…${C.reset}\n`);
        }
        // Detect when agent transitions to writing phase for website builds
        if (intent === "website" && !snrDevLogged && msg.content.includes("site-content.ts")) {
          snrDevLogged = true;
          emitRoleBanner("SNR-DEV");
        }
        break;

      case "assistant": {
        process.stdout.write("\n");
        const elapsed = ((Date.now() - startMs) / 1000).toFixed(1);
        const tokens = msg.usage?.totalTokens ?? "?";
        process.stderr.write(
          `${C.dim}[  ${elapsed}s |  tokens: ${tokens} / 4096]${C.reset}\n`
        );
        break;
      }

      case "tool_use": {
        lastToolName = msg.toolName;
        const argsPreview = JSON.stringify(msg.args ?? {}).slice(0, 100);

        // Role-specific tool event log
        if (msg.toolName === "append_memory") {
          logEvent("MEMORY", `Learning: ${msg.args?.category ?? ""} — ${String(msg.args?.rule ?? "").slice(0, 80)}`, "💾", C.yellow);
        } else if (msg.toolName === "qa_site") {
          logEvent("QA", `Validating ${msg.args?.url ?? "site"}…`, "🔍", C.magenta);
        } else if (msg.toolName === "launch_frontend") {
          const port = (msg.args?.url ?? "").includes("3001") ? 3001 : 3000;
          if (port === 3001) {
            logEvent("EDITOR", `Opening spatial editor at http://localhost:3001`, "✏️", C.magenta);
          } else {
            logEvent("PREVIEW", `Launching preview at http://localhost:3000`, "🌐", C.green);
          }
        } else if (msg.toolName === "file_write") {
          const filePath = msg.args?.path ?? "";
          const fileName = path.basename(filePath);
          logEvent("SNR-DEV", `Writing → ${filePath}`, "✍️", C.cyan);
        } else if (msg.toolName === "file_read") {
          const fileName = path.basename(msg.args?.path ?? "");
          process.stderr.write(`${C.dim}[→ file_read] ${fileName}${C.reset}\n`);
        } else if (msg.toolName === "shell_exec") {
          logEvent("ARCHITECT", `shell_exec → ${String(msg.args?.command ?? "").slice(0, 80)}`, "🔬", C.yellow);
        } else {
          process.stderr.write(`${C.dim}[→ ${msg.toolName}] ${argsPreview}${C.reset}\n`);
        }
        break;
      }

      case "tool_result": {
        // QA result surface
        if (lastToolName === "qa_site") {
          try {
            const result = JSON.parse(msg.content ?? "{}");
            const ok = result.status === "ok" || (result.errors ?? []).length === 0;
            const icon = ok ? "✅" : "❌";
            const errCount = (result.errors ?? []).length;
            const score = result.visual_score ?? "?";
            logEvent("QA",
              `${icon} status=${ok ? "pass" : "fail"} | score=${score} | errors=${errCount}`,
              ok ? "✅" : "❌",
              ok ? C.green : C.red
            );
            if (!ok && result.fix_instruction) {
              logEvent("SNR-DEV", `Fix instruction → ${String(result.fix_instruction).slice(0, 120)}`, "🩹", C.cyan);
            }
          } catch { /* non-JSON QA result — ignore */ }
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
  process.stderr.write(`${C.dim}[✓ done in ${totalElapsed}s]${C.reset}\n`);
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
