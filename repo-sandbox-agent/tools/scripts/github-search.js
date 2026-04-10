// Tool: github_search
// Searches GitHub using the REST Search API.
// Input: { query, type?, per_page? }
// type: "repositories" | "code" | "issues" (default: "repositories")

let raw = "";
process.stdin.setEncoding("utf-8");
for await (const chunk of process.stdin) raw += chunk;

const { query, type = "repositories", per_page = 5 } = JSON.parse(raw);

if (!query) {
  process.stderr.write("Missing required field: query");
  process.exit(1);
}

const token = process.env.GITHUB_TOKEN;
const headers = {
  "Accept": "application/vnd.github+json",
  "User-Agent": "repo-sandbox-agent/1.0.0",
  ...(token ? { "Authorization": `Bearer ${token}` } : {}),
};

const url = `https://api.github.com/search/${type}?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=${per_page}`;

try {
  const res = await fetch(url, { headers });
  if (!res.ok) {
    const err = await res.text();
    process.stdout.write(JSON.stringify({ error: `GitHub API ${res.status}: ${err}` }));
    process.exit(0);
  }
  const data = await res.json();

  let results;
  if (type === "repositories") {
    results = (data.items || []).map(r => ({
      name: r.full_name,
      url: r.html_url,
      description: r.description,
      stars: r.stargazers_count,
      language: r.language,
      topics: r.topics,
    }));
  } else if (type === "code") {
    results = (data.items || []).map(r => ({
      file: r.name,
      path: r.path,
      repo: r.repository?.full_name,
      url: r.html_url,
    }));
  } else if (type === "issues") {
    results = (data.items || []).map(r => ({
      title: r.title,
      url: r.html_url,
      repo: r.repository_url?.replace("https://api.github.com/repos/", ""),
      state: r.state,
      body_excerpt: r.body?.slice(0, 200),
    }));
  }

  process.stdout.write(JSON.stringify({ total: data.total_count, results }, null, 2));
} catch (e) {
  process.stdout.write(JSON.stringify({ error: e.message }));
}
