# Architecture of `repo-sandbox-agent`

## 1. Executive Summary

`repo-sandbox-agent` is a multi-agent system built on the [gitagent](https://github.com/open-gitagent) standard and executed via the [gitclaw](https://github.com/open-gitagent/gitclaw) SDK. It serves two distinct modes:

**Code-editing mode** — scans any Git repository, detects its runtime environment, classifies natural-language edit requests by complexity, and delegates to tiered sub-agents. Lightweight models handle simple tasks; high-capability models are reserved for complex changes.

**Website-building mode** — runs a dedicated four-stage AI pipeline (`website-builder`) that takes a one-line user request and produces a fully themed, visually complete Next.js site with AI-generated images served through a three-tier image stack (Gemini Imagen → Pollinations.ai → Puter.js).

A key specialization: **UI/UX requests** in code-editing mode are handled by the `uiux-designer` persona, which integrates with the `canvas-editor` — a browser-based hand-tracking canvas (MediaPipe + tldraw) that lets users sketch UI layouts using hand gestures.

---

## 2. Full Agent Hierarchy

```
repo-sandbox-agent (Orchestrator)
│
├── guardrails (safety orchestrator)
│   ├── policy-enforcer      — rules + constraint validation
│   ├── secret-sentinel      — credential & secret leak detection
│   ├── diff-auditor         — pre-write diff safety review
│   └── scope-validator      — tier routing integrity check
│
├── research-agent (search orchestrator)
│   ├── github-searcher      — GitHub repos, code, issues
│   ├── devpost-searcher     — Devpost hackathon projects
│   ├── web-searcher         — general HTTP/web fallback
│   └── solution-proposer    — aggregates results → actionable proposal
│
├── code-editor (edit orchestrator)
│   ├── jnr-developer        — single-file edits, fast/cheap models
│   ├── snr-developer        — multi-file features, standard models
│   ├── architect            — system changes, top-tier models, read-only shell
│   ├── uiux-designer        — all UI/UX in Next.js, canvas-editor interface
│   │     └── canvas-editor  — hand-tracking tldraw @ localhost:3000
│   └── site-tester          — QA: screenshot :3001, console errors → snr-developer (max 3 cycles)
│
├── website-builder (AI website generation pipeline)
│   ├── research-agent       — design DNA: palette, variants, aesthetic, image keywords
│   ├── resourcer-agent      — visual art direction: image theme, seeds, font
│   ├── uiux-agent           — all site copy: headlines, nav, cards, CTA, footer
│   └── [image-gen-agent]    — see standalone agent below (shared)
│
├── image-gen-agent (standalone — shared by website-builder pipeline)
│   └── skills/generate-images — Gemini Imagen → Pollinations.ai → Puter.js prompts + CSS animations
│
└── resourcer-agent (standalone — used by architect-website skill)
    └── skills/find-resources  — Unsplash, Pexels, Google Fonts resource pack
```

> **Note on website-builder sub-agents:** `website-builder/research-agent` and
> `website-builder/resourcer-agent` are pipeline-specific agents distinct from the
> top-level `research-agent` and `resourcer-agent`. They share names but serve
> different roles: the website-builder variants produce design parameters; the
> top-level variants do web search and stock image lookup.

---

## 3. Operational Modes

### Mode A — Code Editing

Triggered when the user asks to read, modify, test, or scan a repository.

```
User edit request
    ↓
route-intent → tier (jnr / snr / architect / ui / test)
    ↓
run-guardrails → ALLOW / BLOCK
    ↓
code-editor dispatches to tier sub-agent
    ↓
Sub-agent reads files → generates diff → code-review
    ↓
diff-auditor → PASS / FAIL
    ↓
User confirms → file-write
```

### Mode B — Website Building

Triggered when the user asks to "create a website", "build a site", or similar.

```
User website request
    ↓
architect-website skill activated
    ↓
Stage 1: website-builder/research-agent  → design DNA JSON
    ↓
Stage 2: website-builder/resourcer-agent → image theme + seeds JSON
    ↓
Stage 3: website-builder/uiux-agent      → full site copy JSON
    ↓
Stage 4: image-gen-agent                 → prompts + CSS animations
         ├── Gemini Imagen (primary)      → base64 image → saved to /public/images/
         ├── Pollinations.ai (fallback)   → downloaded or URL
         └── Puter.js config             → written to puter-image-config.js
    ↓
Assemble: site-content.ts + design-variants.json + puter-image-config.js
    ↓
Next.js site hot-reloads → live preview at localhost:3001
```

---

## 4. Tier Routing (Code-Editing Mode)

The `route-intent` skill classifies every edit request into one of five tiers:

| Tier Token | Sub-Agent | Model Cost | Scope | Canvas? |
|---|---|---|---|---|
| `ui` | `uiux-designer` | Standard | UI layer only | Yes |
| `jnr` | `jnr-developer` | Low | 1 file, isolated | No |
| `snr` | `snr-developer` | Standard | Feature boundary | No |
| `architect` | `architect` | High | Full codebase | No |
| `test` | `site-tester` | Standard | Read-only QA, :3001 | No |

**UI/UX is checked first** — before complexity classification. Any request involving components, layout, styling, or canvas sketches → `uiux-designer`.

---

## 5. Image Generation Stack (`image-gen-agent`)

The `image-gen-agent` orchestrates three image services in priority order:

| Tier | Service | Method | Requires API Key? |
|---|---|---|---|
| 1 (primary) | **Gemini Imagen 3** | POST `/imagen-3.0-generate-002:predict` → base64 | Yes (`GEMINI_API_KEY`) |
| 2 (fallback) | **Pollinations.ai** | Download via URL → save to `/public/images/` | No |
| 3 (last resort) | **Pollinations.ai URL** | Direct URL reference (no download) | No |
| Client-side | **Puter.js** | `puter.ai.txt2img(prompt)` via `puter-image-config.js` | No |

The agent writes all image prompts and configuration to `generated-site/public/puter-image-config.js`, consumed at runtime by `PuterImageLoader.tsx` for client-side generation when server-side tiers fail.

### Zone Sizing
| Zone | Width | Height |
|---|---|---|
| hero | 1600 | 900 |
| card (×3) | 400 | 300 |
| cta | 1200 | 400 |

---

## 6. UI/UX Designer Integration (Code-Editing Mode)

### canvas-editor (`repo/canvas-editor/`)
A standalone Next.js application serving as the visual interface for `uiux-designer`:

| Component | Role |
|---|---|
| `HandTracker.tsx` | MediaPipe HandLandmarker → webcam cursor + pinch-to-click |
| `Tldraw` (dynamic) | Drawing canvas driven by hand gesture cursor |
| `GitAgentRunner.tsx` | Agent status panel — sends shapes to `uiux-designer`, shows logs |
| `/api/sync` (POST) | Writes generated Next.js code to `../generated-site/` |

### UI/UX Flow
```
User draws layout with hand gestures
    ↓
tldraw captures shape data (bounding boxes, types, text)
    ↓
GitAgentRunner sends canvasData.shapes to uiux-designer
    ↓
uiux-designer parses shapes → component hierarchy
    ↓
Generates Next.js/Tailwind/ARIA components
    ↓
Shows diff → guardrail check → user confirms
    ↓
POSTs to /api/sync → writes to generated-site/
    ↓
generated-site runs as live preview at localhost:3001
```

---

## 7. Guardrail Layer

| Agent | Trigger | Verdict |
|---|---|---|
| `policy-enforcer` | Every tool dispatch | ALLOW / BLOCK |
| `secret-sentinel` | Every `file_read` + `file_write` | ALLOW / BLOCK |
| `diff-auditor` | Every `file_write` (post code-review) | PASS / FAIL |
| `scope-validator` | After `route-intent`, before dispatch | ALLOW / ESCALATE / DOWNGRADE |

`scope-validator` also enforces that `uiux-designer` only touches UI files; it blocks `jnr`/`snr`/`architect` from modifying UI-layer files.

---

## 8. Skills Reference

### Orchestrator-level Skills

| Skill | Purpose |
|---|---|
| `detect-runtime` | Crawl manifests → deduce language, frameworks, versions |
| `route-intent` | Classify request → assign tier (jnr/snr/architect/ui/test) |
| `apply-edit` | Coordinate read → diff → review → write per tier |
| `design-ui` | Activate canvas-editor, coordinate uiux-designer |
| `architect-website` | Kick off the four-stage website-builder pipeline |
| `test-site` | QA orchestration: site-tester → snr-developer fix loop → clean pass |
| `code-review` | Audit patches for syntax, security, style |
| `run-guardrails` | Fan out to guardrail sub-agents, aggregate verdict |
| `find-resources` | Curate stock images, palettes, and fonts for a design theme |
| `generate-images` | Craft prompts → Gemini/Pollinations/Puter image generation + CSS animations |

### Guardrail Skills

| Skill | Purpose |
|---|---|
| `enforce-policy` | Rules + constraint validation |
| `scan-secrets` | Credential and secret detection |
| `audit-diff` | Safety diff review (injection, destruction, scope bleed) |
| `validate-scope` | Tier routing integrity check |

### Research Skills

| Skill | Purpose |
|---|---|
| `run-research` | Coordinate research-agent sub-agents |
| `search-github` | GitHub repo/code/issue search |
| `search-devpost` | Devpost hackathon project search |
| `search-web` | General web search fallback |
| `propose-solution` | Synthesize search results → actionable proposal |

---

## 9. Agent Loader — gitagent Standard

All agents follow the gitagent standard. `loadAgentSystem()` in `index.js` composes the system prompt by reading from the agent directory in this order:

1. **`SOUL.md`** — identity and personality (required; signals gitagent format)
2. **`RULES.md`** — hard constraints (optional)
3. **`skills/*/SKILL.md`** — execution instructions, YAML frontmatter stripped (optional)

Falls back to **`SYSTEM.md`** for any legacy agent not yet migrated.

`image-gen-agent` is resolved from `agents/image-gen-agent/` (not inside `website-builder/`); all other website-builder pipeline agents resolve from `agents/website-builder/<name>/`.

---

## 10. Constraints and Rules

- **Read-Only Defaults**: Cannot clone external repos, run builds, install packages, or deploy.
- **Credential Protection**: Blocked from `.env`, secret files, `.pem`, `.key`.
- **Mandatory Confirmation**: All writes require a diff + user acknowledgment.
- **UI Isolation**: Only `uiux-designer` may modify UI files — `jnr`/`snr`/`architect` are blocked.
- **Scope Discipline**: Each sub-agent is limited to its defined scope; violations trigger escalation.
- **Image Budget**: Max 4 AI-generated images per website build (performance constraint).
- **Gitagent Compliance**: Every agent must have `spec_version: "0.1.0"` in `agent.yaml`, a `SOUL.md`, and at least one skill under `skills/`.
