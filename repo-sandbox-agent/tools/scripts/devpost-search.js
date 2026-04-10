// Tool: devpost_search
// Searches Devpost for hackathon projects via their public search endpoint.
// Input: { query, per_page? }

let raw = "";
process.stdin.setEncoding("utf-8");
for await (const chunk of process.stdin) raw += chunk;

const { query, per_page = 5 } = JSON.parse(raw);

if (!query) {
  process.stderr.write("Missing required field: query");
  process.exit(1);
}

const url = `https://devpost.com/software/search?query=${encodeURIComponent(query)}`;

try {
  const res = await fetch(url, {
    headers: {
      "Accept": "text/html,application/xhtml+xml",
      "User-Agent": "Mozilla/5.0 (compatible; repo-sandbox-agent/1.0.0)",
    },
  });

  if (!res.ok) {
    process.stdout.write(JSON.stringify({ error: `Devpost returned ${res.status}` }));
    process.exit(0);
  }

  const html = await res.text();

  // Extract project entries from Devpost's HTML response.
  // Devpost embeds structured data in <h5> and <p class="tagline"> tags.
  const titleRegex = /<h5[^>]*>[\s\S]*?<a[^>]+href="(https:\/\/devpost\.com\/software\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
  const taglineRegex = /<p class="tagline[^"]*">([\s\S]*?)<\/p>/g;

  const projects = [];
  let match;
  const taglines = [];
  while ((m = taglineRegex.exec(html)) !== null) {
    taglines.push(m[1].replace(/<[^>]+>/g, "").trim());
  }

  let i = 0;
  while ((match = titleRegex.exec(html)) !== null && i < per_page) {
    projects.push({
      name: match[2].replace(/<[^>]+>/g, "").trim(),
      url: match[1],
      tagline: taglines[i] || null,
    });
    i++;
  }

  if (projects.length === 0) {
    // Fallback: return the search URL for the agent to reference
    process.stdout.write(JSON.stringify({
      note: "Could not parse structured results. Visit search URL directly.",
      search_url: url,
      results: [],
    }));
  } else {
    process.stdout.write(JSON.stringify({ total: projects.length, results: projects }, null, 2));
  }
} catch (e) {
  process.stdout.write(JSON.stringify({ error: e.message }));
}
