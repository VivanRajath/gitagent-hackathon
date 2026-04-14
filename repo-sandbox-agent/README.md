# repo-sandbox-agent

A multi-agent system built on the [gitagent](https://github.com/open-gitagent) standard and powered by [gitclaw](https://github.com/open-gitagent/gitclaw).

Operates in two modes: **code editing** (scan any Git repo, classify complexity, delegate to tiered sub-agents) and **website building** (AI pipeline that turns a one-line prompt into a fully themed Next.js site with AI-generated images).

Built for the **gitagent Hackathon**.

---

## Agent Hierarchy

```
repo-sandbox-agent (Orchestrator)
│
├── guardrails
│   ├── policy-enforcer      — constraint validation
│   ├── secret-sentinel      — credential leak detection
│   ├── diff-auditor         — pre-write diff review
│   └── scope-validator      — tier routing integrity
│
├── research-agent
│   ├── github-searcher      — GitHub repos, code, issues
│   ├── devpost-searcher     — Devpost hackathon projects
│   ├── web-searcher         — general web fallback
│   └── solution-proposer    — synthesizes results → proposal
│
├── code-editor
│   ├── jnr-developer        — single-file edits, cheap models
│   ├── snr-developer        — multi-file features, standard models
│   ├── architect            — system-wide changes, top-tier models
│   ├── uiux-designer        — Next.js UI/UX + canvas-editor interface
│   └── site-tester          — screenshot QA → fix loop (max 3 cycles)
│
├── website-builder          — AI website generation pipeline
│   ├── research-agent       — design DNA (palette, variants, aesthetic)
│   ├── resourcer-agent      — image theme, seeds, typography
│   └── uiux-agent           — all site copy (headlines, nav, cards, CTA)
│
├── image-gen-agent          — AI image prompts + CSS animations
│   └── generate-images      — Gemini Imagen → Pollinations.ai → Puter.js
│
└── resourcer-agent          — stock images, palettes, fonts for architect
```

---

## Website Builder Pipeline

Type `create a [theme] website` to trigger the four-stage pipeline:

```
research-agent  →  design DNA (palette, variants, aesthetic)
resourcer-agent →  image theme, seeds, font
uiux-agent      →  all site copy
image-gen-agent →  AI images + CSS animations
                   ├── Gemini Imagen 3 (primary, requires GEMINI_API_KEY)
                   ├── Pollinations.ai (free fallback, no key needed)
                   └── Puter.js config → puter-image-config.js (client-side)
```

Outputs assembled into:
- `generated-site/src/app/site-content.ts`
- `generated-site/src/app/design-variants.json`
- `generated-site/public/puter-image-config.js`

---

## Code Editing Tier Routing

Every edit request is classified by `route-intent` into one of five tiers:

| Tier | Agent | When |
|---|---|---|
| `ui` | uiux-designer | Components, layout, styling, canvas sketches |
| `jnr` | jnr-developer | Single file, isolated change |
| `snr` | snr-developer | Multi-file, feature-scoped |
| `architect` | architect | System-wide, cross-cutting |
| `test` | site-tester | QA, screenshot, console errors |

---

## Setup

```bash
npm install
cp .env.example .env   # add GROQ_API_KEY (required) and GEMINI_API_KEY (optional, for image gen)
```

### Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `GROQ_API_KEY` | Yes | Primary LLM calls (supports key pool: `GROQ_API_KEY_1` … `_5`) |
| `GEMINI_API_KEY` | No | Gemini Imagen 3 image generation (falls back to Pollinations if absent) |

---

## Run

```bash
# Interactive REPL
npm start

# Single-shot
node index.js "create a Naruto themed website"
node index.js "refactor the auth middleware in src/auth.ts"

# Validate gitagent compliance
npm run validate

# Show agent info
npm run info
```

---

## Repo Structure

```
repo-sandbox-agent/
├── agent.yaml                    # root gitagent manifest
├── SOUL.md                       # orchestrator identity
├── RULES.md                      # hard constraints
├── index.js                      # gitclaw SDK entry point
│
├── agents/
│   ├── code-editor/              # edit orchestrator + sub-agents
│   │   └── agents/
│   │       ├── jnr-developer/
│   │       ├── snr-developer/
│   │       ├── architect/
│   │       ├── uiux-designer/    # canvas-editor integration
│   │       └── site-tester/
│   ├── guardrails/               # safety orchestrator + sub-agents
│   │   └── agents/
│   │       ├── policy-enforcer/
│   │       ├── secret-sentinel/
│   │       ├── diff-auditor/
│   │       └── scope-validator/
│   ├── research-agent/           # search orchestrator + sub-agents
│   │   └── agents/
│   │       ├── github-searcher/
│   │       ├── devpost-searcher/
│   │       ├── web-searcher/
│   │       └── solution-proposer/
│   ├── website-builder/          # website generation pipeline
│   │   ├── agent.yaml
│   │   ├── SOUL.md / RULES.md
│   │   ├── skills/build-website/
│   │   ├── research-agent/       # design DNA agent
│   │   ├── resourcer-agent/      # visual art direction agent
│   │   └── uiux-agent/           # copy + content agent
│   ├── image-gen-agent/          # AI image + animation agent (shared)
│   │   ├── agent.yaml
│   │   ├── SOUL.md / RULES.md
│   │   └── skills/generate-images/
│   └── resourcer-agent/          # stock image + font resource agent
│
├── skills/                       # orchestrator-level skills
│   ├── detect-runtime/
│   ├── route-intent/
│   ├── apply-edit/
│   ├── design-ui/
│   ├── architect-website/
│   ├── test-site/
│   ├── find-resources/
│   ├── generate-images/
│   ├── code-review/
│   ├── run-guardrails/
│   ├── enforce-policy/
│   ├── scan-secrets/
│   ├── audit-diff/
│   ├── validate-scope/
│   ├── run-research/
│   ├── search-github/
│   ├── search-devpost/
│   ├── search-web/
│   └── propose-solution/
│
└── tools/
    ├── file-read.yaml
    ├── file-write.yaml
    ├── search.yaml
    ├── shell-exec.yaml
    └── scripts/                  # Node.js tool implementations
```

Each agent directory follows the gitagent standard:
```
<agent-name>/
├── agent.yaml      # spec_version, name, model, skills, tags
├── SOUL.md         # identity, personality, expertise
├── RULES.md        # must-always / must-never constraints
└── skills/
    └── <skill-name>/
        └── SKILL.md   # YAML frontmatter + execution instructions
```
