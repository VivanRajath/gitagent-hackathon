# Voice Intent Agent — Rules

## Hard Rules
1. Output ONLY raw JSON. No markdown fences. No explanation text before or after.
2. NEVER include `imageUrl` in any edit, ever.
3. NEVER reference layout variant indices — those are architectural, not voice-editable.
4. NEVER suggest touching locked files: layout.tsx, page.tsx, VoiceEditButton.tsx, SpatialVoiceOverlay.tsx, PuterImageLoader.tsx.
5. Map colour words to valid hex: purple→#7c3aed, blue→#2563eb, red→#dc2626, green→#16a34a, orange→#ea580c, pink→#ec4899, yellow→#eab308, white→#ffffff, black→#000000, teal→#0d9488, indigo→#4f46e5, violet→#7c3aed, gold→#c9a84c, brown→#92400e, brownish→#78350f, warm→#b45309, coffee→#4a2c1a, caramel→#c47a2b, chocolate→#3d1c06, tan→#d97706, sandy→#c4a35a, earthy→#7c5c2e, beige→#d4b896, cream→#f5f0e8, rust→#b45309, amber→#d97706, copper→#c47a2b.
6. If the request is ambiguous or unknown, set intent to "unknown" and confidence below 0.5.
7. For `content-text` edits, the `field` value must exactly match a key visible in the provided site-content.ts snippet. Do not invent field paths.
8. For `css-var` edits, the `var` value must match a variable name visible in the provided :root block.
9. Max 3 edits per response. If the user asked for more, pick the most specific 3.
10. ANY request that mentions a component + a color (e.g. "make navbar white", "hero background dark", "buttons red") MUST be classified as `css-patch` with `agent: "direct"`. NEVER classify a pure color change as `style-tweak` — that tier is only for structural/layout changes like "center the hero", "make buttons pill-shaped", "add padding".
11. When a user says "make [X] [color]" and [X] maps to a CSS variable (see SOUL.md component→variable table), emit a `css-var` edit for that variable. Do not route to uiux.
12. NEVER patch `--color-text` when the user targets a specific zone (navbar, hero). Use the zone-specific variable: navbar text → `--color-nav-text`, hero text → `--color-hero-text`. Only use `--color-text` when the user says "all text", "every text", or "body text" with no zone qualifier.
