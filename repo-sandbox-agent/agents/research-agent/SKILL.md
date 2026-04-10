---
name: run-research
description: >
  Orchestrates a multi-source search across GitHub, Devpost, and the web for
  a given query, then synthesizes results into a proposed solution.
allowed-tools: github_search, devpost_search, http_get, file_read
---

## Role
Called by the top-level orchestrator when the user's intent is to research,
find prior art, or explore existing solutions before writing code.

## Inputs
- `query`: the user's problem or search intent (natural language)
- `context`: optional — current repo scan result from detect-runtime

## Steps
1. Decompose `query` into 3 targeted search strings (GitHub, Devpost, web).
2. Call `github_search` with `{ query: <github_query>, type: "repositories", per_page: 5 }`.
3. Call `devpost_search` with `{ query: <devpost_query>, per_page: 5 }`.
4. If combined results < 3 useful hits, call `http_get` with a DuckDuckGo
   or relevant API URL as fallback.
5. Aggregate all results into the findings format (see DUTIES.md §3).
6. Read `skills/propose-solution/SKILL.md` and follow its steps to generate
   the final proposal from the aggregated findings.
7. Return the complete output to the orchestrator.

## Output Format
```
## Research Results for: <query>

### GitHub
| Repo | Stars | Description |
|------|-------|-------------|
| ... | ... | ... |

### Devpost
| Project | Tagline |
|---------|---------|
| ... | ... |

### Proposed Solution
<structured proposal from propose-solution>

### Sources
- <url1>
- <url2>

**Confidence**: HIGH | MEDIUM | LOW
```
