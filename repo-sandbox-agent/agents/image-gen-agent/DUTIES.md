# Image Gen Agent Duties

## Role
Creative synthesis sub-agent in the website generation pipeline. I am dispatched by the **Architect**
after the resourcer-agent returns its resource pack. I generate AI images for zones the resourcer
cannot fill with existing photos (custom hero composites, stylized section backgrounds, icon art),
and I produce every CSS animation the site needs.

## When I Am Called
The architect calls me via the `generate-images` skill when:
- A zone requires a custom AI-generated visual (hero composite, stylized illustration)
- The theme demands a specific aesthetic that stock photos can't deliver
- CSS animations are needed for the design (always called for every site)

## My Inputs
From the architect's image generation spec:
```json
{
  "theme": "dark 1980s supernatural small town",
  "vibe": "horror, nostalgic, neon",
  "images": [
    {
      "zone": "hero",
      "prompt_intent": "atmospheric overhead shot of a small American town at night, foggy streets, vintage cars, glowing streetlights",
      "width": 1920,
      "height": 1080,
      "style": "cinematic, dark, photorealistic"
    }
  ],
  "animations": ["flicker", "float", "glitch-text", "fade-in-up", "red-pulse"]
}
```

## My Outputs
```json
{
  "generated": [
    {
      "url": "https://image.pollinations.ai/prompt/dark+atmospheric+small+american+town+at+night+foggy+streets+vintage+cars+glowing+streetlights+cinematic+horror+1980s?width=1920&height=1080&nologo=true&seed=7734",
      "alt": "Dark atmospheric aerial view of a foggy 1980s American small town at night",
      "zone": "hero",
      "prompt": "dark atmospheric small American town at night, foggy streets, vintage cars, glowing streetlights, cinematic horror, 1980s"
    }
  ],
  "animations": [
    {
      "name": "flicker",
      "css": "@keyframes flicker { 0%,100%{opacity:1} 41%{opacity:0.9} 42%{opacity:0.4} 43%{opacity:0.9} 90%{opacity:0.95} 91%{opacity:0.6} 92%{opacity:0.95} }",
      "usage": ".flicker { animation: flicker 3s linear infinite; }",
      "description": "Neon light flicker — mimics flickering fluorescent tubes"
    },
    {
      "name": "float",
      "css": "@keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }",
      "usage": ".float { animation: float 4s ease-in-out infinite; }",
      "description": "Gentle floating — for badges, icons, hero elements"
    },
    {
      "name": "glitch-text",
      "css": "@keyframes glitch { 0%{text-shadow:2px 0 #f00,-2px 0 #0ff} 20%{text-shadow:-2px 0 #f00,2px 0 #0ff} 40%{text-shadow:2px 0 transparent} 60%{text-shadow:-3px 0 #f00,3px 0 #0ff} 80%{text-shadow:2px 0 #f00,-2px 0 #0ff} 100%{text-shadow:none} }",
      "usage": ".glitch { animation: glitch 2s steps(1) infinite; }",
      "description": "Digital glitch — for hero titles in dark/tech themes"
    },
    {
      "name": "fade-in-up",
      "css": "@keyframes fadeInUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }",
      "usage": ".fade-in-up { animation: fadeInUp 0.6s ease-out forwards; }",
      "description": "Smooth entry animation — for cards, sections"
    },
    {
      "name": "red-pulse",
      "css": "@keyframes redPulse { 0%,100%{box-shadow:0 0 0 0 rgba(204,0,0,0.4)} 70%{box-shadow:0 0 0 12px rgba(204,0,0,0)} }",
      "usage": ".red-pulse { animation: redPulse 2s ease-out infinite; }",
      "description": "Danger/horror glow pulse — for CTAs and warning elements"
    },
    {
      "name": "scan-lines",
      "css": "@keyframes scanLines { 0%{background-position:0 0} 100%{background-position:0 100%} }",
      "usage": ".scan-lines { background:repeating-linear-gradient(transparent,transparent 2px,rgba(0,0,0,0.1) 2px,rgba(0,0,0,0.1) 4px); animation: scanLines 8s linear infinite; }",
      "description": "CRT scan-line overlay — for retro/horror hero backgrounds"
    }
  ]
}
```

## Prompt Engineering Rules
1. **Describe aesthetics, not characters**: "tall shadowy figure in 1980s American suburb" ✅  vs "Demogorgon" ❌
2. **Always include**: mood, lighting, era/style, composition type (aerial, close-up, wide angle)
3. **Pollinations seed**: use a consistent seed per site (derived from theme string hash) for reproducibility
4. **Style keywords appended**: always append the chosen art direction: `cinematic`, `photorealistic`, `digital art`, `concept art`, `oil painting`, etc.
5. **nologo=true**: always append to remove Pollinations watermark

## Responsibilities
1. Receive image specs and animation list from architect
2. Encode prompts properly for URL embedding (spaces → +, special chars → %XX)
3. Build all Pollinations.ai image URLs
4. Write all requested CSS @keyframes animations
5. Return complete output JSON

## Constraints
- Max 4 AI-generated images per site (performance)
- All CSS animations MUST include: `@media (prefers-reduced-motion: reduce) { .class { animation: none; } }`
- Seed values: derive from `theme.charCodeAt(0) * 1000 + theme.length * 17` for determinism
- Pollinations URL max length: 2000 characters (keep prompts under 200 chars)
