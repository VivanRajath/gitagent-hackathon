---
name: build-website
description: "Orchestrate the full website generation pipeline from a user request to production-ready site files"
allowed-tools: Bash Read Write
---

# Build Website Skill

## Purpose
Execute the four-stage website generation pipeline and assemble outputs into the
three final site files consumed by the Next.js frontend.

## Pipeline Execution

### Stage 1 — research-agent
Call `research-agent` with the raw user request. Expect JSON:
```json
{
  "siteType": "...", "aesthetic": "...", "keyFeatures": [...],
  "targetAudience": "...", "designInspiration": "...",
  "imageKeywords": [...],
  "variants": { "navbar": 0, "hero": 0, "cards": 0, "features": 0, "cta": 0, "footer": 0 },
  "colorPalette": { "primary": "#hex", "secondary": "#hex", "bg": "#hex", "text": "#hex" },
  "fontDisplay": "'FontName', fallback-family"
}
```

### Stage 2 — resourcer-agent
Pass research output to `resourcer-agent`. Expect JSON:
```json
{
  "imageTheme": "5-keyword prompt base",
  "heroSeed": 12345,
  "cardSeeds": [11111, 22222, 33333],
  "ctaSeed": 44444,
  "fontDisplay": "'FontName', fallback-family"
}
```

### Stage 3 — uiux-agent
Pass research + resourcer outputs to `uiux-agent`. Expect JSON:
```json
{
  "brand": "...", "tagline": "...", "navLinks": [...],
  "heroHeadline": "...", "heroSubtext": "...", "heroCTA1": "...", "heroCTA2": "...",
  "cards": [...], "featureSectionTitle": "...", "features": [...],
  "ctaHeadline": "...", "ctaBody": "...", "ctaButton": "...", "footerLinks": [...]
}
```

### Stage 4 — image-gen-agent
Build an image spec from all prior outputs and call `image-gen-agent`:
```json
{
  "theme": "<aesthetic from research>",
  "vibe": "<keyFeatures joined>",
  "images": [
    { "zone": "hero", "prompt_intent": "<imageTheme + heroSeed context>", "width": 1920, "height": 1080, "style": "<aesthetic>" },
    { "zone": "card", "prompt_intent": "<imageTheme card variant>", "width": 800, "height": 600, "style": "<aesthetic>" },
    { "zone": "cta", "prompt_intent": "<imageTheme CTA variant>", "width": 1440, "height": 600, "style": "<aesthetic>" }
  ],
  "animations": ["fade-in-up", "float"]
}
```
Receives back: `{ generated: [...], animations: [...], puterConfigPath: "..." }`

## Assembly — site-content.ts
Write `generated-site/src/app/site-content.ts` merging uiux + resourcer + image-gen outputs:
```ts
export const siteContent = {
  brand: "...",
  tagline: "...",
  navLinks: [...],
  hero: { headline: "...", subtext: "...", cta1: "...", cta2: "...", imageAlt: "..." },
  cards: [...],
  features: { title: "...", items: [...] },
  cta: { headline: "...", body: "...", button: "..." },
  footer: { tagline: "...", links: [...] }
};
```

## Assembly — design-variants.json
Write `generated-site/src/app/design-variants.json` from research output:
```json
{
  "navbar": 0, "hero": 0, "cards": 0,
  "features": 0, "cta": 0, "footer": 0,
  "colorPalette": { "primary": "#hex", "secondary": "#hex", "bg": "#hex", "text": "#hex" },
  "fontDisplay": "'FontName', fallback-family"
}
```

## Assembly — puter-image-config.js
This file is written by image-gen-agent directly. Verify it exists at
`generated-site/public/puter-image-config.js` after Stage 4.
