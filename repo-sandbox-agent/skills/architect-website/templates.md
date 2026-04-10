# File Templates for Website Generation

## LAYOUT_TEMPLATE — copy exactly, only change %%FONT_URL%% and %%TITLE%%
```tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = { title: '%%TITLE%%' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="%%FONT_URL%%" rel="stylesheet" />
      </head>
      <body suppressHydrationWarning={true}>{children}</body>
    </html>
  );
}
```
⚠️ Every <link> ends with /> — JSX requires self-closing void elements. Using > instead of /> causes "Unterminated string constant".

## PAGE_TEMPLATE — copy exactly, no changes
```tsx
'use client';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Card from '../components/Card';
import FeatureStrip from '../components/FeatureStrip';
import CTABanner from '../components/CTABanner';
import Footer from '../components/Footer';
import { SpatialLayout } from '../components/SpatialEditor/SpatialLayout';
import { SpatialTarget } from '../components/SpatialEditor/SpatialTarget';

export default function Page() {
  return (
    <SpatialLayout>
      <main>
        <SpatialTarget id="navbar"><Navbar /></SpatialTarget>
        <SpatialTarget id="hero"><Hero /></SpatialTarget>
        <section className="flex flex-wrap gap-4 p-8 justify-center">
          <SpatialTarget id="card-eleven"><Card index={0} /></SpatialTarget>
          <SpatialTarget id="card-mike"><Card index={1} /></SpatialTarget>
        </section>
        <SpatialTarget id="featurestrip"><FeatureStrip /></SpatialTarget>
        <SpatialTarget id="cta"><CTABanner /></SpatialTarget>
        <SpatialTarget id="footer"><Footer /></SpatialTarget>
      </main>
    </SpatialLayout>
  );
}
```
⚠️ All component imports are default. ALL 6 components MUST use `export default function ComponentName`.
⚠️ SpatialLayout and SpatialTarget use NAMED imports `{ SpatialLayout }` — these are the exception to the default-import rule.
