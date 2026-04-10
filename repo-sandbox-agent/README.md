# repo-sandbox-agent

A multi-agent system built on the [gitagent](https://github.com/open-gitagent) standard and powered by [gitclaw](https://github.com/open-gitagent/gitclaw).

It scans any Git repository to detect its runtime environment, classifies the complexity of natural language code-edit requests, and delegates those edits to tiered sub-agents — keeping LLM costs proportional to task complexity.

Built for the **gitagent Hackathon**.

---

## Agent Hierarchy

```
repo-sandbox-agent (Orchestrator)
├── repo-scanner
│   ├── framework-detector   (manifest reading, runtime detection)
│   └── deep-scan-agent      (deep traversal, architecture summary)
└── code-editor
    ├── jnr-developer        (single-file edits, fast/cheap models)
    ├── snr-developer        (multi-file features, standard models)
    └── architect            (system changes, top-tier models)
```

## Skills

| Skill | What it does |
|---|---|
| `detect-runtime` | Reads repo manifests → structured JSON (runtime, framework, entry, env vars) |
| `route-intent` | Classifies edit complexity → jnr / snr / architect tier |
| `apply-edit` | Reads files, generates a diff, writes on confirmation |
| `code-review` | Validates proposed changes for correctness, security, style |

## Setup

```bash
npm install
cp .env.example .env   # add your GROQ_API_KEY
```

## Run

```bash
# Interactive REPL
npm start

# Single-shot prompt
node index.js "Scan https://github.com/org/repo and summarise its runtime"

# Override model at runtime
gitclaw --dir . --model groq:llama-3.3-70b-versatile "your prompt"
```

## Repo structure

```
repo-sandbox-agent/
├── agent.yaml            # gitagent manifest
├── SOUL.md               # agent identity & personality
├── RULES.md              # hard constraints
├── index.js              # gitclaw SDK entry point
├── skills/
│   ├── detect-runtime/SKILL.md
│   ├── route-intent/SKILL.md
│   ├── apply-edit/SKILL.md
│   └── code-review/SKILL.md
├── tools/
│   ├── file-read.yaml
│   ├── file-write.yaml
│   ├── search.yaml
│   ├── shell-exec.yaml
│   └── scripts/          # Node.js tool implementations
└── memory/
    └── MEMORY.md         # last scan cache
```
