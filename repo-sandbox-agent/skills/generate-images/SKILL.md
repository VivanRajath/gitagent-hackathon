---
name: generate-images
description: >
  Dispatches the image-gen-agent to create custom AI-generated images via
  Pollinations.ai and produce CSS keyframe animations tailored to the site theme.
  Always invoked by architect-website after find-resources completes. Returns
  image URLs and animation CSS strings ready to inject into components.
allowed-tools: http_get, file_read
---

# Generate Images Skill

## Purpose
This skill runs the **image-gen-agent** pipeline. It generates:
1. **AI Images** — via Pollinations.ai free image generation API (no key needed)
2. **CSS Animations** — pure CSS @keyframes tailored to the site's visual theme

It is called by `architect-website` after `find-resources` has returned.
The architect provides image specs and the animation list; this skill returns URLs + CSS.

## Trigger
Called by architect with an image generation spec:
```json
{
  "theme": "<string>",
  "vibe": "<string>",
  "images": [
    {
      "zone": "hero",
      "prompt_intent": "<natural language description of what the image should show>",
      "width": 1920,
      "height": 1080,
      "style": "<cinematic|digital art|photorealistic|concept art|watercolor>"
    }
  ],
  "animations": ["flicker", "float", "fade-in-up", "glitch-text", "red-pulse", "scan-lines"]
}
```

## Steps

### Step 1 — Announce
```
[orchestrator → image-gen-agent] Generating AI visuals for theme: <theme>
  → <count> images / <animation_count> animations
```

### Step 2 — Build Pollinations Image URLs

For each image spec:
1. Take `prompt_intent` and append style keywords: `prompt_intent + ", " + style + ", " + vibe`
2. Encode the full prompt string: replace spaces with `+`, encode special chars
3. Compute seed: `theme.charCodeAt(0) * 1000 + theme.length * 17` (integer)
4. Build URL:
   ```
   https://image.pollinations.ai/prompt/<encoded-prompt>?width=<w>&height=<h>&nologo=true&seed=<seed>
   ```
5. Write descriptive alt text (describe what the image shows, not the prompt)

**IMPORTANT — Copyright-safe prompting:**
- ✅ Describe aesthetic, era, mood, composition, lighting
- ❌ Never name: characters, actors, brands, shows, movies, games, songs
- ✅ "dark foggy 1980s American small town at night, atmospheric streetlights, cinematic horror"
- ❌ "Hawkins Indiana from Stranger Things with Eleven"

### Step 3 — Select Animations for Theme

Map theme vibe to animation set:

| Vibe | Recommended Animations |
|---|---|
| dark / horror | flicker, red-pulse, fade-in-up, scan-lines |
| sci-fi / cyber | glitch-text, scan-lines, fade-in-up, float |
| retro / 80s | flicker, fade-in-up, float |
| nature / organic | float, fade-in-up |
| minimal / corporate | fade-in-up |
| fantasy | float, fade-in-up, glitch-text |

### Step 4 — Write CSS Animations

Generate a complete CSS block for all requested animations.
Each animation definition:
```css
/* === <name> === */
@keyframes <name> {
  /* keyframes */
}
.<utility-class> {
  animation: <name> <duration> <easing> <iteration>;
}
@media (prefers-reduced-motion: reduce) {
  .<utility-class> { animation: none; }
}
```

**Standard animation library** (copy verbatim, do not modify keyframes):

```css
/* === flicker === */
@keyframes flicker {
  0%,100%{opacity:1} 41%{opacity:0.9} 42%{opacity:0.35} 43%{opacity:0.9}
  90%{opacity:0.95} 91%{opacity:0.5} 92%{opacity:0.95}
}
.flicker { animation: flicker 3s linear infinite; }
@media (prefers-reduced-motion: reduce) { .flicker { animation: none; } }

/* === float === */
@keyframes float {
  0%,100%{transform:translateY(0px)} 50%{transform:translateY(-14px)}
}
.float { animation: float 5s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) { .float { animation: none; } }

/* === glitch-text === */
@keyframes glitch {
  0%{text-shadow:2px 0 #f00,-2px 0 #0ff,0 0 0 transparent}
  20%{text-shadow:-3px 0 #f00,3px 0 #0ff}
  40%{text-shadow:2px 0 transparent}
  60%{text-shadow:-3px 0 #f00,3px 0 #0ff}
  80%{text-shadow:2px 0 #f00,-2px 0 #0ff}
  100%{text-shadow:none}
}
.glitch { animation: glitch 2.5s steps(1) infinite; }
@media (prefers-reduced-motion: reduce) { .glitch { animation: none; } }

/* === fade-in-up === */
@keyframes fadeInUp {
  from{opacity:0;transform:translateY(28px)}
  to{opacity:1;transform:translateY(0)}
}
.fade-in-up { animation: fadeInUp 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
.fade-in-up-delay-1 { animation: fadeInUp 0.7s 0.15s cubic-bezier(0.22, 1, 0.36, 1) forwards; opacity:0; }
.fade-in-up-delay-2 { animation: fadeInUp 0.7s 0.3s cubic-bezier(0.22, 1, 0.36, 1) forwards; opacity:0; }
.fade-in-up-delay-3 { animation: fadeInUp 0.7s 0.45s cubic-bezier(0.22, 1, 0.36, 1) forwards; opacity:0; }
@media (prefers-reduced-motion: reduce) { .fade-in-up,.fade-in-up-delay-1,.fade-in-up-delay-2,.fade-in-up-delay-3 { animation: none; opacity:1; } }

/* === red-pulse === */
@keyframes redPulse {
  0%,100%{box-shadow:0 0 0 0 rgba(204,0,0,0.5)}
  70%{box-shadow:0 0 0 16px rgba(204,0,0,0)}
}
.red-pulse { animation: redPulse 2.2s ease-out infinite; }
@media (prefers-reduced-motion: reduce) { .red-pulse { animation: none; } }

/* === scan-lines (overlay) === */
.scan-lines::after {
  content:'';
  position:absolute;inset:0;
  background:repeating-linear-gradient(
    transparent,transparent 2px,
    rgba(0,0,0,0.08) 2px,rgba(0,0,0,0.08) 4px
  );
  pointer-events:none;
  z-index:1;
}

/* === neon-glow === */
@keyframes neonGlow {
  0%,100%{text-shadow:0 0 5px currentColor,0 0 10px currentColor,0 0 20px currentColor}
  50%{text-shadow:0 0 10px currentColor,0 0 25px currentColor,0 0 50px currentColor}
}
.neon-glow { animation: neonGlow 2s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) { .neon-glow { animation: none; } }
```

### Step 5 — Return Output
Return the full image-gen output JSON (see image-gen-agent DUTIES.md §Output Contract).

Announce:
```
[image-gen-agent → architect] Visuals ready.
  → <count> AI images generated
  → <animation_count> CSS animations defined
```

## Output MUST include
- `generated[]` — array of { url, alt, zone, prompt }
- `animations[]` — array of { name, css, usage, description }

## Fallback
If architect has not provided specific `prompt_intent`, synthesize it from:
`"<theme> themed <zone> image, <vibe> mood, <style> style"`

Always produce output — never return an empty or error-only response.
