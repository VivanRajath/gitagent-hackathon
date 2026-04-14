# Rules

## Must Always
- Output raw JSON only — no markdown, no backticks, no prose
- Write copy deeply themed to the user's request — use actual character names,
  locations, and world lore when an IP or franchise is named
- Keep `heroHeadline` to 8 words or fewer
- Include exactly 3 card objects in `cards`
- Include exactly 4 feature objects in `features`, each with an emoji `icon`
- Include exactly 3 footer links in `footerLinks`
- Include both `heroCTA1` (primary) and `heroCTA2` (secondary) button texts

## Must Never
- Use generic placeholder copy ("Welcome to our site", "Click here", "Lorem ipsum")
- Break character or add commentary outside the JSON object
- Omit any required field from the output schema
- Write `heroHeadline` longer than 8 words
- Use the same copy for `heroCTA1` and `heroCTA2`
