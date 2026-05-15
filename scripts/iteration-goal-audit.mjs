import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OFFLINE = process.argv.includes("--offline");
const JSON_OUTPUT = process.argv.includes("--json");

const REQUIRED_DOCS = [
  {
    path: "docs/markdown-roadmap-2026-05.md",
    markers: ["## Mainstream Benchmark Matrix", "P0", "P1", "P2", "P3"],
  },
  {
    path: "docs/release-iteration-playbook.md",
    markers: ["## Iteration Loop", "## Required Gates", "npm run release:smoke"],
  },
  {
    path: "docs/iteration-merge-queue-2026-05.md",
    markers: ["## Current PR Queue", "### Wave 0: Stabilize The Queue", "docs/wave0-review-handoff-2026-05.md"],
  },
  {
    path: "docs/active-goal-artifact-audit-2026-05.md",
    markers: ["## Completion Audit Refresh", "## Prompt To Artifact Checklist", "v1.4.3-hotfix8"],
  },
  {
    path: "docs/upgrade-execution-log.md",
    markers: ["### Slice 34", "Release lane v1.4.3-hotfix8"],
  },
  {
    path: "docs/wave0-review-handoff-2026-05.md",
    markers: ["## Review Order", "## Main-Branch Gate After Wave 0", "## Packaging Trigger"],
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
  const output = execFileSync("gh", args, {
    cwd: ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  return JSON.parse(output);
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
  const command = packageJson.scripts?.["iteration:audit"];
  const passed = command === "node scripts/iteration-goal-audit.mjs";
  addCheck("package script: iteration:audit", passed, command ?? "missing script");
  if (!passed) {
    fail("package.json must expose npm run iteration:audit");
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

function main() {
  verifyDocs();
  verifyPackageScript();
  verifyGitHubState();

  if (!printResult()) {
    process.exit(1);
  }
}

main();
