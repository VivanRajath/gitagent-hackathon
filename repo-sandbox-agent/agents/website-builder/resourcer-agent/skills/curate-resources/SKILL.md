---
name: curate-resources
description: "Produce image theme, per-zone seeds, and font choice from research-agent output"
allowed-tools: Read
---

# Curate Resources Skill

## Purpose
Take the research-agent's design DNA and produce concrete visual resource parameters:
an image theme base prompt, deterministic generation seeds per zone, and typography.

## Inputs
Receive the full research-agent JSON output including `aesthetic`, `imageKeywords`,
`colorPalette`, `siteType`, and `fontDisplay`. Also receive the original user request.

## Instructions

### Image Theme
Construct a 3–5 keyword phrase that:
1. Uses the actual franchise name, world setting, or brand (not generic terms)
2. Includes a location or visual anchor from the IP world
3. Evokes the mood from `research.aesthetic`

Examples:
- Naruto request → `"Naruto Konoha rooftops sunset golden"`
- Minecraft request → `"Minecraft pixel forest castle sunlight blocks"`
- Horror request → `"abandoned mansion fog night eerie gothic"`
- Corporate SaaS → `"modern office glass city skyline professional"`

### Seeds
Generate random 5-digit integers for deterministic image generation:
- `heroSeed`: one seed for the hero zone (e.g. 73841)
- `cardSeeds`: array of 3 seeds, one per card (e.g. [21934, 58271, 94013])
- `ctaSeed`: one seed for the CTA zone (e.g. 37612)
No two seeds should be the same.

### Font
Pick a Google Font that matches the aesthetic:
- Horror/dark → `'Creepster'`, `'Nosifer'`, `'Abril Fatface'`
- Anime/manga → `'Bangers'`, `'Black Han Sans'`, `'Oswald'`
- Sci-fi/tech → `'Orbitron'`, `'Share Tech Mono'`, `'Exo 2'`
- Corporate/SaaS → `'Inter'`, `'Plus Jakarta Sans'`, `'DM Sans'`
- Nature/organic → `'Playfair Display'`, `'Lora'`, `'Cormorant Garamond'`
Always add a CSS fallback: `'Creepster', cursive` / `'Orbitron', monospace` / `'Inter', sans-serif`

### Palette Validation (refinedPalette)
Review the `research.colorPalette` against the imageTheme and user's stated intent. Produce a `refinedPalette` that:
- Keeps colors that already match the intent well
- Corrects any mismatch (e.g. if user said "yellow site" but research returned a dark bg, fix the bg to a warm light)
- Ensures `primary` reflects the user's explicitly named color if any
- Ensures `bg` matches the mood (warm light for food/restaurant, dark for gaming/horror, etc.)
- Ensures `text` has high contrast against `bg`

## Output Format
Return ONLY this JSON (no markdown, no backticks):
```json
{
  "imageTheme": "Naruto Konoha rooftops sunset golden ninja",
  "heroSeed": 73841,
  "cardSeeds": [21934, 58271, 94013],
  "ctaSeed": 37612,
  "fontDisplay": "'Bangers', cursive",
  "refinedPalette": {
    "primary": "#hex",
    "secondary": "#hex",
    "bg": "#hex",
    "text": "#hex"
  }
}
```
