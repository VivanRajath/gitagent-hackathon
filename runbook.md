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

The terminal will show the five-stage pipeline executing:
```
[ORCHESTRATOR] Intent classified: "website" — routing…
[RESEARCH    ] Site type: landing | Variants: navbar=2 hero=0 cards=2 | Palette: bg=#0a0a0a primary=#39ff14
[RESOURCER   ] Image theme: "Hulk gamma radiation green smash destruction" | Seeds: 73841, 21934… | refinedPalette: {…}
[UIUX        ] Brand: "Gamma Protocol" | Headline: "You Won't Like Me When I'm Angry"
[IMAGE-GEN   ] Gemini ⟶ hero: "hulk gamma radiation green smash cityscape cinematic"
[IMAGE-GEN   ] ✅ Gemini saved → /images/hero.jpg
[IMAGE-GEN   ] ✅ Pollinations saved → /images/card-0.jpg
[ARCHITECT   ] 5 variants generated | recommended: variant-2 "Gamma Strike"
[ARCHITECT   ] ✅ globals.css updated with recommended palette
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

**SpatialVoiceOverlay (hold-to-talk, in edit mode):**
- **Hold** the **🎙 HOLD TO SPEAK** button (or hold **Spacebar**)
- Speak your edit: "Make this heading more dramatic" / "Change the background to dark blue"
- Release to send the command to the agent pipeline
- Live transcript appears while you speak — you don't need to wait for silence

**VoiceEditButton (floating mic, always visible):**
- **Tap** the purple 🎤 button in the bottom-right corner of the site
- Speak your CSS change — the button pulses red while listening
- The site auto-refreshes once the edit is applied (via `[reload]` signal)

**Zone-specific voice examples:**

| Say | What changes |
|---|---|
| "change navbar text to white" | `--color-nav-text` only |
| "make the hero text darker" | `--color-hero-text` only |
| "change all text to black" | `--color-text` (global) |
| "make the background navy" | `--color-bg` |
| "change primary color to orange" | `--color-primary` |
| "change the font to Georgia" | `--font-display` |

> **Tip:** Be specific about the zone ("navbar text", "hero text"). Saying just "change text to white" triggers the global `--color-text` which affects body/card copy too.

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

## 7. Voice-Edit Pipeline (How It Works)

When you speak a change via either the SpatialVoiceOverlay or VoiceEditButton, the command goes to `POST /voice-edit` — a separate, fast path that does **not** rebuild the site:

```
Speech → Web Speech API → text
  ↓
POST /voice-edit { prompt: "change navbar text to white" }
  ↓
[Stage 1] voice-intent agent
  → Returns: { edits: [{ field: "--color-nav-text", value: "#ffffff" }], agentRequired: "direct" }
  ↓
[Stage 2] scope-validator agent
  → Validates fields against allowed CSS variable list
  → Returns: { approved: true, safeEdits: [...] }
  ↓
[Stage 3] dispatchVoiceEdit
  → Writes CSS variable to globals.css
  → Streams [reload] signal to browser
  ↓
Browser receives [reload] → auto-refreshes after 900 ms
```

**For complex text/layout changes** (`agentRequired: "uiux"` or `"jnr-dev"`), the pipeline routes to the code-editor squad instead of patching CSS directly.

---

## 9. Validate gitagent Compliance

```bash
npm run validate    # npx gitagent validate
npm run info        # npx gitagent info
```

---

## 10. REPL Commands

| Command | Description |
|---|---|
| `create a [theme] website` | Triggers the five-stage website-builder pipeline |
| `/skills` | Lists all 19 available skills |
| Any text | Sent to the agent orchestrator for processing |
| `Ctrl+C` | Exit |

---

## 11. Troubleshooting

| Issue | Cause | Fix |
|---|---|---|
| `SYSTEM.md not found for agent` | Agent not yet migrated to gitagent standard | Ensure the agent directory has `SOUL.md`; `loadAgentSystem()` composes from SOUL + RULES + SKILL |
| `Export SITE doesn't exist` | Groq API rate limit interrupted generation mid-write | Wait 30 seconds, restart `node index.js`, try again |
| Images all fall back to Pollinations | `GEMINI_API_KEY` not set or invalid | Add `GEMINI_API_KEY=AIza...` to `.env` and restart |
| `Camera blocked` | Browser denied webcam access | Click the 🔒 icon in the address bar → allow camera |
| `Gesture load error` | MediaPipe CDN failed to load | Check internet connection; the model is ~5 MB |
| `Mic error: not-allowed` | Browser denied microphone access | Click 🔒 → allow microphone, or use Spacebar PTT instead |
| "Nothing heard" / mic not detecting speech | Web Speech API in Chrome returns very low confidence scores (0.0–0.3 even for clear speech) | The confidence gate has been removed — just speak clearly; live transcript should appear. If still silent, check mic permissions. |
| Voice edit says "Done" but site doesn't change | `scope-validator` returned empty `safeEdits` | The pipeline now falls back to `intent.edits` directly — if still failing, check agent logs for `[BLOCKED]` lines |
| CSS applied but site didn't update visually | Next.js HMR on Windows misses external `writeFileSync` | Site auto-reloads after 900 ms via `[reload]` signal — if it doesn't, manually refresh the browser |
| Components not rendering | LLM hallucinated bad imports | Check `memory/known-errors.md` for learned rules; restart agent |
| `All Groq keys exhausted` / rate limit errors | All keys in key pool hit rate limits simultaneously | The runtime auto-falls back from `llama-3.3-70b-versatile` → `llama-4-scout-17b-16e` — this is expected and handled. Add more `GROQ_API_KEY_N` entries if fallback also exhausts. |
| Generated site always has dark theme | Research agent used to default to dark | Fixed — palettes are now intent-driven. "coffee shop" → warm cream, "hulk" → dark green. If still wrong, delete `.env` cached state and retry. |
