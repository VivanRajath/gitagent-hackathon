---
name: research-design
description: "Analyze a website request and return design DNA: site type, aesthetic, color palette, layout variants, and image keywords"
allowed-tools: Read
---

# Research Design Skill

## Purpose
Given a raw user website request, extract and structure all design parameters
needed by the downstream pipeline stages.

## Instructions
Analyze the user's request for:
1. **Site type**: classify as one of: e-commerce, portfolio, landing, saas, blog, agency, restaurant, gaming, anime, horror, sci-fi, corporate, or similar
2. **Aesthetic**: one sentence describing the visual mood and style (be specific to the theme/brand)
3. **Key features**: 3 features the site should have
4. **Target audience**: who will use this site
5. **Design inspiration**: 3 real brands or sites that do this aesthetic well
6. **Image keywords**: 3 specific keywords for image searches (franchise/world-accurate)
7. **Variants**: pick the best layout variant index (0–4) for each of the 6 zones
8. **Color palette**: derive theme-accurate colors (see palette rules below)
9. **Font**: pick a Google Font appropriate to the aesthetic with fallback stack

## Variant Index Guide
```
navbar:   0=Classic(logo-left)  1=Centered(logo-middle)  2=Animated(typewriter)  3=GlassCTA(with button)  4=Minimal(hamburger drawer)
hero:     0=Cinematic(fullbleed) 1=Split(text+image)     2=BoldType(huge text)   3=Magazine(editorial)     4=Asymmetric(dramatic)
cards:    0=Grid(3col)   1=Carousel(horizontal)  2=Featured(1big+smalls)  3=Masonry(staggered)   4=List(alternating rows)
features: 0=IconGrid     1=Numbered              2=Alternating(left/right) 3=Timeline             4=StatCards(horizontal scroll)
cta:      0=Fullbleed(image bg) 1=Split(text+image) 2=Minimal(border accent) 3=GlassCard(frosted)  4=HorizBar(banner strip)
footer:   0=TwoCol       1=Centered              2=Minimal(one line)      3=BigBrand(watermark)  4=DarkCard(raised card)
```
Example: e-commerce → navbar:3 (CTA button), hero:1 (product split), cards:0 (product grid)

## Color Palette Rules
Match ALL colors to the **actual user intent** — never default to dark unless the theme demands it.

- `bg` = page background, driven by intent:
  - Dark/gaming/horror/sci-fi/nightclub/cyberpunk → very dark (#000 to #121212)
  - Restaurant/food/warm/cafe → cream/off-white (#fffbf0 to #fdf6e3)
  - Corporate/SaaS/clean/minimal → near-white (#f8fafc to #f0f4f8)
  - Nature/organic/wellness/green → soft warm light (#f0fdf4 to #fafaf5)
  - If user explicitly names a color ("orange site", "yellow theme", "purple site") → bg is a DARK or LIGHT neutral that makes that color pop
- `primary` = dominant brand/action color. **MUST reflect what the user said.** "orange" → primary IS orange (#ea580c+). "yellow" → primary IS yellow (#eab308+). "blue" → primary IS blue. "red horror" → primary IS red (#dc2626+).
- `secondary` = accent/highlight. Complements primary — slightly lighter, more saturated, or harmonious hue. Should feel like the same palette family.
- `text` = readable body text with high contrast against `bg`. Dark bg → light (#e0e0e0–#ffffff). Light bg → dark (#1a1a1a–#444444).

Intent-to-palette examples:
- "orange gaming site" → bg:#0a0805, primary:#ea580c, secondary:#ff8c00, text:#f0e8e0
- "yellow food restaurant" → bg:#fffbf0, primary:#d97706, secondary:#f59e0b, text:#1a1209
- "blue SaaS landing" → bg:#0f172a, primary:#3b82f6, secondary:#60a5fa, text:#e2e8f0
- "green nature blog" → bg:#f0fdf4, primary:#16a34a, secondary:#4ade80, text:#14532d
- "red horror site" → bg:#0a0505, primary:#dc2626, secondary:#ff3333, text:#f0e0d0
- "purple anime site" → bg:#0d0717, primary:#7c3aed, secondary:#a78bfa, text:#f0e8ff
- "brown coffee shop" → bg:#fdf6ee, primary:#92400e, secondary:#c47a2b, text:#1c0f05
- "pink beauty brand" → bg:#fff0f6, primary:#ec4899, secondary:#f9a8d4, text:#1a0a12

## Output Format
Return ONLY this JSON (no markdown, no backticks):
```json
{
  "siteType": "landing",
  "aesthetic": "dark cinematic horror with 1980s nostalgia, neon accents, and retro grain",
  "keyFeatures": ["atmospheric hero", "character showcase cards", "merch CTA"],
  "targetAudience": "fans of supernatural horror fiction aged 16-35",
  "designInspiration": "Netflix Stranger Things site, A24 Films, Letterboxd",
  "imageKeywords": ["1980s small town night", "neon glow fog street", "retro horror atmosphere"],
  "variants": { "navbar": 2, "hero": 0, "cards": 2, "features": 0, "cta": 0, "footer": 3 },
  "colorPalette": { "primary": "#1a0a0a", "secondary": "#ff3333", "bg": "#0a0505", "text": "#f0e0d0" },
  "fontDisplay": "'Creepster', cursive"
}
```
