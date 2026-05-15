import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OFFLINE = process.argv.includes("--offline");
const JSON_OUTPUT = process.argv.includes("--json");
const CHECK_SOURCES = process.argv.includes("--check-sources");

const REQUIRED_DOCS = [
  {
    path: "docs/markdown-roadmap-2026-05.md",
    markers: ["## Mainstream Benchmark Matrix", "P0", "P1", "P2", "P3", "docs/benchmark-source-refresh-2026-05-15.md"],
  },
  {
    path: "docs/benchmark-source-refresh-2026-05-15.md",
    markers: ["## Source Snapshot", "## Roadmap Decision", "## Priority Adjustments", "## Sources"],
  },
  {
    path: "docs/release-iteration-playbook.md",
    markers: ["## Iteration Loop", "## Required Gates", "npm run release:smoke", "npm run release:gate", "--check-env-only"],
  },
  {
    path: "docs/iteration-merge-queue-2026-05.md",
    markers: [
      "## Current PR Queue",
      "### Wave 0: Stabilize The Queue",
      "docs/wave0-review-handoff-2026-05.md",
      "npm run wave0:gate",
      "npm run release:gate",
      "--check-env-only",
    ],
  },
  {
    path: "docs/active-goal-artifact-audit-2026-05.md",
    markers: ["## Completion Audit Refresh", "## Prompt To Artifact Checklist", "v1.4.3-hotfix8", "release environment preflight"],
  },
  {
    path: "docs/upgrade-execution-log.md",
    markers: ["### Slice 34", "### Slice 39", "### Slice 44", "### Slice 45", "### Slice 46", "### Slice 47", "### Slice 48", "### Slice 49", "### Slice 50", "### Slice 51", "### Slice 52", "### Slice 53", "Release lane v1.4.3-hotfix8"],
  },
  {
    path: "docs/wave0-review-handoff-2026-05.md",
    markers: ["## Review Order", "## Main-Branch Gate After Wave 0", "## Packaging Trigger", "--check-env-only"],
  },
  {
    path: "docs/release-retrospective-v1.4.3-hotfix8.md",
    markers: ["## Outcome Map", "## Follow-ups", "## Completion Decision"],
  },
];

const REQUIRED_OPEN_PR_NUMBERS = Array.from({ length: 14 }, (_, index) => index + 1);
const REQUIRED_RELEASE_ASSETS = [
  "MYmd_1.4.3_x64-setup.exe",
  "MYmd_1.4.3_x64_en-US.msi",
  "MYmd-Electron-1.4.3-x64-portable.zip",
  "SHA256SUMS.txt",
  "RELEASE_NOTES.md",
];
const REQUIRED_PACKAGE_SCRIPTS = [
  {
    name: "iteration:audit",
    command: "node scripts/iteration-goal-audit.mjs",
  },
  {
    name: "wave0:gate",
    command: "node scripts/wave-gate-check.mjs --wave 0",
  },
  {
    name: "release:gate",
    command: "node scripts/release-gate-check.mjs",
  },
];
const REQUIRED_SCRIPT_MARKERS = [
  {
    path: "scripts/wave-gate-check.mjs",
    markers: [
      "Iteration evidence audit",
      "TypeScript health",
      "Production web build",
      "Repository hygiene",
      "Whitespace diff check",
      "--dry-run",
      "--skip-build",
    ],
  },
  {
    path: "scripts/release-gate-check.mjs",
    markers: [
      "Tauri installer build",
      "Electron portable build",
      "Release smoke",
      "TypeScript health",
      "Repository hygiene",
      "Whitespace diff check",
      "--dry-run",
      "--skip-packaging",
      "--check-env-only",
      "Cargo available",
      "E:\\\\EnvConfig\\\\cargo\\\\bin",
    ],
  },
];
const REQUIRED_README_RELEASE_MARKERS = [
  {
    path: "README.md",
    markers: ["v1.4.3-hotfix8", "MYmd_1.4.3_x64-setup.exe", "MYmd_1.4.3_x64_en-US.msi", "release/v1.4.3-hotfix8"],
  },
  {
    path: "README_en.md",
    markers: ["v1.4.3-hotfix8", "MYmd_1.4.3_x64-setup.exe", "MYmd_1.4.3_x64_en-US.msi", "release/v1.4.3-hotfix8"],
  },
];

const checks = [];
const blockers = [];

function readRepoFile(relativePath) {
  return readFileSync(path.join(ROOT, relativePath), "utf8");
}

function addCheck(name, passed, evidence, details = undefined) {
  checks.push({ name, passed, evidence, details });
}

function fail(message) {
  blockers.push(message);
}

function runGhJson(args) {
  let lastError;
  for (let attempt = 1; attempt <= 6; attempt += 1) {
    try {
      const output = execFileSync("gh", args, {
        cwd: ROOT,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      });
      return JSON.parse(output);
    } catch (error) {
      lastError = error;
      if (attempt < 6) {
        sleep(Math.min(1000 * attempt, 5000));
      }
    }
  }
  throw lastError;
}

function extractBenchmarkSourceUrls() {
  const content = readRepoFile("docs/benchmark-source-refresh-2026-05-15.md");
  const sourceStart = content.indexOf("## Sources");
  const sourceBlock = sourceStart >= 0 ? content.slice(sourceStart) : content;
  const urls = new Set();
  for (const line of sourceBlock.split(/\r?\n/)) {
    const matches = line.match(/https?:\/\/[^\s)]+/g) ?? [];
    for (const match of matches) {
      urls.add(match.replace(/[.,;]+$/, ""));
    }
  }
  return [...urls];
}

async function fetchWithRetry(url) {
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(url, {
        redirect: "follow",
        signal: controller.signal,
        headers: {
          "User-Agent": "MYmd-iteration-audit",
        },
      });
      response.body?.cancel();
      return { status: response.status, finalUrl: response.url };
    } catch (error) {
      lastError = error;
      if (attempt < 3) {
        await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
      }
    } finally {
      clearTimeout(timeout);
    }
  }
  throw lastError;
}

async function verifyBenchmarkSourceLinks() {
  if (!CHECK_SOURCES) return;
  if (OFFLINE) {
    addCheck("benchmark source links", true, "skipped with --offline");
    return;
  }

  const urls = extractBenchmarkSourceUrls();
  addCheck("benchmark source URL inventory", urls.length > 0, `${urls.length} URLs`);
  if (urls.length === 0) {
    fail("benchmark source refresh should include source URLs");
    return;
  }

  for (const url of urls) {
    try {
      const result = await fetchWithRetry(url);
      const passed = result.status >= 200 && result.status < 400;
      addCheck(`benchmark source link: ${url}`, passed, `${result.status} ${result.finalUrl}`);
      if (!passed) {
        fail(`${url} returned HTTP ${result.status}`);
      }
    } catch (error) {
      addCheck(`benchmark source link: ${url}`, false, error instanceof Error ? error.message : String(error));
      fail(`${url} could not be fetched`);
    }
  }
}

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function verifyDocs() {
  for (const doc of REQUIRED_DOCS) {
    const absolutePath = path.join(ROOT, doc.path);
    if (!existsSync(absolutePath)) {
      addCheck(`doc exists: ${doc.path}`, false, "missing file");
      fail(`${doc.path} is missing`);
      continue;
    }

    const content = readRepoFile(doc.path);
    const missingMarkers = doc.markers.filter((marker) => !content.includes(marker));
    const passed = missingMarkers.length === 0;
    addCheck(
      `doc markers: ${doc.path}`,
      passed,
      passed ? "all required markers present" : `missing: ${missingMarkers.join(", ")}`,
      { markers: doc.markers },
    );

    if (!passed) {
      fail(`${doc.path} is missing required markers: ${missingMarkers.join(", ")}`);
    }
  }
}

function verifyPackageScript() {
  const packageJson = JSON.parse(readRepoFile("package.json"));
  for (const script of REQUIRED_PACKAGE_SCRIPTS) {
    const command = packageJson.scripts?.[script.name];
    const passed = command === script.command;
    addCheck(`package script: ${script.name}`, passed, command ?? "missing script");
    if (!passed) {
      fail(`package.json must expose npm run ${script.name}`);
    }
  }

  for (const script of REQUIRED_SCRIPT_MARKERS) {
    const absolutePath = path.join(ROOT, script.path);
    if (!existsSync(absolutePath)) {
      addCheck(`script exists: ${script.path}`, false, "missing file");
      fail(`${script.path} is missing`);
      continue;
    }

    const content = readRepoFile(script.path);
    const missingMarkers = script.markers.filter((marker) => !content.includes(marker));
    const passed = missingMarkers.length === 0;
    addCheck(
      `script markers: ${script.path}`,
      passed,
      passed ? "all required markers present" : `missing: ${missingMarkers.join(", ")}`,
      { markers: script.markers },
    );
    if (!passed) {
      fail(`${script.path} is missing required markers: ${missingMarkers.join(", ")}`);
    }
  }

  for (const readme of REQUIRED_README_RELEASE_MARKERS) {
    const absolutePath = path.join(ROOT, readme.path);
    if (!existsSync(absolutePath)) {
      addCheck(`release readme exists: ${readme.path}`, false, "missing file");
      fail(`${readme.path} is missing`);
      continue;
    }

    const content = readRepoFile(readme.path);
    const missingMarkers = readme.markers.filter((marker) => !content.includes(marker));
    const passed = missingMarkers.length === 0;
    addCheck(
      `release readme markers: ${readme.path}`,
      passed,
      passed ? "all required markers present" : `missing: ${missingMarkers.join(", ")}`,
      { markers: readme.markers },
    );
    if (!passed) {
      fail(`${readme.path} is missing release markers: ${missingMarkers.join(", ")}`);
    }
  }
}

function verifyGitHubState() {
  if (OFFLINE) {
    addCheck("github state", true, "skipped with --offline");
    return;
  }

  const queue = readRepoFile("docs/iteration-merge-queue-2026-05.md");
  const prs = runGhJson([
    "pr",
    "list",
    "--state",
    "open",
    "--json",
    "number,title,headRefName,mergeStateStatus,reviewDecision,updatedAt,url",
    "--limit",
    "25",
  ]);

  const prByNumber = new Map(prs.map((pr) => [pr.number, pr]));

  for (const number of REQUIRED_OPEN_PR_NUMBERS) {
    const pr = prByNumber.get(number);
    const exists = Boolean(pr);
    addCheck(`open PR present: #${number}`, exists, exists ? pr.url : "missing from gh pr list");
    if (!exists) {
      fail(`PR #${number} is missing from the open PR queue`);
      continue;
    }

    const expectedState = `${pr.mergeStateStatus} / ${pr.reviewDecision}`;
    const queueRow = queue.split(/\r?\n/).find((line) => line.startsWith(`| #${number} |`));
    const queueMatchesState = Boolean(queueRow?.includes(`| ${expectedState} |`));
    addCheck(
      `queue state matches GitHub: #${number}`,
      queueMatchesState,
      expectedState,
      { branch: pr.headRefName, updatedAt: pr.updatedAt, queueRow },
    );
    if (!queueMatchesState) {
      fail(`PR #${number} queue state should reflect ${expectedState}`);
    }
  }

  const release = runGhJson([
    "release",
    "view",
    "v1.4.3-hotfix8",
    "--json",
    "tagName,name,isDraft,isPrerelease,publishedAt,url,assets",
  ]);

  const assetNames = new Set(release.assets.map((asset) => asset.name));
  const missingAssets = REQUIRED_RELEASE_ASSETS.filter((assetName) => !assetNames.has(assetName));
  const releasePassed = release.tagName === "v1.4.3-hotfix8" && !release.isDraft && !release.isPrerelease && missingAssets.length === 0;
  addCheck(
    "latest release assets",
    releasePassed,
    release.url,
    {
      publishedAt: release.publishedAt,
      missingAssets,
      assetCount: release.assets.length,
    },
  );
  if (!releasePassed) {
    fail(`v1.4.3-hotfix8 release asset check failed: ${missingAssets.join(", ") || "release metadata mismatch"}`);
  }
}

function printResult() {
  const passed = checks.every((check) => check.passed);
  const result = {
    passed,
    checkedAt: new Date().toISOString(),
    offline: OFFLINE,
    checkSources: CHECK_SOURCES,
    checkCount: checks.length,
    blockers,
    checks,
  };

  if (JSON_OUTPUT) {
    console.log(JSON.stringify(result, null, 2));
    return passed;
  }

  for (const check of checks) {
    const icon = check.passed ? "PASS" : "FAIL";
    console.log(`${icon} ${check.name}: ${check.evidence}`);
  }

  if (passed) {
    console.log(`Iteration goal audit passed with ${checks.length} checks.`);
    return true;
  }

  console.error("Iteration goal audit failed:");
  for (const blocker of blockers) {
    console.error(`- ${blocker}`);
  }
  return false;
}

async function main() {
  verifyDocs();
  verifyPackageScript();
  verifyGitHubState();
  await verifyBenchmarkSourceLinks();

  if (!printResult()) {
    process.exit(1);
  }
}

await main();
