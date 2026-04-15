# Architecture

This document is a complete technical reference to every agent, sub-agent, skill, tool, pipeline, and runtime layer that constitutes the `repo-sandbox-agent` system. The system is built to the [gitagent](https://github.com/open-gitagent/gitagent) standard (`spec_version: 0.1.0`) and executed by the [gitclaw](https://github.com/open-gitagent/gitclaw) SDK.

---

## 1. System Overview

The system operates in two modes:

**Code-editing mode** — a tiered, cost-aware multi-agent orchestrator that classifies natural-language edit requests by complexity and delegates to the cheapest sub-agent capable of handling them. A typo fix should never consume architect-tier tokens.

**Website-building mode** — a five-stage AI pipeline (`website-builder`) that turns a one-line user request into a fully themed, live-reloading Next.js site. Images are generated through a three-tier stack: **Gemini Imagen 3** (primary) → **Pollinations.ai** (fallback) → **Puter.js** (client-side).

**Voice-edit mode** — a real-time, three-stage pipeline that classifies spoken commands into structured CSS/content patches and applies them directly or routes them to the UIUX/JNR-DEV agent. Changes trigger an automatic browser reload so edits are always visible immediately.

The orchestrator coordinates **23 distinct agent personas** organized into **6 squads**, backed by **19 composable skills**, **4 declarative tools**, and a **git-committed memory layer** that learns from its own mistakes across sessions.

---

## 2. Full Agent Hierarchy

```
repo-sandbox-agent  (Orchestrator)
│
├── guardrails  (Safety Orchestrator)
│   ├── policy-enforcer      — reads RULES.md, issues ALLOW/BLOCK on every tool dispatch
│   ├── secret-sentinel      — blocks .env, *.pem, *.key; scans diffs for leaked credentials
│   ├── diff-auditor         — pre-write safety: mass deletions, eval injection, auth removal
│   └── scope-validator (build)  — validates tier assignment; prevents underflow and overflow
│
├── voice-intent             — stage 1 of voice pipeline: classifies spoken command → structured JSON
├── scope-validator (voice)  — stage 2 of voice pipeline: audits intent, strips unsafe edits, writes constrainedPrompt
│
├── research-agent  (Search Orchestrator)
│   ├── github-searcher      — GitHub repos, code, issues
│   ├── devpost-searcher     — Devpost hackathon projects
│   ├── web-searcher         — general web fallback when GitHub+Devpost yield < 3 results
│   └── solution-proposer    — aggregates all results → actionable proposal
│
├── resourcer-agent          — image theme phrase, per-zone seeds, font, refined color palette
│
├── image-gen-agent          — AI image prompts + CSS @keyframes animations
│   └── skills/generate-images
│         ├── Gemini Imagen 3  (primary — POST imagen-3.0-generate-002, base64 → disk)
│         ├── Pollinations.ai  (fallback — download → disk, or URL direct)
│         └── Puter.js config  (client-side — written to puter-image-config.js)
│
├── website-builder  (Website Generation Pipeline Orchestrator)
│   ├── research-agent       — design DNA: site type, intent-driven palette, variants, image keywords
│   ├── resourcer-agent      — image theme phrase, per-zone seeds, font, refinedPalette
│   └── uiux-agent           — all site copy: nav, hero, cards, features, CTA, footer
│
└── code-editor  (Edit Orchestrator)
    ├── jnr-developer        — single-file edits, cheap models, no shell
    ├── snr-developer        — multi-file features, standard models; receives fix reports from site-tester
    ├── architect            — system-level changes, top-tier models, read-only shell;
    │                          also generates 5 color variants + chooses active theme
    ├── uiux-designer        — all UI/UX; wired to voice-edit pipeline for constrained CSS/content patches
    │   └── canvas-editor    — MediaPipe + tldraw browser canvas (localhost:3000)
    └── site-tester          — screenshot QA → snr-developer fix loop (max 3 cycles)
```

> **Note on name overlap:** `website-builder/research-agent` extracts design parameters
> (palette, variants, aesthetic). The top-level `research-agent` does web search and
> code lookup. Same distinction applies to `resourcer-agent` and `scope-validator`.

---

## 3. Agent Definitions (In Depth)

Every agent follows the gitagent standard. Each directory contains:
- `agent.yaml` — manifest: `spec_version`, name, model, skills list, tags
- `SOUL.md` — identity, personality, expertise, communication style
- `RULES.md` — must-always / must-never hard constraints
- `skills/<name>/SKILL.md` — YAML frontmatter (`name`, `description`, `allowed-tools`) + execution instructions

`loadAgentSystem()` in `index.js` composes the system prompt by joining SOUL.md + RULES.md + all skills/*/SKILL.md (frontmatter stripped). Falls back to legacy `SYSTEM.md` if `SOUL.md` is absent.

---

### 3.1 The Orchestrator (`repo-sandbox-agent`)

**Identity**: Top-level coordinator. Classifies user intent via `classifyIntent` in `index.js` and routes to the correct parent agent.

**Model**: `groq:meta-llama/llama-4-scout-17b-16e-instruct` (preferred), fallback to `groq:llama-3.3-70b-versatile`.

**Intent Classification** (`classifyIntent`):
| Intent | Trigger Pattern | Target |
|---|---|---|
| `website` | "create", "build", "theme", "make", pinch-edit, swipe, delete-node | Website generation pipeline |
| `visual` | "visual editor", "canvas", "hand draw", "edit visually" | Canvas editor |
| `arch` | "refactor", "redesign", "restructure", "migrate", "overhaul" | Architect agent |
| `fix` | "fix", "debug", "repair", "broken", "error", "crash", "bug" | Fix pipeline |
| `feature` | "add", "implement", "extend", "new route", "integrate" | Feature pipeline |
| `chat` | Everything else | Conversational fallback |

> Note: `[agent-bridge]` prefixed prompts and `jnr-developer` persona prompts are routed as `feature` and never become website builds, preventing voice-edit commands from accidentally triggering full rebuilds.

**API Server** (`localhost:3002`):
| Endpoint | Method | Purpose |
|---|---|---|
| `/command` | POST | General code-edit REPL over HTTP (used by legacy clients) |
| `/voice-edit` | POST | 3-stage voice pipeline: VOICE-INTENT → SCOPE-VALIDATOR → dispatchVoiceEdit |
| `/key-status` | GET | Key pool health: which orgs are ready / cooling |

---

### 3.2 The Guardrails Squad

**Purpose**: Interceptor layer that sits between the orchestrator and all executing subsystems. Invoked before every `file_write`, `shell_exec`, and sub-agent dispatch.

A single BLOCK from any sub-agent halts the entire action.

#### 3.2.1 `policy-enforcer`
Reads `RULES.md` at invocation time (never cached). Returns ALLOW or BLOCK with a specific rule citation. Cannot be overridden.

#### 3.2.2 `secret-sentinel`
Blocks `.env`, `secrets.*`, `*.pem`, `*.key`, `*.p12`, `*.pfx`. Pattern-matches diffs for `password=`, `api_key=`, `token=`, `-----BEGIN`, etc. Paranoid by design.

#### 3.2.3 `diff-auditor`
Pre-write safety review. Catches `eval()`/`exec()` injection, auth removal, mass deletions, SQL injection, XSS. Never approves diffs that remove auth checks or exceed 30% deletion without architect confirmation.

#### 3.2.4 `scope-validator` (build mode)
Routing integrity for the code-editor. Verdicts: `ALLOW`, `ESCALATE` (scope underflow — safety risk), `DOWNGRADE` (scope overflow — cost recommendation). Two-tier underflow is always ESCALATE.

---

### 3.3 The Voice-Edit Pipeline Agents

The voice-edit pipeline runs exclusively on `POST /voice-edit`. It is a **3-stage, no-tool-calling pipeline** — all three agents return raw JSON only, no file writes.

#### Stage 1 — `voice-intent` (`agents/voice-intent/`)

**Purpose**: Classifies a raw voice command into a structured JSON intent.

**Output format**:
```json
{
  "intent": "css-patch | content-patch | style-tweak | feature-add | build | unknown",
  "confidence": 0.0–1.0,
  "agent": "direct | uiux | jnr-dev | full-pipeline",
  "edits": [
    { "type": "css-var",      "var": "--css-variable-name", "value": "#hex" },
    { "type": "content-text", "field": "dot.path.to.field", "value": "new text" }
  ],
  "description": "human-readable summary",
  "scope": ["globals.css", "site-content.ts"]
}
```

**Component → CSS variable mapping**:
| What user says | CSS variable |
|---|---|
| navbar text / navbar links / nav links / menu items | `--color-nav-text` |
| hero text / hero body / hero subtext | `--color-hero-text` |
| hero headline / hero title | `--color-secondary` |
| buttons / primary button / CTA button | `--color-primary` |
| accent / secondary color | `--color-secondary` |
| background / page background | `--color-bg` |
| all text / body text / every text | `--color-text` |
| brand color / logo color | `--color-secondary` |

**Hard rules**:
- Color changes targeting a named zone (navbar, hero) always use the zone-specific variable, never `--color-text`.
- `css-patch/direct` for all pure color changes. `style-tweak/uiux` for structural changes (layout, spacing, new elements).
- Max 3 edits per response.

#### Stage 2 — `scope-validator` (`agents/scope-validator/`)

**Purpose**: Audits the VOICE-INTENT JSON. Strips unsafe edits. Writes `constrainedPrompt` for agent-routed changes.

**Output format**:
```json
{
  "approved": true,
  "safeEdits": [...],
  "blockedEdits": [{ "edit": {}, "reason": "..." }],
  "agentRequired": "direct | uiux | jnr-dev | full-pipeline | none",
  "constrainedPrompt": "precise instruction for downstream agent"
}
```

**Blocking rules**: imageUrl/pollinations/seed fields, CSS vars not in `:root`, unknown content field paths, `confidence < 0.6`.

**Fallback**: If `approved=true` but `safeEdits` is empty (LLM returned wrong field name or empty array), `index.js` falls back to `intent.edits` directly — preventing silent no-ops.

#### Stage 3 — `dispatchVoiceEdit`

Not an agent — a dispatch function in `index.js` that routes based on `agentRequired`:

| `agentRequired` | Action |
|---|---|
| `direct` | Regex patch applied to `globals.css` and/or `site-content.ts` directly |
| `uiux` | UIUX-designer agent invoked with `constrainedPrompt` + file paths |
| `jnr-dev` | JNR-developer agent invoked with `constrainedPrompt` + file paths |
| `full-pipeline` | `buildWebsiteDirect()` triggered |

After a successful direct write, `[reload]` is written to the stream. Both `VoiceEditButton` and `SpatialVoiceOverlay` detect `[reload]` and call `window.location.reload()` after 900ms, ensuring Next.js HMR on Windows picks up the change.

---

### 3.4 The Research Squad

**Purpose**: Intelligence gathering. Dispatched when the orchestrator determines a problem needs external context.

**Workflow**: Query decomposition → Parallel fan-out to searchers → Aggregation → `solution-proposer` → Structured output to orchestrator.

Agents: `github-searcher`, `devpost-searcher`, `web-searcher`, `solution-proposer`.

---

### 3.5 `resourcer-agent`

**Purpose**: Visual art direction for the website pipeline. Translates research design DNA into concrete visual resource parameters.

**Outputs** (JSON):
- `imageTheme` — 3–5 keyword phrase, franchise-specific
- `heroSeed`, `cardSeeds[3]`, `ctaSeed` — random 5-digit integers for deterministic image generation
- `fontDisplay` — Google Font with fallback stack
- `refinedPalette` — validated color palette (`primary`, `secondary`, `bg`, `text`). Corrects mismatches between research palette and imageTheme (e.g., if research returned dark bg for a "yellow restaurant", resourcer corrects to cream bg). If research palette already matches, it is passed through unchanged.

**Token budget**: 600 tokens. Model receives both `research.colorPalette` and the original user request so it can validate intent vs. palette.

---

### 3.6 `image-gen-agent`

**Purpose**: Creative visual synthesis. Crafts image prompts for each layout zone and serves them through a three-tier stack. Also writes CSS `@keyframes` animations matched to the theme.

**Image Generation Stack**:
| Tier | Service | Method |
|---|---|---|
| 1 (primary) | Gemini Imagen 3 | POST `imagen-3.0-generate-002` → base64 → disk |
| 2 (fallback) | Pollinations.ai | HTTP download → `/public/images/` |
| 3 (last resort) | Pollinations.ai URL | URL referenced directly |
| Client-side | Puter.js | Prompts in `puter-image-config.js` → `PuterImageLoader.tsx` |

**Zone sizing**: hero 1600×900 · card 400×300 · cta 1200×400.

---

### 3.7 The Website-Builder Pipeline

**Purpose**: Five-stage AI pipeline that turns a one-line user request into a fully themed Next.js site.

#### Stage 1 — `website-builder/research-agent`

Extracts design DNA. Returns: `siteType`, `aesthetic`, `colorPalette`, `variants` (each 0–4), `imageKeywords`, `fontDisplay`.

**Palette rules (intent-driven — not hardcoded dark)**:
- `bg`: dark for gaming/horror/sci-fi, cream/off-white for restaurant/food/warm, near-white for corporate/SaaS, soft light for nature/organic.
- `primary`: MUST reflect what the user asked for. "orange site" → primary IS orange (`#ea580c+`).
- `secondary`: accent/highlight complementing primary.
- `text`: high contrast against `bg` (dark bg → light text, light bg → dark text).

#### Stage 2 — `website-builder/resourcer-agent`

Produces `imageTheme`, seeds, `fontDisplay`, `refinedPalette`. See §3.5.

#### Stage 3 — `website-builder/uiux-agent`

Writes all site copy: `brand`, `navLinks`, `heroHeadline`, `heroSubtext`, CTAs, `cards[3]`, `features[4]`, `ctaHeadline`, `footerLinks`.

#### Stage 4 — `image-gen-agent` (shared)

Builds image specs from stages 1–3. Runs three-tier image stack. Writes `puter-image-config.js` and `PuterImageLoader.tsx`.

#### Stage 4b — SNR-DEV writes interim globals.css

Uses `resources.refinedPalette ?? research.colorPalette` to write an interim `:root` block. This is a safety fallback — Stage 5 overwrites it.

The `:root` block includes all zone-specific CSS variables:
```css
:root {
  --color-primary:    <hex>;
  --color-secondary:  <hex>;
  --color-bg:         <hex>;
  --color-text:       <hex>;
  --color-nav-text:   <hex>;   /* navbar links — voice-patchable independently */
  --color-hero-text:  <hex>;   /* hero body text — voice-patchable independently */
  --color-on-primary: <hex>;
  --color-on-secondary: <hex>;
  --font-display:     <font>;
}
```

#### Stage 5 — ARCHITECT chooses and applies the active theme

**This is the final authority on theme**. The architect receives:
- User request + aesthetic + site type
- Base palette from research + resourcer
- Image theme phrase

It generates **5 visually distinct color variants** (dark, light, neon, muted, vibrant) for the Template Library. It sets `"recommended": true` on exactly one — the variant that most faithfully captures user intent. That recommended variant's palette overwrites `globals.css` as the live site theme.

**Template Library** (`design-variants.json` + `design-variants.ts`): all 5 variants are available for the user to browse and switch from the in-browser Template Library. Each variant includes `palette`, `fontDisplay`, `animationStyle`, `spacingScale`, `shadowStyle`, `previewGradient`, and `recommended`.

---

### 3.8 The Code-Editor Squad

**Purpose**: Edit orchestrator. Dispatches to tier sub-agents. Never writes files directly.

**Tier Routing**:
| Tier | Sub-Agent | Scope |
|---|---|---|
| `ui` | `uiux-designer` | `src/components/`, `src/app/`, CSS files |
| `jnr` | `jnr-developer` | Single file, isolated |
| `snr` | `snr-developer` | Multi-file, feature boundary |
| `architect` | `architect` | Full codebase + theme generation |
| `test` | `site-tester` | Read-only QA |

**`uiux-designer`** is also invoked from the voice-edit pipeline (`dispatchVoiceEdit`) when `agentRequired === "uiux"`, with `constrainedPrompt` + injected file paths and the constraint "do not modify imageUrls, layout variants, or other sections."

---

## 4. CSS Variable System

All components use CSS custom properties for theming. Voice edits patch individual variables without touching others.

### Zone-Specific Variables

| Variable | Scope | Who uses it |
|---|---|---|
| `--color-primary` | Buttons, key UI elements | All components |
| `--color-secondary` | Accents, hero headline, brand/logo | All components |
| `--color-bg` | Page background | `body`, hero sections |
| `--color-text` | Global fallback body text | `body`, cards, features, footer |
| `--color-nav-text` | Navbar link text **only** | `Navbar.tsx` (all 5 variants) |
| `--color-hero-text` | Hero body/subtext **only** | `Hero.tsx` (all 5 variants) |
| `--color-on-primary` | Text on primary-colored surfaces | Buttons |
| `--color-on-secondary` | Text on secondary-colored surfaces | CTA buttons |
| `--font-display` | Display/heading font | All components |

`--color-nav-text` and `--color-hero-text` default to `var(--color-text)` in the template — they inherit until explicitly patched. This means:
- "change all text to white" → patches `--color-text` → all text including nav + hero
- "change navbar text to white" → patches only `--color-nav-text` → only nav links change

---

## 5. Skills (19 Composable Instruction Modules)

Skills are NOT callable tools. They are instruction documents read and executed step-by-step using registered tools.

| Skill | Purpose | Allowed Tools |
|---|---|---|
| `architect-website` | Master 5-stage pipeline for website generation | `file_read`, `file_write`, `launch_frontend` |
| `route-intent` | Classify user instruction → assign tier | `Read` |
| `apply-edit` | Coordinate read→diff→review→write cycle | `file_read`, `file_write` |
| `design-ui` | Activate canvas-editor, coordinate uiux-designer | `file_read`, `file_write`, `launch_frontend` |
| `detect-runtime` | Crawl manifests to detect language, frameworks, versions | `file_read`, `shell_exec` |
| `test-site` | QA orchestration: site-tester → snr-developer fix loop | `file_read`, `shell_exec`, `http_get` |
| `code-review` | Audit patches for syntax, security, and style | `file_read` |
| `run-guardrails` | Fan out to all guardrail sub-agents, aggregate verdicts | `file_read` |
| `enforce-policy` | Rules + constraint validation | `file_read` |
| `scan-secrets` | Credential and secret detection | `file_read` |
| `audit-diff` | Safety diff review | `file_read` |
| `validate-scope` | Tier routing integrity check | `Read` |
| `find-resources` | Dispatch resourcer-agent for images, palette, fonts | `http_get` |
| `generate-images` | Dispatch image-gen-agent for AI images + CSS animations | — |
| `run-research` | Coordinate research-agent for external context | `http_get` |
| `search-github` | GitHub repo/code/issue search | `http_get` |
| `search-devpost` | Devpost hackathon project search | `http_get` |
| `search-web` | General web search fallback | `http_get` |
| `propose-solution` | Synthesize search results into actionable proposal | — |

---

## 6. The Full Website Generation Pipeline

```
Stage 1: website-builder/research-agent
   Extracts design DNA: siteType, aesthetic, intent-driven colorPalette, variants, imageKeywords, fontDisplay.
         ↓
Stage 2: website-builder/resourcer-agent
   Produces imageTheme phrase, per-zone seeds, fontDisplay.
   Validates palette vs. intent → outputs refinedPalette (corrects mismatches).
         ↓
Stage 3: website-builder/uiux-agent
   Writes all site copy: brand, navLinks, heroHeadline, cards, features, CTA, footer.
         ↓
Stage 4: image-gen-agent
   Builds image specs from stages 1–3.
   Tries Gemini Imagen 3 → Pollinations.ai download → Pollinations.ai URL.
   Writes puter-image-config.js + PuterImageLoader.tsx.
         ↓
Stage 4b: SNR-DEV writes interim globals.css
   Uses resources.refinedPalette ?? research.colorPalette.
   Writes full :root block including --color-nav-text and --color-hero-text.
   (Overwritten by Stage 5.)
         ↓
Stage 4c: SNR-DEV writes site-content.ts
   All copy + image URLs with per-zone Pollinations seeds.
         ↓
Stage 5: ARCHITECT — theme selection (final authority)
   Receives user intent + aesthetic + base palette + image theme.
   Generates 5 visually distinct color variants for Template Library.
   Sets "recommended":true on the variant that best matches user intent.
   Overwrites globals.css with recommended variant's palette + font.
   Writes design-variants.json + design-variants.ts.
         ↓
Launch
   Calls launch_frontend('http://localhost:3000').
```

---

## 7. Declarative Tools

| Tool | Description | Access Control |
|---|---|---|
| `file-read` | Read file contents at a given path | All agents |
| `file-write` | Write full content to a file | jnr, snr, architect, uiux-designer |
| `search` | Regex pattern search within files | All agents |
| `shell-exec` | Read-only shell (`ls`, `find`, `grep`, `cat`) | architect, site-tester only |

---

## 8. Memory Layer

| File | Purpose |
|---|---|
| `memory/MEMORY.md` | Session cache. Most recent repo scan result so the code-editor has runtime context without re-scanning. |
| `memory/known-errors.md` | Auto-learned rules. `append_memory` tool writes here when the agent discovers patterns to avoid. Prepended to system prompt on every invocation. |

---

## 9. The Runtime (`index.js`)

The orchestrator runtime (~3400 lines) that:

1. **Imports `gitclaw`**: `import { query } from "gitclaw"` for the agent SDK.
2. **Defines tools**: `file_read`, `file_write`, `fetch_images`, `launch_frontend`, `append_memory` — injected into gitclaw query at runtime.
3. **Runs a REPL**: Interactive terminal loop (`you>`) accepting natural-language prompts.
4. **Hosts an API server** (`localhost:3002`):
   - `POST /command` — general code-editor REPL over HTTP
   - `POST /voice-edit` — 3-stage voice-edit pipeline (VOICE-INTENT → SCOPE-VALIDATOR → dispatchVoiceEdit)
   - `GET /key-status` — key pool health
5. **Key pool with model fallback**: Rotates up to 5 `GROQ_API_KEY_N` entries per model. When all org keys for `llama-3.3-70b-versatile` are exhausted, automatically falls back to `llama-4-scout-17b-16e` for the remaining calls.
6. **Auto-restores locked templates**: At startup, captures component baselines (`COMPONENT_SNAPSHOTS`). Before every website build, restores all 7 component files to the snapshot, preventing LLM-written code from accumulating across builds.
7. **`FULL_GLOBALS_CSS_TEMPLATE`**: Module-level constant with the canonical CSS template including all zone-specific variables. Used for both full resets and partial `:root` replacements.
8. **HMR reload signal**: After every successful direct CSS or content write via `dispatchVoiceEdit`, writes `[reload]` to the response stream. `VoiceEditButton` and `SpatialVoiceOverlay` detect this and call `window.location.reload()` after 900ms.
9. **Streams agent events**: Color-coded terminal logs with role attribution (`[ARCHITECT]`, `[RESEARCH]`, `[RESOURCER]`, `[UIUX]`, `[IMAGE-GEN]`, `[SNR-DEV]`, `[VOICE-INTENT]`, `[SCOPE-VALIDATOR]`, `[PREVIEW]`).
10. **gitagent agent loader** (`loadAgentSystem`): Composes system prompts from SOUL.md + RULES.md + skills/*/SKILL.md. Routes `voice-intent` and `scope-validator` to `agents/voice-intent/` and `agents/scope-validator/`.

---

## 10. The Frontend Voice/Gesture System

### `SpatialVoiceOverlay.tsx`

The primary in-page voice interface. Mounted in `layout.tsx`, visible on all pages.

**Edit mode** — activated via `?edit=1` URL param or the ✏️ EDIT MODE button.

**PTT (Push-to-Talk)**:
- Hold the pill button (or Spacebar) → SpeechRecognition starts
- `interimResults: true` — live text shown in hint as user speaks (`🎙 "..."`)
- No confidence gate — all recognized speech is accepted (Chrome's Web Speech API returns low confidence scores for valid phrases)
- Command dispatch in `onend` (after speech stops), not `onresult`
- Sends to `POST /voice-edit` and streams the response
- Detects `[reload]` in response → triggers `window.location.reload()` after 900ms

**Hand tracking** (MediaPipe GestureRecognizer, CDN-loaded):
- Index fingertip Y-position drives smooth scroll
- Canvas overlay draws hand skeleton in real time

**Chat log**: Shows `YOU`, `ORCHESTRATOR`, `VOICE`, `JNR-DEV`, `SNR-DEV`, `SYS` roles with color coding.

### `VoiceEditButton.tsx`

Standalone mic button (also mounted in `layout.tsx`). Tap to start, tap again to cancel.

- `interimResults: true`, `maxAlternatives: 3` — picks highest-confidence alternative
- No confidence gate
- Sends to `POST /voice-edit`, streams result
- Shows actual pipeline output (✗ blocked / ⚠ warn / ✓ applied) instead of unconditional "Done"
- Detects `[reload]` → `window.location.reload()` after 900ms

---

## 11. Constraints & Design Principles

| Principle | Implementation |
|---|---|
| **Cost Proportionality** | Tier routing ensures simple tasks use cheap models; only architecture-level work triggers expensive ones. |
| **Scope Discipline** | Each sub-agent is hard-limited to its defined scope. Violations trigger escalation. |
| **Safety by Default** | Guardrails intercept every state-modifying action. A single BLOCK halts the pipeline. |
| **Intent-Driven Theming** | Research palette rules derive colors from user intent, not defaults. Resourcer validates and corrects. Architect makes the final theme choice. |
| **Zone-Isolated Voice Edits** | Separate CSS variables per zone (`--color-nav-text`, `--color-hero-text`) prevent "change navbar text" from affecting hero or body text. |
| **Read-Only Defaults** | Cannot clone, build, install, or deploy. Shell access restricted to architect and site-tester. |
| **Credential Protection** | `secret-sentinel` blocks all access to `.env`, secrets, and credential-pattern diffs. |
| **Observable Execution** | Structured log blocks and color-coded roles give real-time terminal feedback for every pipeline stage. |
| **Self-Healing Memory** | `known-errors.md` accumulates learned rules across sessions, preventing the same mistakes recurring. |
| **Reliable HMR** | Voice edits trigger `[reload]` signal → forced browser reload after 900ms, bypassing Windows file-watcher misses. |
