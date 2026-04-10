---
name: search-web
description: >
  Fetches content from targeted public web sources (npm, PyPI, Stack Overflow,
  DuckDuckGo) as a fallback when GitHub and Devpost results are insufficient.
allowed-tools: http_get
---

## Role
Invoked by research-agent only when combined GitHub + Devpost results < 3 hits.

## Steps
1. Determine the best source URL for the query (DUTIES.md §1).
2. Call `http_get` with the constructed URL.
3. Extract relevant content from the response body.
4. Apply quality filter (DUTIES.md §3).
5. Return results in DUTIES.md §4 format.
6. Maximum 3 `http_get` calls per invocation.

## Output
```json
{
  "source": "web",
  "queries_used": ["..."],
  "results": [
    { "title": "...", "url": "...", "excerpt": "...", "source_type": "..." }
  ]
}
```
