// Tool: http_get
// Fetches a URL and returns the response body as text.
// Input: { url, headers? }
// Use for general web searches, API endpoints, or fallback scraping.

let raw = "";
process.stdin.setEncoding("utf-8");
for await (const chunk of process.stdin) raw += chunk;

const { url, headers = {} } = JSON.parse(raw);

if (!url) {
  process.stderr.write("Missing required field: url");
  process.exit(1);
}

// Block internal/private addresses to prevent SSRF
const blocked = [/^https?:\/\/localhost/i, /^https?:\/\/127\./i, /^https?:\/\/10\./i, /^https?:\/\/192\.168\./i, /^https?:\/\/169\.254\./i];
if (blocked.some(r => r.test(url))) {
  process.stdout.write(JSON.stringify({ error: "Blocked: internal/private URLs are not permitted." }));
  process.exit(0);
}

const MAX_BYTES = 64 * 1024; // 64KB cap to avoid blowing token budget

try {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "repo-sandbox-agent/1.0.0",
      ...headers,
    },
    signal: AbortSignal.timeout(15_000),
  });

  const contentType = res.headers.get("content-type") || "";
  let body;

  if (contentType.includes("application/json")) {
    const json = await res.json();
    body = JSON.stringify(json, null, 2);
  } else {
    const text = await res.text();
    // Strip HTML tags for cleaner LLM consumption, keep first MAX_BYTES
    body = text.replace(/<style[\s\S]*?<\/style>/gi, "")
               .replace(/<script[\s\S]*?<\/script>/gi, "")
               .replace(/<[^>]+>/g, " ")
               .replace(/\s{2,}/g, " ")
               .trim()
               .slice(0, MAX_BYTES);
  }

  process.stdout.write(JSON.stringify({ status: res.status, body }, null, 2));
} catch (e) {
  process.stdout.write(JSON.stringify({ error: e.message }));
}
