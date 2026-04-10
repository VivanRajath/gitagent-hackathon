'use client';

import React, { useRef } from 'react';
import dynamic from 'next/dynamic';
import { SpatialProvider, useSpatial } from './SpatialContext';
import { ThemeSelectorMenu } from './ThemeSelectorMenu';

// Lazy-load HandTracker so MediaPipe WASM never runs server-side
const HandTracker = dynamic(() => import('./HandTracker'), { ssr: false });

// ─────────────────────────────────────────────────────────────────────────────
// Virtual cursor — the glowing hand-tracking dot on screen
// ─────────────────────────────────────────────────────────────────────────────
function VirtualCursor() {
  const { cursor, isPinching } = useSpatial();
  return (
    <div
      className="fixed pointer-events-none z-[9998] transition-none"
      style={{ left: cursor.x - 10, top: cursor.y - 10 }}
    >
      {/* Outer glow ring */}
      <div
        className={`w-5 h-5 rounded-full border-2 transition-all duration-100 ${
          isPinching
            ? 'scale-150 border-fuchsia-400 shadow-[0_0_12px_rgba(192,38,211,0.8)]'
            : 'border-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]'
        }`}
      />
      {/* Inner dot */}
      <div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full ${
          isPinching ? 'bg-fuchsia-400' : 'bg-cyan-400'
        }`}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FPS counter overlay (dev helper)
// ─────────────────────────────────────────────────────────────────────────────
function FpsOverlay() {
  const frameRef = useRef(0);
  const lastRef  = useRef(performance.now());
  const divRef   = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    let raf: number;
    function tick() {
      frameRef.current++;
      const now = performance.now();
      if (now - lastRef.current >= 1000) {
        if (divRef.current) divRef.current.textContent = `${frameRef.current} fps`;
        frameRef.current = 0;
        lastRef.current = now;
      }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      ref={divRef}
      className="fixed bottom-3 right-3 z-[9999] text-[10px] text-cyan-400/60 font-mono tabular-nums pointer-events-none"
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Hint banner
// ─────────────────────────────────────────────────────────────────────────────
function HintBanner() {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9997] pointer-events-none">
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white/50 text-[11px] tracking-widest uppercase">
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
        Point at a component — Pinch to redesign
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Inner engine — consumes context
// ─────────────────────────────────────────────────────────────────────────────
function EditModeToggle() {
  const { isEditing, setIsEditing } = useSpatial();
  return (
    <button
      onClick={() => setIsEditing(!isEditing)}
      className={`fixed top-4 right-4 z-[9999] flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 shadow-lg ${
        isEditing
          ? 'bg-fuchsia-600 text-white shadow-fuchsia-500/40 shadow-xl'
          : 'bg-black/70 text-white/70 border border-white/20 backdrop-blur-md hover:bg-black/90 hover:text-white'
      }`}
    >
      <span className={`w-2 h-2 rounded-full ${isEditing ? 'bg-white animate-pulse' : 'bg-white/40'}`} />
      {isEditing ? 'Exit Edit Mode' : 'Edit Mode'}
    </button>
  );
}

function SpatialEngine({ children }: { children: React.ReactNode }) {
  const { setCursor, setIsPinching, activeTheme, isEditing } = useSpatial();

  return (
    <div data-theme={activeTheme} className="min-h-screen transition-[background-color,color] duration-700">

      {/* Edit mode toggle — always visible */}
      <EditModeToggle />

      {/* Hand tracking and editing UI — only active when isEditing */}
      {isEditing && (
        <>
          <HandTracker
            onCursorMove={(x, y) => setCursor({ x, y })}
            onPinch={(p) => setIsPinching(p)}
            showFeed={true}
          />
          <ThemeSelectorMenu />
          <VirtualCursor />
          <HintBanner />
          <FpsOverlay />
        </>
      )}

      {/* Website content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Public export — wrap page.tsx with this
// ─────────────────────────────────────────────────────────────────────────────
export function SpatialLayout({ children }: { children: React.ReactNode }) {
  return (
    <SpatialProvider>
      <SpatialEngine>{children}</SpatialEngine>
    </SpatialProvider>
  );
}
