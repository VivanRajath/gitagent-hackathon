# Runbook

Step-by-step instructions for setting up, running, and using the system.

---

## Prerequisites

- **Node.js** 18+ and npm
- **Groq API Key** — get one at [console.groq.com](https://console.groq.com)
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
GROQ_API_KEY=gsk_your_key_here
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

Type a prompt:
```
you> create a cyberpunk themed portfolio website
```

The terminal will show the agent pipeline executing:
```
[ARCHITECT ] Architect analyzing — planning build…
[ARCHITECT ] Generating website content…
[SNR-DEV   ] Wrote site-content.ts
[SNR-DEV   ] Wrote globals.css :root
[PREVIEW   ] Launched at http://localhost:3000
```

Open `http://localhost:3000` in your browser to see the generated site.

---

## 5. Edit with Gestures & Voice

### Enter Edit Mode
- Click the **✏️ OPEN SPATIAL EDITOR** button in the bottom-right corner of the site, or
- Navigate directly to `http://localhost:3000/?edit=1`

### Authorize Camera & Mic
The browser will prompt for camera and microphone access. Accept both.

Wait 3-5 seconds for the gesture model to load. You'll see:
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
- **Two-finger scroll** (touch) → Scrolls the page.
- **Pinch** (touch, with element selected) → Opens edit context menu (Edit Text, Redesign, Change Color).

---

## 6. Edit Any Local Codebase

The agent isn't restricted to just the generated site! It has a generalized `file_read` and `file_write` engine that allows you to point it at any relative or absolute path on your machine.

**Example Usage**:
1. Find a script on your machine you want to modify.
2. In the REPL, paste the absolute path and your instruction:

```
you> C:\Users\Vivan Rajath\Desktop\repo\sandbox-test-python\main.py please edit this file to add a new route /gitclaw that prints out "hello"
```

The orchestrator will:
1. Classify the intent as `feature` or `fix`.
2. Dispatch `snr-developer`.
3. Use `file_read` to ingest the pure code without hallucinating file locations.
4. Synthesize the diff and write explicitly to the absolute path correctly, un-escaping multi-line outputs seamlessly.

---

## 7. REPL Commands

| Command | Description |
|---|---|
| `/skills` | Lists all 19 available skills |
| Any text | Sent to the agent orchestrator for processing |
| `Ctrl+C` | Exit |

---

## 8. Troubleshooting

| Issue | Cause | Fix |
|---|---|---|
| `Export SITE doesn't exist` | Groq API rate limit interrupted generation mid-write | Wait 30 seconds, restart `node index.js`, try again |
| `Camera blocked` | Browser denied webcam access | Click the 🔒 icon in the address bar → allow camera |
| `Gesture load error` | MediaPipe CDN failed to load | Check your internet connection; the model is ~5MB |
| `Mic error: not-allowed` | Browser denied microphone access | Click 🔒 → allow microphone, or use Spacebar PTT instead |
| Components not rendering | LLM hallucinated bad imports | Check `memory/known-errors.md` for learned rules; restart agent |
