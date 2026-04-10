import type { Metadata } from 'next';
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
}