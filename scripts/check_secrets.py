"""Lightweight deterministic repository secret guard; not a full scanning service."""

from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
SKIP_PARTS = {".git", "node_modules", ".next", ".venv", "test-results", "playwright-report"}
SKIP_FILES = {Path(__file__).resolve(), ROOT / "frontend" / "package-lock.json"}
ALLOW_FILES = {ROOT / "frontend" / ".env.example", ROOT / "backend" / ".env.example"}
PATTERNS = {
    "GitHub token": re.compile(r"\b(?:ghp|github_pat)_[A-Za-z0-9_]{20,}\b"),
    "OpenAI-style key": re.compile(r"\bsk-[A-Za-z0-9_-]{20,}\b"),
    "private key block": re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
    "bearer token": re.compile(r"\bBearer\s+[A-Za-z0-9._~+/=-]{20,}", re.IGNORECASE),
    "hardcoded signing secret": re.compile(
        r"(?:APPROVAL|RECOVERY|AUDIT)_SIGNING_KEY\s*[:=]\s*[\"']?(?!\$\{|os\.getenv|process\.env|replace-|ci-test-only-)([A-Za-z0-9_-]{16,})",
        re.IGNORECASE,
    ),
}
TEXT_SUFFIXES = {".py", ".ts", ".tsx", ".js", ".json", ".md", ".yml", ".yaml", ".env", ".example", ".txt"}


def main() -> int:
    findings: list[str] = []
    for path in ROOT.rglob("*"):
        if not path.is_file() or path.resolve() in SKIP_FILES or any(part in SKIP_PARTS for part in path.parts):
            continue
        if path.resolve() in ALLOW_FILES or (path.suffix.lower() not in TEXT_SUFFIXES and path.name not in {".env"}):
            continue
        try:
            text = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue
        for label, pattern in PATTERNS.items():
            for match in pattern.finditer(text):
                line = text.count("\n", 0, match.start()) + 1
                findings.append(f"{path.relative_to(ROOT)}:{line}: {label}")
    if findings:
        print("Potential committed secrets detected:")
        print("\n".join(findings))
        return 1
    print("Lightweight secret check passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
