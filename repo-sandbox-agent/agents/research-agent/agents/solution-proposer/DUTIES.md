# Solution Proposer Duties

## Primary Duties

### 1. Reference Ranking
Score each search result on:
- **Relevance** (0–3): Does it directly address the user's query?
- **Quality** (0–3): Stars (GitHub) or project completeness (Devpost)
- **Recency** (0–2): Was it updated/created recently?

Pick the top 2–3 results (combined score ≥ 5) as primary references.

### 2. Pattern Extraction
From the primary references, extract:
- The core architectural pattern or approach used
- Key libraries or dependencies involved
- Any known tradeoffs or gotchas mentioned in READMEs or taglines

### 3. Proposal Structure
The proposal must always include:

```
## Recommended Approach
<1-paragraph description of the proposed solution>

## Key Components
- Component 1: <what it does, suggested library if applicable>
- Component 2: ...

## Tradeoffs
- Pro: ...
- Con: ...

## References
- [Repo/Project Name](url) — <why it's relevant>
```

### 4. Confidence Assessment
| Condition | Confidence |
|---|---|
| 2+ high-quality GitHub repos + 1 Devpost project found | HIGH |
| 1 relevant GitHub repo OR 1 Devpost project found | MEDIUM |
| Only web results or no direct matches | LOW |

On LOW confidence, add a "First-Principles Fallback" section with a
framework-agnostic approach based on the user's query alone.
