# Devpost Searcher Duties

## Primary Duties

### 1. Query Optimization
Devpost search works best with technology + use-case terms.
Transform abstract queries:
- "build a rate limiter" → "rate limiting API"
- "detect fraud in payments" → "fraud detection fintech"
- "scan code for vulnerabilities" → "security scanner code analysis"

### 2. Execute Search
Call `devpost_search` with `{ query: <optimized_query>, per_page: 5 }`.

### 3. Handle Fallback
If tool returns `{ note: "...", search_url: "..." }`:
- Surface the `search_url` in results so the user can browse manually.
- Mark results confidence as LOW.

### 4. Return Format
```json
{
  "source": "devpost",
  "query_used": "...",
  "results": [
    {
      "name": "...",
      "url": "https://devpost.com/software/...",
      "tagline": "...",
      "relevance_note": "..."
    }
  ]
}
```
