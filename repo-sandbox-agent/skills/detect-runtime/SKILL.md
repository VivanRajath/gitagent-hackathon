---
name: detect-runtime
description: >
  Detects the runtime, language, package manager, and framework of a
  repository by reading its manifest files (package.json, requirements.txt,
  Cargo.toml, go.mod, pom.xml, etc.) and key config files.
allowed-tools: file-read search read
---

## Objective
Identify the language ecosystem, runtime version, package manager, and
primary framework(s) used by the target repository.

## Steps

1. **Locate manifest files** — use `search` or `file-read` to look for:
   - JavaScript/TypeScript: `package.json`, `.nvmrc`, `.node-version`
   - Python: `requirements.txt`, `pyproject.toml`, `setup.py`, `Pipfile`, `poetry.lock`
   - Rust: `Cargo.toml`
   - Go: `go.mod`
   - Java/Kotlin: `pom.xml`, `build.gradle`, `build.gradle.kts`
   - Ruby: `Gemfile`
   - .NET: `*.csproj`, `*.sln`, `global.json`
   - PHP: `composer.json`

2. **Read the primary manifest** — extract:
   - Language & version (e.g. `engines.node`, `python_requires`, `go` directive)
   - Package manager (npm/yarn/pnpm, pip/poetry/uv, cargo, etc.)
   - Key dependencies that signal the framework (express, fastapi, axum, gin…)

3. **Check for framework config files** — e.g. `next.config.*`, `vite.config.*`,
   `django/settings.py`, `Dockerfile`, `.github/workflows/*.yml`.

4. **Produce a structured JSON result** in this shape:
   ```json
   {
     "language": "...",
     "runtime_version": "...",
     "package_manager": "...",
     "framework": "...",
     "confidence": "high | medium | low",
     "evidence": ["file1", "file2"]
   }
   ```
   If any field cannot be determined, use `"unknown"` and list the root
   files examined under `evidence` so the host can decide.

## Constraints
- Read-only. Never write or modify files.
- Do not clone or download anything.
- If no local files are accessible, return
  `{"error": "no local access"}` and stop.
