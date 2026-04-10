# repo-sandbox-agent

> Built for the **gitagent Hackathon**. Defined using the [gitagent standard](https://github.com/open-gitagent/gitagent). Brought to life with [gitclaw](https://github.com/open-gitagent/gitclaw).

A multi-agent system that scans any Git repository to detect its runtime and run instructions, then routes natural-language code-edit requests to tiered sub-agents to keep LLM costs proportional to task complexity. It autonomously generates themed Next.js websites from a single prompt and lets you edit them in real-time using voice commands and hand-gesture tracking.

---

## What It Does

You give it a prompt like:

```
you> create a harry potter themed website
```

And it orchestrates **18 specialized AI agents** — an architect that plans the design, a resourcer that curates images and color palettes, an image generator that creates AI visuals via Pollinations.ai, developers that write the code, a QA tester that screenshots the result and dispatches fixes, and a guardrails squad that blocks credential leaks and unsafe diffs — all coordinating autonomously to produce a fully themed, live-reloading Next.js site on `localhost:3000`.

Then you can edit it by clicking elements and speaking, or by showing hand gestures to your webcam:

- **Click** any element → it gets selected (orange highlight)
- **Hold 🎙** → speak a natural-language edit ("make this text more dramatic")
- **Peace sign ✌️** → move your hand left/right to shift the entire site's color theme
- **Pinch** a selected element → context menu appears (edit text, redesign, change color)

### Editing Any Local Repository
You are not limited to just the generated site. You can paste an absolute path to any file on your computer and instruct the agent to fix or refactor it:

```
you> C:\Users\Vivan Rajath\Desktop\repo\sandbox-test-python\main.py update this feature 
```

The orchestrator will intelligently route this instruction to the developer squad (`snr-developer` or `jnr-developer`), load the pure source code via `file_read`, apply the minimal requested change, and safely update the external file via `file_write` while escaping JSON parameters accurately.

## The gitagent Standard

This project is a fully compliant gitagent repository:

```
repo-sandbox-agent/
├── agent.yaml              # Manifest: name, model, skills, tags
├── SOUL.md                 # Orchestrator identity & personality
├── RULES.md                # Hard behavioral constraints
├── ARCHITECTURE.md         # Internal architecture reference
├── memory/
│   ├── MEMORY.md           # Git-committed session cache
│   └── known-errors.md     # Auto-learned rules (persisted across sessions)
├── tools/
│   ├── file-read.yaml      # Declarative tool definitions
│   ├── file-write.yaml
│   ├── search.yaml
│   ├── shell-exec.yaml
│   └── scripts/            # Tool implementations (Node.js)
├── skills/                 # 19 composable instruction modules
│   ├── architect-website/
│   ├── route-intent/
│   ├── apply-edit/
│   ├── run-guardrails/
│   ├── ... (19 total)
│   └── validate-scope/
└── agents/                 # 5 parent agents, 12 leaf sub-agents
    ├── code-editor/        # Edit orchestrator
    │   └── agents/
    │       ├── architect/
    │       ├── jnr-developer/
    │       ├── snr-developer/
    │       ├── uiux-designer/
    │       └── site-tester/
    ├── guardrails/         # Safety orchestrator
    │   └── agents/
    │       ├── policy-enforcer/
    │       ├── secret-sentinel/
    │       ├── diff-auditor/
    │       └── scope-validator/
    ├── research-agent/     # Search orchestrator
    │   └── agents/
    │       ├── github-searcher/
    │       ├── devpost-searcher/
    │       ├── web-searcher/
    │       └── solution-proposer/
    ├── resourcer-agent/    # Visual asset curation
    └── image-gen-agent/    # AI image generation + CSS animations
```

Every agent directory contains `agent.yaml` (manifest), `SOUL.md` (identity), `DUTIES.md` (responsibilities), and optionally `RULES.md` and `SKILL.md`.

---

## Agent Architecture (18 Agents)

| Squad | Agent | What It Does |
|---|---|---|
| **Orchestrator** | `repo-sandbox-agent` | Top-level router. Classifies user intent and delegates to the correct squad. |
| **Code Editor** | `code-editor` | Edit orchestrator. Dispatches to tier sub-agents based on complexity. Never writes code directly. |
| | `jnr-developer` | Single-file edits. Typo fixes, isolated bug patches. Cheapest model tier. |
| | `snr-developer` | Multi-file features. New routes, cross-component integration. Receives fix reports from site-tester. |
| | `architect` | Full-codebase scope. System refactors, website generation pipeline lead. Read-only shell access. |
| | `uiux-designer` | All UI/UX changes. Translates canvas sketches and hand gestures into React components. |
| | `site-tester` | Read-only QA. Screenshots the live site, harvests console errors, dispatches fixes. Max 3 cycles. |
| **Guardrails** | `guardrails` | Safety interceptor. Invoked before every file write, shell exec, and sub-agent dispatch. |
| | `policy-enforcer` | Reads RULES.md and issues ALLOW/BLOCK on every action. Cannot be overridden. |
| | `secret-sentinel` | Blocks access to credentials. Scans paths and diffs for `.env`, `*.pem`, API keys. |
| | `diff-auditor` | Pre-write safety review. Catches `eval()` injection, mass deletions, auth removal. |
| | `scope-validator` | Validates tier routing. Prevents complex tasks from being sent to cheap agents. |
| **Research** | `research-agent` | Search coordinator. Decomposes queries and fans out to searcher sub-agents. |
| | `github-searcher` | Searches GitHub repos, code, and issues. |
| | `devpost-searcher` | Searches Devpost hackathon projects. |
| | `web-searcher` | General web search fallback. |
| | `solution-proposer` | Aggregates all search results into an actionable implementation proposal. |
| **Creative** | `resourcer-agent` | Curates Unsplash/Picsum images, WCAG-compliant color palettes, Google Font pairings. |
| | `image-gen-agent` | Generates AI images via Pollinations.ai. Writes CSS @keyframes animations from scratch. |

---

## Skills (19)

Skills are composable instruction modules — not functions. The agent reads the skill's `SKILL.md` and executes its steps using registered tools.

`architect-website` · `route-intent` · `apply-edit` · `design-ui` · `detect-runtime` · `test-site` · `code-review` · `run-guardrails` · `enforce-policy` · `scan-secrets` · `audit-diff` · `validate-scope` · `find-resources` · `generate-images` · `run-research` · `search-github` · `search-devpost` · `search-web` · `propose-solution`

Type `/skills` in the REPL to list all available skills.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Agent Standard | [gitagent](https://github.com/open-gitagent/gitagent) v0.1.0 |
| Agent Runtime | [gitclaw](https://github.com/open-gitagent/gitclaw) SDK (`import { query } from "gitclaw"`) |
| LLM Provider | Groq (Llama 4 Scout 17B, Llama 3.3 70B, Llama 3.1 8B) |
| Generated Sites | Next.js 16 + Tailwind CSS |
| Gesture Tracking | MediaPipe Vision (GestureRecognizer, CDN-loaded at runtime) |
| AI Image Generation | Pollinations.ai (free, no API key) |
| Image Sourcing | Unsplash Source, Picsum Photos |

---

## Getting Started

See the [Runbook](./runbook.md) for setup and usage instructions.

See the [Architecture](./architecture.md) for the full technical deep-dive into every agent, skill, tool, and memory layer.
