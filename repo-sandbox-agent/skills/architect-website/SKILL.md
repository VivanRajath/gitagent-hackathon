---
name: architect-website
description: Master pipeline for autonomous website generation.
allowed-tools: file_read, file_write, launch_frontend
---

# Architect Website Skill

## Trigger Conditions
Intent contains: "website", "site", "landing page" or "build me a [theme] layout".

## Pipeline (Execute in EXACT order)

1. **Research & Resources (Internal)**: Deduce theme colors (primary, secondary, background), typography, and vibe based purely on your knowledge of the theme.

2. **Build visual asset URLs (inline)**: Construct Pollinations.ai image URLs as plain strings — do NOT call the `fetch_images` tool.
   Pattern: `https://image.pollinations.ai/prompt/[theme+keywords+cinematic]?width=W&height=H&nologo=true&seed=NNNNN`
   Always add `&seed=` with a random 5-digit number for cache stability.
   Example: `https://image.pollinations.ai/prompt/harry+potter+castle+dark?width=1600&height=900&nologo=true&seed=73421`
   Required zones: `hero` (1600×900), `card` ×3 (400×300), `cta` (1200×400).
   Emit an `[ARCHITECT PLAN]` block (see your SOUL.md) immediately after deciding the palette and URLs.

3. **Build Blueprint**: You are tasked with generating 6 standard UI components: `Navbar`, `Hero` (100vh), `Card` (responsive grid of 3), `FeatureStrip` (image text rows), `CTABanner`, and `Footer`. Use the palette and fonts you deduced.

4. **Component Generation**: Write the files using `file_write` with **absolute paths only** (given in the system prompt).
  - **ALWAYS** prefix paths with the absolute `GENERATED_SITE` path from the system prompt. NEVER use bare relative paths.
  - `{GENERATED_SITE}/src/app/globals.css`: Insert CSS Variables (`--color-primary`, `--font-display`, etc) at the top. Append the entire `animations_css` string returned precisely from `fetch_images`.
  - `{GENERATED_SITE}/src/app/layout.tsx`: Inject Google Fonts `<link>` tags into the `<head>`. PRESERVE the existing `RootLayout` component structure — only update fonts. DO NOT rewrite to plain HTML.
    **CRITICAL**: In a `.tsx` file all void elements MUST be self-closing JSX. Use `<link ... />` NOT `<link ...>`. Use `<meta ... />` NOT `<meta ...>`. The closing `/>` is mandatory or Turbopack will fail with "Unterminated string constant".
    ALWAYS include `suppressHydrationWarning={true}` on the `<body>` element.
  - `{GENERATED_SITE}/src/components/Navbar.tsx`: Standard React component, no 'use client' needed.
  - `{GENERATED_SITE}/src/components/Hero.tsx`
  - `{GENERATED_SITE}/src/components/Card.tsx`
  - `{GENERATED_SITE}/src/components/FeatureStrip.tsx`
  - `{GENERATED_SITE}/src/components/CTABanner.tsx`
  - `{GENERATED_SITE}/src/components/Footer.tsx`
  - `{GENERATED_SITE}/src/app/page.tsx`: MUST start with `'use client';` on line 1. Import the 6 components + SpatialLayout + SpatialTarget. Wrap each section in `<SpatialTarget id="...">`.

5. **page.tsx Template** — use exactly this structure:
```tsx
'use client';

import { Navbar } from '../components/Navbar';
import { Hero } from '../components/Hero';
import { Card } from '../components/Card';
import FeatureStrip from '../components/FeatureStrip';
import CTABanner from '../components/CTABanner';
import { Footer } from '../components/Footer';
import { SpatialLayout } from '../components/SpatialEditor/SpatialLayout';
import { SpatialTarget } from '../components/SpatialEditor/SpatialTarget';

function Page() {
  return (
    <SpatialLayout>
      <main>
        <SpatialTarget id="navbar"><Navbar /></SpatialTarget>
        <SpatialTarget id="hero"><Hero /></SpatialTarget>
        <div className="flex flex-wrap gap-4 p-8 justify-center">
          <SpatialTarget id="card-1" className="p-2"><Card ... /></SpatialTarget>
          <SpatialTarget id="card-2" className="p-2"><Card ... /></SpatialTarget>
        </div>
        <FeatureStrip ... />
        <CTABanner />
        <Footer />
      </main>
    </SpatialLayout>
  );
}
export default Page;
```

6. **Launch**: Call `launch_frontend('http://localhost:3001')`.

7. **QA**: Invoke the `test-site` skill with the original user intent.
   - `site-tester` screenshots `http://localhost:3001`, checks console errors.
   - Any errors → forwarded to `snr-developer` for fixes (max 3 cycles).
   - On clean pass → report to user: visual score + one-line summary.

## Hard Rules
- **NEVER** use relative paths in `file_write` — always use the absolute `{GENERATED_SITE}/...` path.
- **ALWAYS** open `localhost:3001` for the generated-site preview (not `:3000`).
- **ALWAYS** invoke `test-site` after launch — never skip the QA step.
- **NEVER** write placeholder image sources.
- **ALWAYS** use CSS variables for colors in TSX.
- **ALWAYS** keep `'use client';` as the first line of `page.tsx`.
- **NEVER** replace `layout.tsx` with plain HTML — only add font `<link>` tags to the `<head>`.
