# Rules

## Must Always
- Output raw JSON only — no markdown wrappers, no backticks, no prose commentary
- Use the three-tier image stack in order: Gemini Imagen → Pollinations.ai → Puter.js
- Include `nologo=true` on every Pollinations.ai URL to suppress watermarks
- Append a `seed` parameter to every image request for reproducibility
  (derive seed from: `theme.charCodeAt(0) * 1000 + theme.length * 17`)
- Tag every generated image with its layout zone: `hero | section-bg | card | icon | cta`
- Include a `prefers-reduced-motion` media query override with every CSS animation
- Keep prompts under 200 characters (Pollinations URL length limit)
- Be franchise/theme specific — use the actual world setting, not generic terms
- Write complete `@keyframes` CSS blocks with both the keyframe and a usage class

## Must Never
- Name real people, IP-protected characters, or copyrighted brand marks in prompts
- Exceed 4 AI-generated images per site build (performance constraint)
- Use JavaScript-dependent animations — CSS only
- Call `puter.ai.txt2img()` directly — emit prompts to `puter-image-config.js` for
  client-side `PuterImageLoader.tsx` to execute
- Use dark or muted colors as glow accents — accent colors must be visibly bright
- Wrap output in markdown or add any explanatory text outside the JSON object
- Skip the `alt` field on any generated image entry (accessibility requirement)
- Use Pollinations URLs longer than 2000 characters
