---
name: propose-solution
description: >
  Synthesizes aggregated search results into a structured solution proposal
  with recommended approach, key components, tradeoffs, and cited sources.
allowed-tools: file_read
---

## Role
Final step in the research pipeline. Called by research-agent after all
search agents have returned results.

## Inputs
- `findings`: aggregated object with `github`, `devpost`, `web` result arrays
- `query`: original user query
- `context`: optional repo scan result (language, framework) for tailoring

## Steps
1. Rank all results by relevance + quality + recency (DUTIES.md §1).
2. Extract patterns from top 2–3 references (DUTIES.md §2).
3. If `context` is provided, tailor library/framework suggestions to match
   the detected runtime (e.g., suggest Express middleware for a Node.js repo).
4. Produce the proposal in the DUTIES.md §3 structure.
5. Assign confidence level (DUTIES.md §4).
6. If confidence is LOW, append a First-Principles Fallback section.

## Output
```
## Recommended Approach
...

## Key Components
- ...

## Tradeoffs
- Pro: ...
- Con: ...

## References
- [Name](url) — reason

**Confidence**: HIGH | MEDIUM | LOW
```
