# repo-sandbox-agent

> Built for the **gitagent Hackathon**. Defined using the [gitagent standard](https://github.com/open-gitagent/gitagent). Brought to life with [gitclaw](https://github.com/open-gitagent/gitclaw).

A multi-agent system that scans any Git repository to detect its runtime and run instructions, then routes natural-language code-edit requests to tiered sub-agents to keep LLM costs proportional to task complexity. It autonomously generates themed Next.js websites from a single prompt using a four-stage AI pipeline, with images generated via **Gemini Imagen 3**, **Pollinations.ai**, and **Puter.js**.

---

## What It Does

You give it a prompt like:

```
you> create a hulk themed website
```

And it orchestrates **23 specialized AI agents** across two modes:

**Website Builder** — an architect plans the design, a researcher discovers the design DNA, an art director curates image themes and seeds, a copywriter fills every content zone, and an image agent generates AI visuals via Gemini Imagen 3 → Pollinations.ai → Puter.js. The result is a fully themed, live-reloading Next.js site on `localhost:3001`.

**Code Editing** — a guardrails squad blocks credential leaks and unsafe diffs, a research team finds prior art, and three developer tiers (jnr / snr / architect) apply edits with proportional model cost. A QA tester screenshots the result and dispatches fixes.

Then you can edit the generated site by clicking elements and speaking, or by showing hand gestures to your webcam:

- **Click** any element → it gets selected (orange highlight)
- **Hold 🎙** → speak a natural-language edit ("make this text more dramatic")
- **Peace sign ✌️** → move your hand left/right to shift the site's color theme
- **Pinch** a selected element → context menu appears (edit text, redesign, change color)

### Editing Any Local Repository
You can point the agent at any file on your machine:

```
you> C:\Users\Vivan Rajath\Desktop\repo\sandbox-test-python\main.py update this feature
```

The orchestrator routes this to the developer squad, loads the pure source via `file_read`, applies the minimal requested change, and safely writes back via `file_write`.

---

## The gitagent Standard

This project is a fully compliant gitagent repository. Every agent follows the standard:

```
<agent-name>/
├── agent.yaml       # spec_version, name, model, skills, tags
├── SOUL.md          # identity & personality
├── RULES.md         # must-always / must-never constraints
└── skills/
    └── <skill-name>/
        └── SKILL.md # YAML frontmatter + execution instructions
```

Full repo structure:

```
repo-sandbox-agent/
├── agent.yaml
├── SOUL.md / RULES.md / ARCHITECTURE.md
├── skills/                        # 19 orchestrator-level skills
│   ├── architect-website/         # triggers website-builder pipeline
│   ├── generate-images/           # Gemini → Pollinations → Puter.js
│   ├── route-intent/
│   ├── apply-edit/
│   ├── design-ui/
│   ├── find-resources/
│   ├── run-guardrails/
│   ├── run-research/
│   └── ... (19 total)
├── tools/
│   ├── file-read.yaml
│   ├── file-write.yaml
│   ├── search.yaml
│   ├── shell-exec.yaml
│   └── scripts/
└── agents/
    ├── code-editor/               # edit orchestrator
    │   └── agents/
    │       ├── jnr-developer/
    │       ├── snr-developer/
    │       ├── architect/
    │       ├── uiux-designer/
    │       └── site-tester/
    ├── guardrails/                # safety orchestrator
    │   └── agents/
    │       ├── policy-enforcer/
    │       ├── secret-sentinel/
    │       ├── diff-auditor/
    │       └── scope-validator/
    ├── research-agent/            # search orchestrator
    │   └── agents/
    │       ├── github-searcher/
    │       ├── devpost-searcher/
    │       ├── web-searcher/
    │       └── solution-proposer/
    ├── website-builder/           # website generation pipeline
    │   ├── research-agent/        # design DNA agent
    │   ├── resourcer-agent/       # visual art direction agent
    │   └── uiux-agent/            # copy + content agent
    ├── image-gen-agent/           # AI image + animation agent (shared)
    └── resourcer-agent/           # stock image + font resource agent
```

---

## Agent Architecture (23 Agents)

| Squad | Agent | What It Does |
|---|---|---|
| **Orchestrator** | `repo-sandbox-agent` | Top-level router. Classifies user intent and delegates to the correct squad. |
| **Code Editor** | `code-editor` | Edit orchestrator. Dispatches to tier sub-agents based on complexity. |
| | `jnr-developer` | Single-file edits. Typo fixes, isolated bug patches. Cheapest model tier. |
| | `snr-developer` | Multi-file features. New routes, cross-component integration. Receives fix reports from site-tester. |
| | `architect` | Full-codebase scope. System refactors. Read-only shell access. |
| | `uiux-designer` | All UI/UX changes. Translates canvas sketches and hand gestures into React components. |
| | `site-tester` | Read-only QA. Screenshots the live site, harvests console errors, dispatches fixes. Max 3 cycles. |
| **Guardrails** | `guardrails` | Safety interceptor. Invoked before every file write, shell exec, and sub-agent dispatch. |
| | `policy-enforcer` | Issues ALLOW/BLOCK on every action based on RULES.md. Cannot be overridden. |
| | `secret-sentinel` | Blocks access to credentials. Scans paths and diffs for `.env`, `*.pem`, API keys. |
| | `diff-auditor` | Pre-write safety review. Catches `eval()` injection, mass deletions, auth removal. |
| | `scope-validator` | Validates tier routing. Prevents complex tasks being sent to cheap agents. |
| **Research** | `research-agent` | Search coordinator. Fans out to searcher sub-agents. |
| | `github-searcher` | Searches GitHub repos, code, and issues. |
| | `devpost-searcher` | Searches Devpost hackathon projects. |
| | `web-searcher` | General web search fallback. |
| | `solution-proposer` | Aggregates all search results into an actionable implementation proposal. |
| **Website Builder** | `website-builder` | Pipeline orchestrator for AI website generation. |
| | `wb/research-agent` | Extracts design DNA: site type, palette, layout variants, image keywords. |
| | `wb/resourcer-agent` | Produces image theme phrase, per-zone seeds, and font choice. |
| | `wb/uiux-agent` | Writes all site copy: headlines, nav, cards, features, CTA, footer. |
| **Creative** | `image-gen-agent` | Crafts image prompts → Gemini Imagen 3 → Pollinations.ai → Puter.js config. Writes CSS @keyframes animations. |
| | `resourcer-agent` | Curates Unsplash/Picsum images, WCAG-compliant color palettes, Google Font pairings. |

---

## Skills (19)

Skills are composable instruction modules. The agent reads the skill's `SKILL.md` and executes its steps using registered tools.

`architect-website` · `route-intent` · `apply-edit` · `design-ui` · `detect-runtime` · `test-site` · `code-review` · `run-guardrails` · `enforce-policy` · `scan-secrets` · `audit-diff` · `validate-scope` · `find-resources` · `generate-images` · `run-research` · `search-github` · `search-devpost` · `search-web` · `propose-solution`

Type `/skills` in the REPL to list all available skills.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Agent Standard | [gitagent](https://github.com/open-gitagent/gitagent) v0.1.0 |
| Agent Runtime | [gitclaw](https://github.com/open-gitagent/gitclaw) SDK |
| LLM Provider | Groq (Llama 4 Scout 17B · Llama 3.3 70B · Llama 3.1 8B) |
| Generated Sites | Next.js 15 + Tailwind CSS |
| Gesture Tracking | MediaPipe Vision (GestureRecognizer, CDN-loaded at runtime) |
| AI Image Gen (primary) | Google Gemini Imagen 3 (`imagen-3.0-generate-002`) |
| AI Image Gen (fallback) | Pollinations.ai (free, no API key required) |
| AI Image Gen (client) | Puter.js `puter.ai.txt2img()` via `puter-image-config.js` |
| Stock Images | Unsplash Source, Picsum Photos |

---

## Getting Started

See the [Runbook](./runbook.md) for setup and usage instructions.

See the [Architecture](./architecture.md) for the full technical deep-dive into every agent, skill, tool, and data flow.
