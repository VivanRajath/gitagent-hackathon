# Architecture

This document is a complete technical reference to every agent, sub-agent, skill, tool, and memory layer that constitutes the `repo-sandbox-agent` system. The system is built to the [gitagent](https://github.com/open-gitagent/gitagent) standard (`spec_version: 0.1.0`) and executed by the [gitclaw](https://github.com/open-gitagent/gitclaw) SDK.

---

## 1. System Overview

The system operates in two modes:

**Code-editing mode** — a tiered, cost-aware multi-agent orchestrator that classifies natural-language edit requests by complexity and delegates to the cheapest sub-agent capable of handling them. A typo fix should never consume architect-tier tokens.

**Website-building mode** — a four-stage AI pipeline (`website-builder`) that turns a one-line user request into a fully themed, live-reloading Next.js site. Images are generated through a three-tier stack: **Gemini Imagen 3** (primary) → **Pollinations.ai** (fallback) → **Puter.js** (client-side).

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
│   └── scope-validator      — validates tier assignment; prevents underflow and overflow
│
├── research-agent  (Search Orchestrator)
│   ├── github-searcher      — GitHub repos, code, issues
│   ├── devpost-searcher     — Devpost hackathon projects
│   ├── web-searcher         — general web fallback when GitHub+Devpost yield < 3 results
│   └── solution-proposer    — aggregates all results → actionable proposal
│
├── resourcer-agent          — Unsplash/Picsum image URLs, WCAG palettes, Google Font pairings
│
├── image-gen-agent          — AI image prompts + CSS @keyframes animations
│   └── skills/generate-images
│         ├── Gemini Imagen 3  (primary — POST imagen-3.0-generate-002, base64 → disk)
│         ├── Pollinations.ai  (fallback — download → disk, or URL direct)
│         └── Puter.js config  (client-side — written to puter-image-config.js)
│
├── website-builder  (Website Generation Pipeline Orchestrator)
│   ├── research-agent       — design DNA: site type, palette, variants, image keywords
│   ├── resourcer-agent      — image theme phrase, per-zone seeds, font
│   └── uiux-agent           — all site copy: nav, hero, cards, features, CTA, footer
│
└── code-editor  (Edit Orchestrator)
    ├── jnr-developer        — single-file edits, cheap models, no shell
    ├── snr-developer        — multi-file features, standard models; receives fix reports from site-tester
    ├── architect            — system-level changes, top-tier models, read-only shell
    ├── uiux-designer        — all UI/UX; canvas-editor hand-tracking interface
    │   └── canvas-editor    — MediaPipe + tldraw browser canvas (localhost:3000)
    └── site-tester          — screenshot QA → snr-developer fix loop (max 3 cycles)
```

> **Note on name overlap:** `website-builder/research-agent` extracts design parameters
> (palette, variants, aesthetic). The top-level `research-agent` does web search and
> code lookup. Same name, different purpose. Same distinction applies to `resourcer-agent`.

---

## 3. Agent Definitions (In Depth)

Every agent follows the gitagent standard. Each directory contains:
- `agent.yaml` — manifest: `spec_version`, name, model, skills list, tags
- `SOUL.md` — identity, personality, expertise, communication style
- `RULES.md` — must-always / must-never hard constraints
- `skills/<name>/SKILL.md` — YAML frontmatter (`name`, `description`, `allowed-tools`) + execution instructions

`loadAgentSystem()` in `index.js` composes the system prompt by joining SOUL.md + RULES.md + all skills/*/SKILL.md (frontmatter stripped). Falls back to legacy `SYSTEM.md` if `SOUL.md` is absent. `image-gen-agent` resolves from `agents/image-gen-agent/`; all website-builder pipeline agents resolve from `agents/website-builder/<name>/`.

### 3.1 The Orchestrator (`repo-sandbox-agent`)

**Identity**: Top-level coordinator. It does not edit files or run code itself. It classifies user intent via the `classifyIntent` function in `index.js` and routes to the correct parent agent.

**Model**: `groq:meta-llama/llama-4-scout-17b-16e-instruct` (preferred), with fallbacks to `groq:llama-3.3-70b-versatile` and `groq:llama-3.1-8b-instant`.

**Intent Classification** (`classifyIntent` in `index.js`):
| Intent | Trigger Pattern | Target |
|---|---|---|
| `website` | "create", "build", "theme", "make", pinch-edit, swipe, delete-node | Website generation pipeline |
| `visual` | "visual editor", "canvas", "hand draw", "edit visually" | Canvas editor |
| `arch` | "refactor", "redesign", "restructure", "migrate", "overhaul" | Architect agent |
| `fix` | "fix", "debug", "repair", "broken", "error", "crash", "bug" | Fix pipeline |
| `feature` | "add", "implement", "extend", "new route", "integrate" | Feature pipeline |
| `chat` | Everything else | Conversational fallback |

**Responsibilities** (from `SOUL.md`):
1. Website generation: invoke `architect-website` skill (7-phase pipeline).
2. Route scan requests via `detect-runtime` skill.
3. Route research requests via `run-research` skill.
4. Route code edits via `route-intent` → `apply-edit`.
5. Invoke `run-guardrails` before every `file_write`, `shell_exec`, and sub-agent dispatch.
6. Use `code-review` before writing any file.

**Hard Rules** (from `RULES.md`):
- Never clone, run, or deploy any repository.
- Never edit `.env`, `secrets.*`, `*.pem`, `*.key`.
- Never run `git push` autonomously.
- Never apply edits without user confirmation.
- Never execute build, install, test, or deploy commands.

---

### 3.2 The Guardrails Squad

**Purpose**: Interceptor layer that sits between the orchestrator and all executing subsystems. Invoked before every `file_write`, `shell_exec`, and sub-agent dispatch.

**Verdict Format**:
```json
{
  "verdict": "ALLOW | BLOCK",
  "checked_by": ["policy-enforcer", "secret-sentinel", "diff-auditor", "scope-validator"],
  "blocks": [{ "agent": "secret-sentinel", "reason": "...", "location": "..." }]
}
```
A single BLOCK from any sub-agent halts the entire action.

#### 3.2.1 `policy-enforcer`
- **Role**: Reads `RULES.md` at invocation time (never cached). Evaluates the pending action against every rule in the `Never` and `Boundaries` sections. Returns ALLOW or BLOCK with a specific rule citation.
- **Personality**: Literal rule application, no interpretation. Cannot be overridden by any sub-agent, including the architect.

#### 3.2.2 `secret-sentinel`
- **Role**: Credential and secret leak detection. Pattern-matches file paths and diff content against known sensitive signatures. Never reads secret file contents — the path match alone triggers BLOCK.
- **Blocked Paths**: `.env`, `secrets.*`, `*.pem`, `*.key`, `*.p12`, `*.pfx`, `*.cer`
- **Blocked Patterns**: `password=`, `secret=`, `api_key=`, `token=`, `private_key`, `-----BEGIN`, `Authorization: Bearer`
- **Personality**: Paranoid by design. False positives acceptable; false negatives are not.

#### 3.2.3 `diff-auditor`
- **Role**: Pre-write safety review that complements `code-review`. Focuses exclusively on safety and destruction — not correctness or style. Scans for mass deletions, `eval()`/`exec()` injection, auth removal, shell injection, SQL injection, XSS, prototype pollution.
- **Hard Limits**: Never approves diffs that remove auth checks. Never approves `eval()` with unsanitized inputs. Never approves deletions exceeding 30% of a file without architect-tier confirmation.

#### 3.2.4 `scope-validator`
- **Role**: Routing integrity agent. Verifies that `route-intent`'s tier assignment matches the actual task scope.
- **Verdicts**:
  - `ALLOW` — routing is correct or within one tier of optimal.
  - `ESCALATE` — scope underflow detected (complex task routed to cheap tier). This is a safety risk.
  - `DOWNGRADE` — scope overflow detected (simple task consuming expensive tier). This is a cost recommendation, not a block.
- **Hard Limit**: Two-tier underflow (architect task → jnr-developer) is always ESCALATE.

---

### 3.3 The Research Squad

**Purpose**: Intelligence gathering. Dispatched when the orchestrator determines a problem needs external context before code can be written.

#### 3.3.1 `github-searcher`
- Searches GitHub repositories, code, and issues for prior art relevant to the user's problem.

#### 3.3.2 `devpost-searcher`
- Searches Devpost hackathon project listings for relevant implementations and demos.

#### 3.3.3 `web-searcher`
- General HTTP/web search fallback. Only invoked when GitHub + Devpost yield fewer than 3 useful results.

#### 3.3.4 `solution-proposer`
- Receives aggregated findings from all three searchers. Synthesizes them into a single actionable implementation proposal with cited sources and a confidence level (HIGH / MEDIUM / LOW).

**Workflow**: Query decomposition → Parallel fan-out to searchers → Aggregation → Handoff to solution-proposer → Structured output to orchestrator.

---

### 3.4 `resourcer-agent`

**Purpose**: The visual intelligence layer of the website generation pipeline. Curates real visual assets — it does not generate images (that's `image-gen-agent`'s job). It sources them from royalty-free APIs.

**Inputs**: Theme keywords, mood descriptor, page type, layout zones, optional palette hints.

**Outputs**: A structured JSON resource pack containing:
- **Images**: Unsplash Source URLs (hero: 1920×1080, card: 800×600, background: 1600×900, CTA: 1200×400) and Picsum URLs with themed seeds. Every image includes descriptive alt text.
- **Palette**: 7-token color palette (primary, secondary, accent, background, surface, text, text_muted). Must pass WCAG AA contrast ratios (4.5:1 text vs background).
- **Fonts**: Two Google Fonts — one expressive display font + one readable body font — with embed URLs and pairing rationale.

**Constraints**: Max 6 images per pack. No broken URLs. No restrictive-ToS sources (Getty, Shutterstock).

---

### 3.5 `image-gen-agent`

**Purpose**: Creative visual synthesis. Crafts image prompts for each layout zone and serves them through a three-tier image stack. Also writes bespoke CSS `@keyframes` animations matched to the theme's emotional core.

**Image Generation Stack** (tried in order):

| Tier | Service | Method |
|---|---|---|
| 1 (primary) | Gemini Imagen 3 | `POST /imagen-3.0-generate-002:predict?key=GEMINI_API_KEY` → base64 → saved to disk |
| 2 (fallback) | Pollinations.ai | HTTP download → saved to `/public/images/` |
| 3 (last resort) | Pollinations.ai URL | URL referenced directly (no download) |
| Client-side | Puter.js | Prompts written to `puter-image-config.js` → `PuterImageLoader.tsx` calls `puter.ai.txt2img()` |

**Prompt Rules**:
- Describe aesthetics, never named characters or copyrighted IP
- Seed: `theme.charCodeAt(0) * 1000 + theme.length * 17` for determinism
- Max 4 AI-generated images per site (performance budget)
- Prompts ≤ 200 characters (Pollinations URL limit)
- Always append `nologo=true` to Pollinations URLs

**Zone Sizing**: hero 1600×900 · card 400×300 · cta 1200×400

**Animation Authoring**:
- Writes CSS `@keyframes` from scratch matched to theme:
  - Horror/dark → flicker, glitch-text, red-pulse, scan-lines
  - Sci-fi → neon-glow, scan-lines, data-stream
  - Nature → float, sway, breathing
  - Corporate → slide-in, fade, hover-lift
- Every animation ships with a `prefers-reduced-motion` media query override

---

### 3.6 The Website-Builder Squad

**Purpose**: Four-stage AI pipeline that turns a one-line user request into a fully themed Next.js site. Each stage is an independent gitagent with its own `SOUL.md`, `RULES.md`, and `skills/`.

#### Stage 1 — `website-builder/research-agent`
Extracts design DNA from the user's request. Returns: `siteType`, `aesthetic`, `colorPalette` (primary/secondary/bg/text), `variants` (navbar/hero/cards/features/cta/footer, each 0–4), `imageKeywords`, `fontDisplay`.

**Key rule**: `colorPalette.secondary` must always be a bright, glowing accent — never dark or muted.

#### Stage 2 — `website-builder/resourcer-agent`
Translates design DNA into visual resource parameters. Returns: `imageTheme` (3–5 keyword phrase, franchise-specific), `heroSeed`, `cardSeeds[3]`, `ctaSeed` (all random 5-digit ints), `fontDisplay`.

#### Stage 3 — `website-builder/uiux-agent`
Writes all site copy themed to the request. Returns: `brand`, `tagline`, `navLinks`, `heroHeadline` (≤8 words), `heroSubtext`, `heroCTA1`, `heroCTA2`, `cards[3]`, `featureSectionTitle`, `features[4]` (with emoji icons), `ctaHeadline`, `ctaBody`, `ctaButton`, `footerLinks[3]`.

#### Stage 4 — `image-gen-agent` (shared)
Receives an image spec built from stages 1–3. Crafts prompts for each zone, runs the three-tier image stack, writes `puter-image-config.js`, and produces CSS animations. See §3.5.

**Pipeline assembly** after all four stages:
- `generated-site/src/app/site-content.ts` — all copy + image alt text
- `generated-site/src/app/design-variants.json` — palette + variant indices
- `generated-site/public/puter-image-config.js` — three-tier image config

---

### 3.7 The Code-Editor Squad

**Purpose**: Edit orchestrator. Receives routed intents and dispatches to the correct tier sub-agent. Never writes code directly — all writes go through sub-agents.

**Tier Routing** (from `route-intent` skill):
| Tier | Sub-Agent | Model Cost | Max Files | Shell Access | Scope |
|---|---|---|---|---|---|
| `test` | `site-tester` | Standard | 0 (read-only) | Read-only | QA at localhost:3001 |
| `ui` | `uiux-designer` | Standard | UI files only | No | `src/components/`, `src/app/`, `src/styles/` |
| `jnr` | `jnr-developer` | Low | 1 | No | Single file, isolated |
| `snr` | `snr-developer` | Standard | Feature boundary | No | Multi-file, no architecture |
| `architect` | `architect` | High | Full codebase | Read-only | Architecture level |

**Guardrail Gate**: Before every file write, the code-editor invokes `run-guardrails`. ALLOW → proceed. BLOCK → halt and surface reason. ESCALATE → re-route to higher tier.

#### 3.6.1 `jnr-developer`
- **Scope**: Exactly 1 file. Typo fixes, single-function rewrites, isolated style changes, small bug patches.
- **Universal Edit**: Can edit arbitrary files in external local repositories if given an absolute path.
- **Personality**: "Get in, fix it, get out." No opinions on architecture.
- **Escalation**: If the fix requires touching a second file → escalate to `snr-developer`.

#### 3.6.2 `snr-developer`
- **Scope**: Multi-file features, new routes, cross-component integration. Sees the feature boundary but not full architecture.
- **Universal Edit**: Capable of reading and rewriting files outside of the `generated-site` boundary given an absolute path.
- **Mandatory Output**: Emits an `[SNR SPLIT]` block before any writes listing all target files and feature scope. Parsed by `index.js` for observable logging.
- **Escalation**: Systemic architecture changes → escalate to `architect`. Purely UI layout → hand off to `uiux-designer`.
- **Fix Target**: Receives structured error reports from `site-tester` for post-generation fixes.

#### 3.6.3 `architect`
- **Scope**: Full codebase. System-level refactors, design pattern migrations, and the first stage of the website generation pipeline.
- **Mandatory Output**: Emits an `[ARCHITECT PLAN]` block with theme, palette, font, vibe, zones, and image URLs before any tool calls begin.
- **Shell Access**: Read-only (`ls`, `find`, `grep`, `cat`, `tree`). No build/install/deploy.
- **Design Pipeline**: When given a URL to clone, fetches HTML via `http_get`, extracts colors/layout/typography/personality, writes a design spec, and passes it downstream to `snr-developer`.

#### 3.6.4 `uiux-designer`
- **Scope**: UI files only (`src/components/`, `src/app/*.tsx`, `src/styles/`). Never touches API routes, server actions, `.env`, or data files.
- **Specialization**: Next.js App Router, Tailwind CSS, translating tldraw canvas shapes into React component hierarchies, accessibility-first markup.
- **Canvas Integration**: Powered by the `canvas-editor` — a browser-based hand-tracking canvas using MediaPipe HandLandmarker + tldraw. Users draw layouts with hand gestures, which are captured as shape data and translated into production React code.

#### 3.6.5 `site-tester`
- **Scope**: Read-only QA. Never writes files. Never attempts to fix errors itself.
- **Workflow**: Screenshots `localhost:3001` → harvests console errors → analyzes against user's original intent → produces a visual score (pass/warn/fail).
- **Error Dispatch**: If errors found, assembles a structured report (exact file, line, error text, root cause hypothesis) and forwards to `snr-developer`.
- **Cycle Limit**: Max 3 test-fix cycles per session before surfacing to user.

---

## 4. Skills (19 Composable Instruction Modules)

Skills are NOT callable tools. They are instruction documents (`SKILL.md` with YAML frontmatter) that the agent reads and executes step-by-step using registered tools.

| Skill | Purpose | Allowed Tools |
|---|---|---|
| `architect-website` | Master 7-phase pipeline for autonomous website generation | `file_read`, `file_write`, `launch_frontend` |
| `route-intent` | Classify user instruction → assign tier (test/ui/jnr/snr/architect) | `Read` |
| `apply-edit` | Coordinate the read→diff→review→write cycle per tier | `file_read`, `file_write` |
| `design-ui` | Activate canvas-editor, coordinate uiux-designer | `file_read`, `file_write`, `launch_frontend` |
| `detect-runtime` | Crawl manifests to detect language, frameworks, versions | `file_read`, `shell_exec` |
| `test-site` | QA orchestration: site-tester → snr-developer fix loop | `file_read`, `shell_exec`, `http_get` |
| `code-review` | Audit patches for syntax, security, and style | `file_read` |
| `run-guardrails` | Fan out to all guardrail sub-agents, aggregate verdicts | `file_read` |
| `enforce-policy` | Rules + constraint validation | `file_read` |
| `scan-secrets` | Credential and secret detection | `file_read` |
| `audit-diff` | Safety diff review (injection, destruction, scope bleed) | `file_read` |
| `validate-scope` | Tier routing integrity check | `Read` |
| `find-resources` | Dispatch resourcer-agent for images, palette, fonts | `http_get` |
| `generate-images` | Dispatch image-gen-agent for AI images + CSS animations | — |
| `run-research` | Coordinate research-agent for external context | `http_get` |
| `search-github` | GitHub repo/code/issue search | `http_get` |
| `search-devpost` | Devpost hackathon project search | `http_get` |
| `search-web` | General web search fallback | `http_get` |
| `propose-solution` | Synthesize search results into actionable proposal | — |

---

## 5. The Website Generation Pipeline (`architect-website`)

This is the master skill. When the user says "create a Hulk themed website", the following pipeline executes autonomously:

```
Stage 1: website-builder/research-agent
   Extracts design DNA: siteType, aesthetic, colorPalette, variants, imageKeywords, fontDisplay.
         ↓
Stage 2: website-builder/resourcer-agent
   Produces imageTheme phrase, per-zone seeds (hero/cards/cta), fontDisplay.
         ↓
Stage 3: website-builder/uiux-agent
   Writes all site copy: brand, navLinks, heroHeadline, cards, features, CTA, footer.
         ↓
Stage 4: image-gen-agent
   Builds image specs from stages 1–3.
   Tries Gemini Imagen 3 → Pollinations.ai download → Pollinations.ai URL.
   Writes puter-image-config.js for client-side Puter.js fallback.
   Produces CSS @keyframes animations.
         ↓
Assembly
   Writes site-content.ts, design-variants.json, puter-image-config.js.
   snr-developer restores locked component templates from index.js golden copies.
         ↓
Launch
   Calls launch_frontend('http://localhost:3001').
         ↓
QA
   site-tester screenshots localhost:3001, harvests console errors.
   Errors → snr-developer fixes (max 3 cycles).
         ↓
Report
   Returns visual score + one-line summary to user.
```

---

## 6. Declarative Tools

Defined as YAML in `tools/`. Each tool has a Node.js script implementation in `tools/scripts/`.

| Tool | Description | Access Control |
|---|---|---|
| `file-read` | Read file contents at a given path | All agents |
| `file-write` | Write full content to a file (only after user confirms diff) | jnr, snr, architect, uiux-designer |
| `search` | Regex pattern search within files (returns matching lines with paths and line numbers) | All agents |
| `shell-exec` | Execute read-only shell commands (`ls`, `find`, `grep`, `cat`). Write commands are blocked. | architect, site-tester only |

---

## 7. Memory Layer

Git-committed memory that persists across sessions:

| File | Purpose |
|---|---|
| `memory/MEMORY.md` | Session cache. Stores the most recent repo scan result so the code-editor has runtime context without re-scanning. |
| `memory/known-errors.md` | Auto-learned rules. The `append_memory` tool writes here when the agent discovers patterns that should be avoided in future sessions (e.g., "never import `react-icons`", "always use inline styles for `<img>` positioning"). These rules are prepended to the system prompt on every invocation. |

---

## 8. The Runtime (`index.js`)

The orchestrator runtime is a single `index.js` file (~2550 lines) that:

1. **Imports `gitclaw`**: Uses `import { query } from "gitclaw"` to invoke the agent SDK.
2. **Defines 5 external tools**: `file_read`, `file_write`, `fetch_images`, `launch_frontend`, `append_memory` — injected into the gitclaw query at runtime.
3. **Runs a REPL**: Interactive terminal loop (`you>`) that accepts natural-language prompts.
4. **Hosts an API server**: Express server on `localhost:3002` that accepts POST `/command` requests from the browser-based spatial overlay for real-time voice/gesture-driven edits.
5. **Auto-restores locked templates**: On every website generation, component templates (Navbar, Hero, Card, etc.) and `globals.css` are force-written from hardcoded golden templates in `index.js` to prevent the LLM from breaking the scaffold.
6. **Streams agent events**: Processes `delta`, `assistant`, `tool_use`, `tool_result`, and `system` message types from the gitclaw SDK, rendering color-coded terminal logs with role attribution (`[ARCHITECT]`, `[RESEARCH]`, `[RESOURCER]`, `[UIUX]`, `[IMAGE-GEN]`, `[SNR-DEV]`, `[QA]`, `[MEMORY]`, `[PREVIEW]`, `[EDITOR]`).
7. **gitagent agent loader** (`loadAgentSystem`): Resolves system prompts per agent using the gitagent standard (SOUL.md + RULES.md + skills/*/SKILL.md). Falls back to SYSTEM.md for legacy agents. Routes `image-gen-agent` to `agents/image-gen-agent/` and all website-builder pipeline agents to `agents/website-builder/<name>/`.
8. **Three-tier image prefetch** (`prefetchImages`): Runs before the browser opens. Tries Gemini Imagen 3 → Pollinations.ai download → Pollinations.ai URL for each zone (hero, card×3, cta). Results saved to `generated-site/public/images/`.

---

## 9. Constraints & Design Principles

| Principle | Implementation |
|---|---|
| **Cost Proportionality** | Tier routing ensures simple tasks use cheap models; only architecture-level work triggers expensive ones. |
| **Scope Discipline** | Each sub-agent is hard-limited to its defined scope. Violations trigger escalation, never silent overreach. |
| **Safety by Default** | Guardrails intercept every state-modifying action. A single BLOCK from any guardrail agent halts the pipeline. |
| **Read-Only Defaults** | The system cannot clone repos, run builds, install packages, or deploy. Shell access is restricted to read-only commands for the architect and site-tester only. |
| **Credential Protection** | `secret-sentinel` blocks all access to `.env`, secret files, and diffs containing credential patterns. |
| **Mandatory Confirmation** | All file writes require a diff + user acknowledgment before execution. |
| **Observable Execution** | Structured log blocks (`[ARCHITECT PLAN]`, `[SNR SPLIT]`) are parsed by the runtime for real-time terminal feedback. |
| **Self-Healing Memory** | The `known-errors.md` memory file accumulates learned rules across sessions, preventing the same mistakes from recurring. |
