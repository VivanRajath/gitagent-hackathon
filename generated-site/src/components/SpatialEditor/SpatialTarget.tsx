'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useSpatial } from './SpatialContext';
import { motion } from 'framer-motion';

interface Props {
  id: string;
  children: React.ReactNode;
  className?: string;
  /** Whether bringing the hand over this element selects it automatically. */
  selectable?: boolean;
}

export function SpatialTarget({ id, children, className = '', selectable = true }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const { cursor, setActiveTarget, activeTarget } = useSpatial();
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!ref.current || !selectable) return;
    
    // Check if cursor x,y is inside the box
    const rect = ref.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const inX = cursor.x >= rect.left && cursor.x <= rect.right;
    const inY = cursor.y >= rect.top && cursor.y <= rect.bottom;
    const isNowHovered = inX && inY;

    if (isNowHovered !== isHovered) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsHovered(isNowHovered);
      if (isNowHovered) {
        setActiveTarget(id);
      } else if (activeTarget === id) {
        setActiveTarget(null);
      }
    }
  }, [cursor, id, selectable, isHovered, activeTarget, setActiveTarget]);

  return (
    <div
      ref={ref}
      className={`relative rounded-xl transition-all duration-300 ${isHovered ? 'ring-4 ring-cyan-400 ring-opacity-80 scale-[1.02] shadow-[0_0_30px_rgba(34,211,238,0.5)] z-40' : ''} ${className}`}
    >
      {children}
    </div>
  );
}
