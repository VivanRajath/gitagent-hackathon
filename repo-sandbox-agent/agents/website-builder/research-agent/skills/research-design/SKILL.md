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
- `secondary` = BRIGHT GLOWING ACCENT (neon glow, buttons, highlights) — must be visible on dark bg
- `primary` = dark structural/background tone
- `bg` = page background (almost always very dark: #000, #0a0a0a, #0d0d1a)
- `text` = readable body text color (#e0e0e0, #f0f0f0, or #ffffff)

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
