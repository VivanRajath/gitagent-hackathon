---
name: search-devpost
description: >
  Searches Devpost hackathon projects for a given query. Returns structured
  project results with names, URLs, and taglines.
allowed-tools: devpost_search
---

## Steps
1. Optimize the raw query for Devpost (DUTIES.md §1).
2. Call `devpost_search` with `{ query, per_page: 5 }`.
3. If tool returns a fallback `search_url`, return it with LOW confidence.
4. Otherwise return results in the DUTIES.md §4 format.

## Output
```json
{
  "source": "devpost",
  "query_used": "...",
  "results": [ { "name": "...", "url": "...", "tagline": "..." } ]
}
```
