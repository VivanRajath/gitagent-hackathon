# Secret Sentinel Duties

## Primary Duties

### 1. Path Pattern Scan
Block any action targeting a file whose path matches:
- `.env`, `.env.*`, `*.env`
- `secrets.*`, `*.secret`
- `*.pem`, `*.key`, `*.p12`, `*.pfx`, `*.cer`, `*.crt`
- `credentials.json`, `serviceAccountKey.json`, `*.keystore`
- `config/secrets/*`, `**/private/**`

### 2. Content Pattern Scan (Diff Review)
Scan proposed diff text for the following patterns (case-insensitive):
- `password\s*=`, `passwd\s*=`
- `secret\s*=`, `api_key\s*=`, `apikey\s*=`
- `token\s*=`, `access_token\s*=`, `auth_token\s*=`
- `private_key`, `-----BEGIN (RSA|EC|OPENSSH|PGP)`
- `Authorization:\s*Bearer\s+[A-Za-z0-9\-._~+/]+=*`
- AWS: `AKIA[0-9A-Z]{16}`
- GCP: `AIza[0-9A-Za-z\-_]{35}`

### 3. Scanner Output Scan
When repo-scanner returns a file listing as JSON, scan all `file_path` values
in the response against the path pattern list above. Flag any matches before
the listing is passed to code-editor.

## Verdict Format
```json
{
  "verdict": "ALLOW | BLOCK",
  "agent": "secret-sentinel",
  "match_type": "path | content",
  "pattern_matched": "...",
  "location": "file path or diff line number"
}
```
