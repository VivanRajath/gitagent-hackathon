---
name: design-copy
description: "Write all site copy (brand, nav, hero, cards, features, CTA, footer) themed to the user's request"
allowed-tools: Read
---

# Design Copy Skill

## Purpose
Produce the complete content layer for the website — every label, headline, body
copy, and button text — themed specifically to the user's request.

## Inputs
Receive the merged research-agent and resourcer-agent outputs including:
- `siteType`, `aesthetic`, `targetAudience`
- `imageKeywords` (for thematic inspiration)
- The original user request (franchise/brand/theme)

## Instructions

### Brand & Nav
- `brand`: the site name. For franchise sites, use an immersive world name, not a generic title.
- `tagline`: short footer tagline (under 10 words), reinforces brand identity
- `navLinks`: 4–5 navigation links. Labels should feel at home in the theme's world.
  Always include Home (/). Other links should be thematically named.
  Example (Naruto site): Home, Missions (/missions), Village (/village), Shinobi (/shinobi), Contact (/contact)

### Hero Zone
- `heroHeadline`: punchy, max 8 words, franchise-specific, creates intrigue or excitement
- `heroSubtext`: 1–2 compelling sentences that expand on the headline
- `heroCTA1`: primary action button (e.g. "Enter the Hidden Leaf", "Start Your Journey")
- `heroCTA2`: secondary action (e.g. "Watch Trailer", "Learn More", "Explore the World")

### Cards (exactly 3)
Each card represents a different aspect, character arc, location, or product from the theme:
```json
{ "title": "Card Title", "desc": "One compelling sentence." }
```

### Features (exactly 4)
Each feature highlights a value proposition or world element with an emoji icon:
```json
{ "icon": "⚡", "title": "Feature Name", "desc": "One benefit-focused sentence." }
```

### CTA Zone
- `ctaHeadline`: strong call-to-action headline that creates urgency
- `ctaBody`: 1–2 supporting sentences
- `ctaButton`: single, action-oriented button text

### Footer
3 standard footer links — balance thematic naming with utility:
```json
{ "label": "About", "href": "/about" }
```

## Output Format
Return ONLY this JSON (no markdown, no backticks):
```json
{
  "brand": "Hidden Leaf Chronicles",
  "tagline": "Where legends are forged in shadow and fire.",
  "navLinks": [
    {"label": "Home", "href": "/"},
    {"label": "Missions", "href": "/missions"},
    {"label": "Village", "href": "/village"},
    {"label": "Shinobi", "href": "/shinobi"},
    {"label": "Contact", "href": "/contact"}
  ],
  "heroHeadline": "The Will of Fire Never Dies",
  "heroSubtext": "Forge your path through the Hidden Leaf. Master jutsu, protect the village, and rise to become Hokage.",
  "heroCTA1": "Begin Your Mission",
  "heroCTA2": "Explore the Village",
  "cards": [
    {"title": "The Nine-Tails Awakens", "desc": "Unlock the power sealed within and face your destiny head-on."},
    {"title": "Chunin Exam Arc", "desc": "Prove your worth in the most brutal tournament the shinobi world has ever seen."},
    {"title": "Bonds of the Leaf", "desc": "Every team is a brotherhood forged in danger and loyalty."}
  ],
  "featureSectionTitle": "The Way of the Shinobi",
  "features": [
    {"icon": "🍃", "title": "Ninjutsu Mastery", "desc": "Train in the ancient arts of chakra manipulation and elemental jutsu."},
    {"icon": "👁️", "title": "Sharingan Insight", "desc": "See through every illusion and copy any technique with a single glance."},
    {"icon": "⚡", "title": "Lightning Speed", "desc": "Move faster than the eye can track with Body Flicker Technique."},
    {"icon": "🦊", "title": "Tailed Beast Power", "desc": "Harness the overwhelming force of a bijuu sealed within your very soul."}
  ],
  "ctaHeadline": "Your Legacy Begins Now",
  "ctaBody": "Every great shinobi started as a genin. The Hidden Leaf needs you — will you answer the call?",
  "ctaButton": "Join the Academy",
  "footerLinks": [
    {"label": "About", "href": "/about"},
    {"label": "Contact", "href": "/contact"},
    {"label": "FAQ", "href": "/faq"}
  ]
}
```
