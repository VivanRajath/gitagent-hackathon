# Architecture of `repo-sandbox-agent`

## 1. Executive Summary
The `repo-sandbox-agent` is a multi-agent system designed to autonomously scan Git repositories, detect their environments, and intelligently delegate natural-language code editing tasks to specialized sub-agents based on the task's complexity. It adheres to the `gitagent` standard and executes via the `gitclaw` SDK. Its primary focus is cost-efficiency without sacrificing capability — lightweight models handle simple tasks while more capable models are reserved for complex changes.

A key specialization: **UI/UX requests** are handled by a dedicated `uiux-designer` persona that integrates with the `canvas-editor` — a browser-based hand-tracking canvas (MediaPipe + tldraw) that lets users sketch UI layouts using hand gestures. The generated code is synced back to the target Next.js project via a REST endpoint.

## 2. Core Architecture & Agent Hierarchy

```text
repo-sandbox-agent (Orchestrator)
├── guardrails (safety orchestrator)
│   ├── policy-enforcer      (rules + constraint validation)
│   ├── secret-sentinel      (credential & secret leak detection)
│   ├── diff-auditor         (pre-write diff safety review)
│   └── scope-validator      (tier routing integrity check)
├── repo-scanner (scan orchestrator)
│   ├── framework-detector   (manifest reading, runtime detection)
│   └── deep-scan-agent      (deep traversal, architecture summary)
├── research-agent (search orchestrator)
│   ├── github-searcher      (GitHub repos, code, issues)
│   ├── devpost-searcher     (Devpost hackathon projects)
│   ├── web-searcher         (general HTTP/web fallback)
│   └── solution-proposer    (aggregates results → actionable proposal)
└── code-editor (edit orchestrator)
    ├── jnr-developer        (single-file edits, fast/cheap models)
    ├── snr-developer        (multi-file features, standard models; fix target for site-tester)
    ├── architect            (system changes, top-tier models, read-only shell)
    ├── uiux-designer        (all UI/UX in Next.js, canvas-editor interface)
    │     └── canvas-editor  (hand-tracking tldraw @ localhost:3000)
    └── site-tester          (QA: screenshot :3001, console errors → snr-developer, max 3 cycles)
```

- **Orchestrator**: Routes user prompts to the appropriate parent agent. Maintains top-level state.
- **guardrails**: Safety layer — invoked before every `file_write`, `shell_exec`, and sub-agent dispatch.
- **repo-scanner**: Read-only. Determines language, dependencies, and repo structure.
- **research-agent**: Searches GitHub, Devpost, and the web for prior art and solutions.
- **code-editor**: Delegates edits to the correct tier sub-agent based on complexity and domain.

## 3. Tier Routing

The `route-intent` skill classifies every edit request into one of four tiers:

| Tier Token | Sub-Agent | Model Cost | Scope | Canvas? |
|---|---|---|---|---|
| `ui` | `uiux-designer` | Standard | UI layer only | Yes |
| `jnr` | `jnr-developer` | Low | 1 file, isolated | No |
| `snr` | `snr-developer` | Standard | Feature boundary | No |
| `architect` | `architect` | High | Full codebase | No |
| `test` | `site-tester` | Standard | Read-only QA, :3001 | No |

**UI/UX is checked first** — before complexity classification. Any request involving components, layout, styling, or canvas sketches → `uiux-designer`.

## 4. UI/UX Designer Integration

### canvas-editor (`repo/canvas-editor/`)
A standalone Next.js application serving as the visual interface for the `uiux-designer`:

| Component | Role |
|---|---|
| `HandTracker.tsx` | MediaPipe HandLandmarker → webcam cursor + pinch-to-click |
| `Tldraw` (dynamic) | Drawing canvas driven by hand gesture cursor |
| `GitAgentRunner.tsx` | Agent status panel — sends shapes to `uiux-designer`, shows logs |
| `/api/sync` (POST) | Writes generated Next.js code to `../generated-site/` |

### Flow
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
generated-site runs as a live preview
```

### uiux-designer Agent Definition
Full agent definition: `repo/frontend-agent/`
```
frontend-agent/
├── agent.yaml              (manifest: name=uiux-designer)
├── SOUL.md                 (identity, hierarchy position)
├── DUTIES.md               (detailed responsibilities)
├── RULES.md                (hard constraints)
└── skills/ui-builder/
    └── SKILL.md            (step-by-step execution)
```

In-hierarchy stub: `agents/code-editor/agents/uiux-designer/` (references frontend-agent)

## 5. End-to-End Workflow

### Edit Request (non-UI)
1. Orchestrator receives user instruction
2. `route-intent` → assigns tier (`jnr`/`snr`/`architect`)
3. `run-guardrails` → ALLOW/BLOCK check
4. `code-editor` → dispatches to tier sub-agent
5. Sub-agent reads files → generates diff → `code-review`
6. `diff-auditor` → PASS/FAIL
7. User confirms → `file-write`

### Edit Request (UI/UX)
1. Orchestrator receives UI instruction (or canvas data)
2. `route-intent` → tier `ui`, `canvas_triggered: true`
3. `design-ui` skill activated
4. User opens canvas-editor at `http://localhost:3000`
5. Draws layout with hand gestures → `GitAgentRunner` captures shapes
6. `uiux-designer` → parses → generates components → diff
7. `run-guardrails` → ALLOW
8. User confirms → POST `/api/sync` → files written to `generated-site/`

### QA / Site Test (post-generation or explicit request)
1. Orchestrator receives "test the site" or `architect-website` pipeline completes
2. `route-intent` → tier `test`
3. `test-site` skill activated → dispatches `site-tester`
4. `site-tester` pings `http://localhost:3001`, captures screenshot, harvests console errors
5. Analyses screenshot against user's original intent (visual score: pass/warn/fail)
6. If errors: assembles structured error report → forwards to `snr-developer` via `code-editor`
7. `snr-developer` applies fixes (multi-file) → confirms completion
8. `site-tester` re-tests — max 3 cycles
9. On clean pass: returns `{ "status": "clean", "visual_score": "pass" }` to orchestrator

## 6. Guardrail Layer Detail

| Agent | Trigger | Verdict |
|---|---|---|
| `policy-enforcer` | Every tool dispatch | ALLOW / BLOCK |
| `secret-sentinel` | Every `file_read` + `file_write` | ALLOW / BLOCK |
| `diff-auditor` | Every `file_write` (post code-review) | PASS / FAIL |
| `scope-validator` | After `route-intent`, before dispatch | ALLOW / ESCALATE / DOWNGRADE |

`scope-validator` also enforces that `uiux-designer` only touches UI files.

## 7. Skills

| Skill | Purpose |
|---|---|
| `detect-runtime` | Crawl manifests to deduce language, frameworks, versions |
| `route-intent` | Classify request → assign tier (jnr/snr/architect/ui/test) |
| `apply-edit` | Coordinate read→diff→review→write per tier |
| `design-ui` | Activate canvas-editor, coordinate uiux-designer |
| `test-site` | QA orchestration: site-tester → snr-developer fix loop → clean pass |
| `code-review` | Audit patches for syntax, security, style |
| `run-guardrails` | Fan out to guardrail sub-agents, aggregate verdict |
| `enforce-policy` | Rules + constraint validation |
| `scan-secrets` | Credential and secret detection |
| `audit-diff` | Safety diff review (injection, destruction, scope bleed) |
| `validate-scope` | Tier routing integrity check |
| `run-research` | Coordinate research-agent sub-agents |
| `search-github` | GitHub repo/code/issue search |
| `search-devpost` | Devpost hackathon project search |
| `search-web` | General web search fallback |
| `propose-solution` | Synthesize search results into actionable proposal |

## 8. Constraints and Rules
- **Read-Only Defaults**: Cannot clone external repos, run builds, install packages, or deploy.
- **Credential Protection**: Blocked from `.env`, secret files, `.pem`, `.key`.
- **Mandatory Confirmation**: All writes require a diff + user acknowledgment.
- **UI Isolation**: Only `uiux-designer` may modify UI files — jnr/snr/architect are blocked.
- **Scope Discipline**: Each sub-agent is limited to its defined scope; violations trigger escalation.
