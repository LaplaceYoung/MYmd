import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

const BLOCKED_PATHS = new Set([
  "src-tauri/2",
  "tasks.md",
  "progress.txt",
  "tauri-help.txt",
  "test-milk.js",
  "test2.md",
  "docs/benchmark-launch-plan-2026Q2.md",
]);

const BLOCKED_PATTERNS = [
  /\.log$/i,
  /\.tsbuildinfo$/i,
  /^test-results\//i,
  /^playwright-report\//i,
];

const SECRET_PATTERNS = [
  /BEGIN [A-Z ]*PRIVATE KEY/,
  /ghp_[A-Za-z0-9]{20,}/,
  /github_pat_[A-Za-z0-9_]{20,}/,
  /sk-[A-Za-z0-9]{20,}/,
  /AKIA[0-9A-Z]{16}/,
  /xox[baprs]-[A-Za-z0-9-]+/,
];

function listTrackedFiles() {
  const out = execSync("git ls-files", { encoding: "utf8" });
  return out
    .split(/\r?\n/)
    .map((x) => x.trim())
    .filter(Boolean);
}

function isBlockedFile(filePath) {
  if (BLOCKED_PATHS.has(filePath)) return true;
  return BLOCKED_PATTERNS.some((re) => re.test(filePath));
}

function scanSecrets(filePath) {
  let content = "";
  try {
    content = readFileSync(filePath, "utf8");
  } catch {
    return [];
  }

  const hits = [];
  for (const re of SECRET_PATTERNS) {
    if (re.test(content)) {
      hits.push(re.toString());
    }
  }
  return hits;
}

function main() {
  const tracked = listTrackedFiles();
  const blockedHits = tracked.filter(isBlockedFile);

  const secretHits = [];
  for (const filePath of tracked) {
    const matched = scanSecrets(filePath);
    if (matched.length > 0) {
      secretHits.push({ filePath, patterns: matched });
    }
  }

  if (blockedHits.length === 0 && secretHits.length === 0) {
    console.log("Repo hygiene check passed.");
    return;
  }

  if (blockedHits.length > 0) {
    console.error("Blocked files found:");
    for (const filePath of blockedHits) {
      console.error(`- ${filePath}`);
    }
  }

  if (secretHits.length > 0) {
    console.error("Potential secrets found:");
    for (const hit of secretHits) {
      console.error(`- ${hit.filePath}: ${hit.patterns.join(", ")}`);
    }
  }

  process.exit(1);
}

main();
