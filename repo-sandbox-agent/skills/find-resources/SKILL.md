---
name: find-resources
description: >
  Dispatches the resourcer-agent to find themed images (Unsplash, Picsum),
  color palettes, and Google Fonts pairings for a given design theme.
  Returns a structured resource pack for the architect to embed into the
  Site Blueprint before any component is written.
allowed-tools: http_get, file_read
---

# Find Resources Skill

## Purpose
This skill runs the **resourcer-agent** pipeline. It is always invoked by the
`architect-website` skill between theme research and component development.
It ensures every generated website uses real, themed assets — never
placeholder images or generic grey boxes.

## Trigger
Called by architect with:
```json
{
  "theme": "<string>",
  "vibe": "<string>",
  "page_type": "<string>",
  "zones": ["hero", "card", "background", "cta"],
  "palette_hint": "<optional string>"
}
```

## Steps

### Step 1 — Announce
```
[orchestrator → resourcer-agent] Finding visual resources for theme: <theme>
```

### Step 2 — Build Image URLs (no HTTP call needed, URL patterns are deterministic)
For each requested zone, construct URLs using these patterns:

| Zone | URL Pattern |
|---|---|
| `hero` | `https://source.unsplash.com/1920x1080/?<theme-keyword>,dark` |
| `card` (× 3) | `https://source.unsplash.com/800x600/?<theme-keyword>,<index>` |
| `background` | `https://source.unsplash.com/1600x900/?<theme-keyword>,atmospheric` |
| `cta` | `https://source.unsplash.com/1200x400/?<theme-keyword>,abstract` |

Replace `<theme-keyword>` with URL-encoded primary theme keyword (spaces → `+`).
Replace `<index>` with 1, 2, 3 to get varied images from Unsplash's random serve.

### Step 3 — Derive Color Palette
Map the theme's `vibe` to a 7-token palette using this guide:

| Vibe | Primary | Secondary | Accent | Background | Surface | Text | Text Muted |
|---|---|---|---|---|---|---|---|
| dark horror | #CC0000 | #1A001A | #FF3366 | #080808 | #120012 | #F0E6FF | #9988AA |
| sci-fi neon | #00FFCC | #0A0A1A | #FF00FF | #050510 | #0D0D22 | #E0F0FF | #6677AA |
| retro warm | #FF6B35 | #1A0A00 | #FFD700 | #0D0800 | #1A1000 | #FFF5E6 | #AA8866 |
| nature | #2D8653 | #0A1A0D | #7BC67E | #060E08 | #0E1E10 | #E8F5E9 | #779988 |
| minimal light | #2563EB | #F8FAFC | #7C3AED | #FFFFFF | #F1F5F9 | #0F172A | #64748B |
| cyberpunk | #FF2079 | #0D0D0D | #00EEFF | #030303 | #111111 | #FFFFFF | #888888 |
| fantasy | #9B51E0 | #0D0520 | #F4C430 | #050210 | #0F0830 | #E8D5FF | #9977CC |

If the vibe doesn't match exactly, extrapolate the closest fit and tune hues to fit the theme.

### Step 4 — Select Google Fonts Pair
Match theme to a curated font pairing:

| Theme keywords | Display Font | Body Font |
|---|---|---|
| horror, scary, supernatural, haunted | Creepster | Inter |
| sci-fi, cyber, tech, future, space | Orbitron | Roboto |
| retro, 80s, vintage, nostalgic | VT323 | Source Sans 3 |
| fantasy, magic, medieval, dragon | Cinzel Decorative | Raleway |
| minimal, clean, corporate, modern | Plus Jakarta Sans | Inter |
| nature, organic, botanical | Playfair Display | Lato |
| dark, noir, mystery, detective | Bebas Neue | IBM Plex Serif |

For display font URL: `https://fonts.googleapis.com/css2?family=<Family+Name>:wght@<weights>&display=swap`
Body font should always include weights: 400;500;600

### Step 5 — Return Resource Pack
Assemble and return the complete resource pack JSON object (see resourcer-agent DUTIES.md §Output Contract).

Announce completion:
```
[resourcer-agent → architect] Resource pack ready.
  Images: <count> URLs
  Palette: <primary> / <accent> on <background>
  Fonts: <display> + <body>
```

### Step 6 — Hand off to architect
Return the full resource pack JSON. The architect will merge it into the Site Blueprint.

## Output Key Fields
The resource pack MUST contain all of:
- `images[]` — array with url, alt, zone, width, height
- `palette{}` — 7 color tokens (primary, secondary, accent, background, surface, text, text_muted)  
- `fonts{}` — display and body with family, weight, and URL

## Error Handling
- If Unsplash URL seems wrong, fall back to `https://picsum.photos/seed/<theme-hash>/<w>/<h>`
- If no palette vibe matches, default to `dark horror` palette and adjust accent color to match theme hue
- Always return a complete resource pack — never a partial one
