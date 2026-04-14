# Runbook

Step-by-step instructions for setting up, running, and using the system.

---

## Prerequisites

- **Node.js** 20+ and npm
- **Groq API Key** — get one at [console.groq.com](https://console.groq.com)
- **Gemini API Key** (optional) — enables Gemini Imagen 3 for AI image generation; falls back to Pollinations.ai if absent
- **Webcam** (optional) — required for hand-gesture tracking in edit mode
- **Microphone** (optional) — required for voice-to-DOM editing
- **Browser** — Chromium-based (Chrome, Edge, Brave) for MediaPipe WebGPU support

---

## 1. Install

```bash
cd repo-sandbox-agent
npm install
```

---

## 2. Configure

Create a `.env` file in `repo-sandbox-agent/`:

```bash
# Required
GROQ_API_KEY=gsk_your_key_here

# Optional — key pool (rotate across up to 5 keys for rate limit headroom)
GROQ_API_KEY_1=gsk_key_one
GROQ_API_KEY_2=gsk_key_two
GROQ_API_KEY_3=gsk_key_three

# Optional — enables Gemini Imagen 3 for higher-quality AI images
# Without this key, image generation falls back to Pollinations.ai automatically
GEMINI_API_KEY=AIza_your_key_here
```

You can copy the example:
```bash
cp .env.example .env
```

---

## 3. Run

```bash
node index.js
```

You will see the interactive REPL:
```
you>
```

---

## 4. Generate a Website

Type a natural-language prompt:
```
you> create a hulk themed website
you> create a cyberpunk portfolio website
you> create a one piece anime fan site
```

The terminal will show the four-stage pipeline executing:
```
[ORCHESTRATOR] Intent classified: "website" — routing…
[RESEARCH    ] Site type: landing | Variants: navbar=2 hero=0 cards=2
[RESOURCER   ] Image theme: "Hulk gamma radiation green smash destruction" | Seeds: 73841, 21934…
[UIUX        ] Brand: "Gamma Protocol" | Headline: "You Won't Like Me When I'm Angry"
[IMAGE-GEN   ] Gemini ⟶ hero: "hulk gamma radiation green smash cityscape cinematic"
[IMAGE-GEN   ] ✅ Gemini saved → /images/hero.jpg
[IMAGE-GEN   ] ✅ Pollinations saved → /images/card-0.jpg
[PREVIEW     ] Site ready at http://localhost:3001
```

Open `http://localhost:3001` in your browser to see the generated site.

### Image Generation Tiers

The image pipeline tries each tier in order:

| Tier | Service | Requires |
|---|---|---|
| 1 (primary) | Gemini Imagen 3 | `GEMINI_API_KEY` in `.env` |
| 2 (fallback) | Pollinations.ai download | Nothing — free |
| 3 (last resort) | Pollinations.ai URL | Nothing — free |
| Client-side | Puter.js `puter.ai.txt2img()` | Puter account (browser only) |

---

## 5. Edit with Gestures & Voice

### Enter Edit Mode
- Click the **✏️ OPEN SPATIAL EDITOR** button in the bottom-right corner of the site, or
- Navigate directly to `http://localhost:3001/?edit=1`

### Authorize Camera & Mic
The browser will prompt for camera and microphone access. Accept both.

Wait 3–5 seconds for the gesture model to load. You'll see:
- `"Loading gesture model…"` → `"✌️ Gesture tracking ready!"`
- A small camera preview thumbnail appears in the bottom-right corner

### Voice Commands
- **Hold** the **🎙 HOLD TO SPEAK** button (or hold **Spacebar**)
- Speak your edit: "Make this heading more dramatic" / "Change the background to dark blue"
- Release to send the command to the agent pipeline

### Hand Gestures
- **Peace Sign ✌️** → Opens the color slider. Move your hand left/right to shift the site's hue. Drop your hand to apply.
- **Click** any element → Selects it (orange highlight). Speak to edit the selected element in context.
- **Double-click** → Deletes the element.
- **Pinch** (with element selected) → Opens edit context menu (Edit Text, Redesign, Change Color).

---

## 6. Edit Any Local Codebase

The agent can edit any file on your machine — not just the generated site.

```
you> C:\Users\Vivan Rajath\Desktop\repo\sandbox-test-python\main.py add a /health route that returns {"status":"ok"}
```

The orchestrator will:
1. Classify the intent → dispatch `snr-developer` or `jnr-developer`
2. Use `file_read` to ingest the file
3. Synthesize the diff and write to the absolute path via `file_write`

---

## 7. Validate gitagent Compliance

```bash
npm run validate    # npx gitagent validate
npm run info        # npx gitagent info
```

---

## 8. REPL Commands

| Command | Description |
|---|---|
| `create a [theme] website` | Triggers the four-stage website-builder pipeline |
| `/skills` | Lists all 19 available skills |
| Any text | Sent to the agent orchestrator for processing |
| `Ctrl+C` | Exit |

---

## 9. Troubleshooting

| Issue | Cause | Fix |
|---|---|---|
| `SYSTEM.md not found for agent` | Agent not yet migrated to gitagent standard | Ensure the agent directory has `SOUL.md`; `loadAgentSystem()` composes from SOUL + RULES + SKILL |
| `Export SITE doesn't exist` | Groq API rate limit interrupted generation mid-write | Wait 30 seconds, restart `node index.js`, try again |
| Images all fall back to Pollinations | `GEMINI_API_KEY` not set or invalid | Add `GEMINI_API_KEY=AIza...` to `.env` and restart |
| `Camera blocked` | Browser denied webcam access | Click the 🔒 icon in the address bar → allow camera |
| `Gesture load error` | MediaPipe CDN failed to load | Check internet connection; the model is ~5 MB |
| `Mic error: not-allowed` | Browser denied microphone access | Click 🔒 → allow microphone, or use Spacebar PTT instead |
| Components not rendering | LLM hallucinated bad imports | Check `memory/known-errors.md` for learned rules; restart agent |
| `All Groq keys exhausted` | All keys in key pool hit rate limits | Wait ~60 seconds for limits to reset; add more `GROQ_API_KEY_N` entries |
