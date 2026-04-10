---
name: search-github
description: >
  Searches GitHub repos, code, or issues for a given query using the
  GitHub REST Search API. Returns structured, relevance-filtered results.
allowed-tools: github_search
---

## Steps
1. Determine the best `type` for the query (DUTIES.md §1).
2. Enhance the raw query with GitHub qualifiers (DUTIES.md §2).
3. Call `github_search` with `{ query, type, per_page: 5 }`.
4. Apply relevance filter (DUTIES.md §3).
5. Return results in the DUTIES.md §4 format.

## Output
```json
{
  "source": "github",
  "query_used": "...",
  "type": "...",
  "results": [ { "name": "...", "url": "...", "description": "...", "stars": 0 } ]
}
```
