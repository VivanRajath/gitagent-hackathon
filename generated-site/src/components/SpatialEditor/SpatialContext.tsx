'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Gesture = 'point' | 'pinch' | 'peace' | 'fist' | 'open' | 'thumbs_up';

export interface CursorState {
  x: number;
  y: number;
}

export type ThemeType = 'stranger-things' | 'cyberpunk' | 'minimalist' | 'neon-synth' | 'oceanic';

export interface ComponentVariation {
  id: string;         // e.g. "Navbar_1"
  label: string;      // e.g. "Iron Man Dark"
  description: string;
  code: string;       // Full TSX source code
  color: string;      // Accent color for the UI node
}

interface SpatialContextValue {
  cursor: CursorState;
  setCursor: (c: CursorState) => void;
  isPinching: boolean;
  setIsPinching: (val: boolean) => void;
  gesture: Gesture;
  setGesture: (g: Gesture) => void;
  activeTarget: string | null;
  setActiveTarget: (id: string | null) => void;
  activeTheme: ThemeType;
  setActiveTheme: (theme: ThemeType) => void;
  isGenerating: boolean;
  setIsGenerating: (val: boolean) => void;
  variations: ComponentVariation[];
  setVariations: (v: ComponentVariation[]) => void;
  menuOpen: boolean;
  setMenuOpen: (val: boolean) => void;
  menuPosition: CursorState;
  setMenuPosition: (p: CursorState) => void;
  isEditing: boolean;
  setIsEditing: (val: boolean) => void;
}

const SpatialContext = createContext<SpatialContextValue | undefined>(undefined);

export function SpatialProvider({ children }: { children: ReactNode }) {
  const [cursor, setCursor] = useState<CursorState>({ x: 0, y: 0 });
  const [isPinching, setIsPinching] = useState(false);
  const [gesture, setGesture] = useState<Gesture>('point');
  const [activeTarget, setActiveTarget] = useState<string | null>(null);
  const [activeTheme, setActiveTheme] = useState<ThemeType>('stranger-things');
  const [isGenerating, setIsGenerating] = useState(false);
  const [variations, setVariations] = useState<ComponentVariation[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<CursorState>({ x: 0, y: 0 });
  const [isEditing, setIsEditing] = useState(false);

  return (
    <SpatialContext.Provider
      value={{
        cursor, setCursor,
        isPinching, setIsPinching,
        gesture, setGesture,
        activeTarget, setActiveTarget,
        activeTheme, setActiveTheme,
        isGenerating, setIsGenerating,
        variations, setVariations,
        menuOpen, setMenuOpen,
        menuPosition, setMenuPosition,
        isEditing, setIsEditing,
      }}
    >
      {children}
    </SpatialContext.Provider>
  );
}

export function useSpatial() {
  const ctx = useContext(SpatialContext);
  if (!ctx) throw new Error('useSpatial must be used within SpatialProvider');
  return ctx;
}
