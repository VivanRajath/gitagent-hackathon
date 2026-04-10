'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSpatial } from './SpatialContext';
import { requestVariations, commitVariation, resolveComponentPath } from './AgentBridge';
import { Zap, Loader2, CheckCircle2, X } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const PINCH_SELECT_RADIUS = 48;   // px distance to count as "aiming at this node"
const PINCH_HOLD_MS       = 600;  // ms you must hold a pinch to confirm selection

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function dist(ax: number, ay: number, bx: number, by: number) {
  return Math.hypot(ax - bx, ay - by);
}

// ─────────────────────────────────────────────────────────────────────────────
// Orbital node positions for 5 variations (evenly spread around a circle)
// ─────────────────────────────────────────────────────────────────────────────
function orbitPositions(count: number, radius: number) {
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
    return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
  });
}

const ORBITS = orbitPositions(5, 110);

// ─────────────────────────────────────────────────────────────────────────────
// Load the actual current source of a component so the agent knows
// what to redesign. We route via the Next.js API proxy to avoid CORS.
// ─────────────────────────────────────────────────────────────────────────────
async function fetchCurrentSource(componentPath: string): Promise<string> {
  try {
    const res = await fetch(`/api/component-source?path=${encodeURIComponent(componentPath)}`);
    if (!res.ok) return '// source unavailable';
    const json = await res.json();
    return json.source ?? '// source unavailable';
  } catch {
    return '// source unavailable';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
export function ThemeSelectorMenu() {
  const {
    cursor, isPinching, activeTarget,
    isGenerating, setIsGenerating,
    variations, setVariations,
    menuOpen, setMenuOpen, setMenuPosition, menuPosition,
    activeTheme,
  } = useSpatial();

  // Track which node the user is aiming at
  const hoveredNodeRef  = useRef<number | null>(null);
  const pinchStartRef   = useRef<number | null>(null);   // timestamp when pinch began
  const committingRef   = useRef(false);                 // prevent double-commit

  // ── Open menu when user pinches a spatial target ──────────────────────────
  const triggerGeneration = useCallback(async (targetId: string) => {
    if (isGenerating || menuOpen) return;
    setMenuOpen(true);
    setMenuPosition({ x: cursor.x, y: cursor.y });
    setIsGenerating(true);
    setVariations([]);

    try {
      const componentPath = resolveComponentPath(targetId);
      const currentSource = await fetchCurrentSource(componentPath);
      const vars = await requestVariations(targetId, currentSource, activeTheme);
      setVariations(vars);
    } catch (e) {
      console.error('[SpatialMenu] Generation failed:', e);
    } finally {
      setIsGenerating(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTheme, isGenerating, menuOpen]);

  // Detect pinch-open
  useEffect(() => {
    if (!isPinching || !activeTarget || menuOpen || isGenerating) return;
    triggerGeneration(activeTarget);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPinching, activeTarget]);

  // ── Node hover & pinch-to-commit ──────────────────────────────────────────
  useEffect(() => {
    if (!menuOpen || variations.length === 0 || committingRef.current) return;

    // Detect which orbital node the cursor is over
    let hovered: number | null = null;
    for (let i = 0; i < ORBITS.length; i++) {
      const nx = menuPosition.x + ORBITS[i].x;
      const ny = menuPosition.y + ORBITS[i].y;
      if (dist(cursor.x, cursor.y, nx, ny) < PINCH_SELECT_RADIUS && i < variations.length) {
        hovered = i;
        break;
      }
    }
    hoveredNodeRef.current = hovered;

    // Close button (centre of the ring)
    const centreClose = dist(cursor.x, cursor.y, menuPosition.x, menuPosition.y) < 28;

    if (isPinching) {
      if (centreClose) {
        // Close without selecting
        setMenuOpen(false);
        setVariations([]);
        return;
      }

      if (hovered !== null) {
        // Start or continue pinch hold timer
        if (pinchStartRef.current === null) {
          pinchStartRef.current = performance.now();
        } else if (performance.now() - pinchStartRef.current > PINCH_HOLD_MS) {
          // ── COMMIT ────────────────────────────────────────────────────────
          committingRef.current = true;
          const chosen = variations[hovered];
          const targetId = activeTarget ?? 'navbar';
          const path = resolveComponentPath(targetId);
          setMenuOpen(false);
          setVariations([]);
          commitVariation(path, chosen.code)
            .catch((e) => console.error('[SpatialMenu] Commit failed:', e))
            .finally(() => { committingRef.current = false; });
        }
      } else {
        pinchStartRef.current = null;
      }
    } else {
      pinchStartRef.current = null;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursor, isPinching, menuOpen, variations]);

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <AnimatePresence>
      {menuOpen && (
        <motion.div
          key="spatial-menu"
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.4 }}
          transition={{ type: 'spring', stiffness: 280, damping: 22 }}
          style={{ left: menuPosition.x - 130, top: menuPosition.y - 130 }}
          className="fixed z-[9000] pointer-events-none select-none"
        >
          {/* ── Centre glyph: spinner while generating, X when done ─────── */}
          <div
            style={{ left: 130, top: 130 }}
            className="absolute -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full
                       flex items-center justify-center
                       bg-black/70 backdrop-blur-md border border-white/20 shadow-lg"
          >
            {isGenerating
              ? <Loader2 className="text-cyan-400 animate-spin" size={20} />
              : <X className="text-white/70" size={16} />
            }
          </div>

          {/* ── Orbit ring decoration ────────────────────────────────────── */}
          <svg
            className="absolute opacity-20"
            style={{ left: 0, top: 0, width: 260, height: 260 }}
            viewBox="0 0 260 260"
          >
            <circle cx="130" cy="130" r="110" stroke="rgba(34,211,238,0.6)" strokeWidth="1" fill="none" strokeDasharray="4 6" />
          </svg>

          {/* ── Orbital nodes ─────────────────────────────────────────────── */}
          {ORBITS.map((orbit, i) => {
            const variation = variations[i];
            const nx = menuPosition.x + orbit.x;
            const ny = menuPosition.y + orbit.y;
            const isHovered = hoveredNodeRef.current === i;
            const pinchProgress = (isPinching && isHovered && pinchStartRef.current !== null)
              ? Math.min((performance.now() - pinchStartRef.current) / PINCH_HOLD_MS, 1)
              : 0;

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 130, y: 130, scale: 0.3 }}
                animate={{
                  opacity: isGenerating ? 0.4 : 1,
                  x: 130 + orbit.x - 32,   // position relative to SVG origin; 32 = half node width
                  y: 130 + orbit.y - 32,
                  scale: isHovered ? 1.2 : 1,
                }}
                transition={{ delay: i * 0.07, type: 'spring', stiffness: 300, damping: 20 }}
                className="absolute w-16 h-16 rounded-full flex flex-col items-center justify-center
                           text-center overflow-hidden cursor-none"
                style={{
                  border: `2px solid ${variation?.color ?? '#444'}`,
                  background: isGenerating
                    ? 'rgba(0,0,0,0.6)'
                    : `radial-gradient(circle at center, ${variation?.color ?? '#333'}22, #000000bb)`,
                  boxShadow: isHovered
                    ? `0 0 24px ${variation?.color ?? '#fff'}, 0 0 48px ${variation?.color ?? '#fff'}44`
                    : 'none',
                  backdropFilter: 'blur(8px)',
                }}
              >
                {/* Pinch-hold progress ring */}
                {pinchProgress > 0 && (
                  <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 64 64">
                    <circle
                      cx="32" cy="32" r="30"
                      fill="none"
                      stroke={variation?.color ?? '#fff'}
                      strokeWidth="3"
                      strokeDasharray={`${pinchProgress * 188} 188`}
                      strokeLinecap="round"
                    />
                  </svg>
                )}

                {isGenerating ? (
                  <Loader2 className="animate-spin text-cyan-400/40" size={18} />
                ) : variation ? (
                  <>
                    {isHovered && <CheckCircle2 size={14} className="mb-0.5" style={{ color: variation.color }} />}
                    <span className="text-[8.5px] font-bold uppercase tracking-wide px-1 leading-tight"
                          style={{ color: isHovered ? variation.color : '#ddd' }}>
                      {variation.label}
                    </span>
                  </>
                ) : (
                  <span className="text-white/20 text-[9px]">{i + 1}</span>
                )}
              </motion.div>
            );
          })}

          {/* ── Status caption ────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute text-center"
            style={{ left: 0, top: 260, width: 260 }}
          >
            {isGenerating ? (
              <span className="text-[10px] text-cyan-400/80 tracking-widest uppercase flex items-center justify-center gap-1">
                <Zap size={10} className="animate-pulse" /> Agent designing variants…
              </span>
            ) : variations.length > 0 ? (
              <span className="text-[10px] text-white/50 tracking-widest uppercase">
                Point + Hold Pinch to apply
              </span>
            ) : null}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
