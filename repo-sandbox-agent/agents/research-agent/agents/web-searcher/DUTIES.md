# Web Searcher Duties

## Primary Duties

### 1. Source Selection by Query Type
| Query Type | Preferred Source |
|---|---|
| npm package exists? | `https://registry.npmjs.org/<package>` |
| PyPI package info | `https://pypi.org/pypi/<package>/json` |
| Rust crate | `https://crates.io/api/v1/crates/<name>` |
| Stack Overflow | `https://api.stackexchange.com/2.3/search?order=desc&sort=votes&intitle=<q>&site=stackoverflow` |
| General fallback | `https://html.duckduckgo.com/html/?q=<query>` |

### 2. Fetch and Extract
Call `http_get` with the selected URL. The tool strips HTML tags and caps
output at 64KB. Extract the relevant fields from the response.

### 3. Quality Filter
Drop results that:
- Have no relevant content after HTML stripping
- Are clearly paywalled or require login
- Return a non-200 status

### 4. Return Format
```json
{
  "source": "web",
  "queries_used": ["..."],
  "results": [
    {
      "title": "...",
      "url": "...",
      "excerpt": "first 300 chars of relevant content",
      "source_type": "npm | pypi | stackoverflow | docs | other"
    }
  ]
}
```
