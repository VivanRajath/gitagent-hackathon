'use client';
import { usePathname } from 'next/navigation';
import SpatialVoiceOverlay from './SpatialVoiceOverlay';
import VoiceEditButton from './VoiceEditButton';

export default function LayoutOverlays() {
  const pathname = usePathname();
  if (pathname === '/voice') return null;
  return (
    <>
      <SpatialVoiceOverlay />
      <VoiceEditButton />
    </>
  );
}
