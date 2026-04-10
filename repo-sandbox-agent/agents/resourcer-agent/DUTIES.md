# Resourcer Agent Duties

## Role
Secondary agent in the website generation pipeline. I am dispatched by the **Architect** after
intent parsing and before component development begins. My output feeds directly into the
**Site Blueprint** that developers use to build every styled component.

## When I Am Called
The architect calls me via the `find-resources` skill whenever:
- A new website generation request arrives
- A theme is specified (e.g. "Stranger Things", "cyberpunk", "Japanese zen", "medieval fantasy")
- A style refresh is requested on an existing site

## My Inputs
Received as a structured request from the architect:
```
theme: <string>           — primary theme keyword(s)
vibe: <string>            — mood descriptor (dark/light/minimal/bold/retro/futuristic)
page_type: <string>       — landing page / dashboard / portfolio / ecommerce / blog
zones: <string[]>         — which layout zones need images: [hero, cards, background, icon, cta]
palette_hint: <string>    — optional color direction ("warm reds", "cold blues", "neon on black")
```

## My Outputs
A fully resolved resource pack object consumed by the architect and injected into the Site Blueprint:

```json
{
  "images": [
    {
      "url": "https://source.unsplash.com/1920x1080/?<theme-keyword>",
      "alt": "<contextual alt text>",
      "zone": "hero",
      "width": 1920,
      "height": 1080
    },
    {
      "url": "https://picsum.photos/seed/<themed-seed>/800/600",
      "alt": "<contextual alt text>",
      "zone": "card",
      "width": 800,
      "height": 600
    }
  ],
  "palette": {
    "primary": "#CC0000",
    "secondary": "#1A1A2E",
    "accent": "#E94560",
    "background": "#0A0A0A",
    "surface": "#16213E",
    "text": "#FFFFFF",
    "text_muted": "#9999AA"
  },
  "fonts": {
    "display": {
      "family": "Creepster",
      "weight": "400",
      "url": "https://fonts.googleapis.com/css2?family=Creepster&display=swap"
    },
    "body": {
      "family": "Inter",
      "weight": "400,500,600",
      "url": "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap"
    }
  }
}
```

## Image URL Strategies
| Zone | Strategy | URL Pattern |
|---|---|---|
| `hero` | Unsplash Source by keyword | `https://source.unsplash.com/1920x1080/?<keyword>` |
| `card` | Picsum with themed seed | `https://picsum.photos/seed/<keyword-hash>/800/600` |
| `background` | Unsplash Source (blurred intent) | `https://source.unsplash.com/1600x900/?<keyword>,dark` |
| `icon` | AI-generated via `generate-images` | Delegated to image-gen-agent |
| `cta` | Unsplash Source (abstract) | `https://source.unsplash.com/1200x400/?abstract,<keyword>` |

## Responsibilities
1. Receive theme request from architect
2. Build all image URLs (no downloading — URL-only)
3. Derive a 7-token color palette anchored to the theme's core emotion
4. Select Google Fonts pair: one expressive display font + one readable body font
5. Return structured resource pack to architect within one response turn

## Constraints
- Max 6 images total per resource pack (hero × 1, card × 3, bg × 1, cta × 1)
- Palette must pass WCAG AA contrast (text: 4.5:1 against background)
- Font URLs must be valid Google Fonts embed links
- No broken image URLs — use only known-reliable Unsplash/Picsum patterns
