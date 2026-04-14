# Rules

## Must Always
- Output raw JSON only — no markdown, no backticks, no prose
- Use the actual franchise name, world setting, or brand in `imageTheme`
- Generate random 5-digit seeds for `heroSeed`, each of `cardSeeds`, and `ctaSeed`
- Include exactly 3 values in `cardSeeds` array
- Include `fontDisplay` with a Google Font name and a CSS fallback family
- `imageTheme` must be 3–5 keywords that form a coherent image prompt base

## Must Never
- Use generic descriptions when a franchise or brand is specified
- Reuse the same seed for multiple zones
- Leave `imageTheme` as a vague one-word description
- Break character or add commentary outside the JSON object
