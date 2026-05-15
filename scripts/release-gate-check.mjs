import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CARGO_BIN = "E:\\EnvConfig\\cargo\\bin";

function parseArgs(argv) {
  const options = {
    dryRun: false,
    skipTauriBuild: false,
    skipElectronBuild: false,
    skipSmoke: false,
    checkEnvOnly: false,
    releaseDir: "",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];
    if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg === "--skip-packaging") {
      options.skipTauriBuild = true;
      options.skipElectronBuild = true;
    } else if (arg === "--skip-tauri-build") {
      options.skipTauriBuild = true;
    } else if (arg === "--skip-electron-build") {
      options.skipElectronBuild = true;
    } else if (arg === "--skip-smoke") {
      options.skipSmoke = true;
    } else if (arg === "--check-env-only") {
      options.checkEnvOnly = true;
    } else if (arg === "--release-dir") {
      if (!next) throw new Error("--release-dir requires a path");
      options.releaseDir = next;
      index += 1;
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return options;
}

function printHelp() {
  console.log(`Release gate check

Usage:
  node scripts/release-gate-check.mjs [options]

Options:
  --dry-run                 Print the release gate command sequence.
  --skip-packaging          Skip Tauri and Electron packaging builds.
  --skip-tauri-build        Skip npm run build:tauri.
  --skip-electron-build     Skip npm run build:electron.
  --skip-smoke              Skip npm run release:smoke.
  --check-env-only          Validate release gate environment prerequisites and exit.
  --release-dir <path>      Forward a release staging folder to release:smoke.
`);
}

const options = parseArgs(process.argv.slice(2));
const isWindows = process.platform === "win32";
const npmCommand = "npm";

const commandEnv = {
  ...process.env,
  PATH: isWindows ? `${CARGO_BIN}${path.delimiter}${process.env.PATH ?? ""}` : process.env.PATH,
};

const releaseSmokeArgs = ["run", "release:smoke"];
if (options.releaseDir) {
  releaseSmokeArgs.push("--", "--release-dir", options.releaseDir);
}

const commands = [
  ...(options.skipTauriBuild
    ? []
    : [
        {
          label: "Tauri installer build",
          command: npmCommand,
          args: ["run", "build:tauri"],
        },
      ]),
  ...(options.skipElectronBuild
    ? []
    : [
        {
          label: "Electron portable build",
          command: npmCommand,
          args: ["run", "build:electron"],
        },
      ]),
  ...(options.skipSmoke
    ? []
    : [
        {
          label: "Release smoke",
          command: npmCommand,
          args: releaseSmokeArgs,
        },
      ]),
  {
    label: "TypeScript health",
    command: npmCommand,
    args: ["run", "typecheck"],
  },
  {
    label: "Repository hygiene",
    command: npmCommand,
    args: ["run", "ci:repo-hygiene"],
  },
  {
    label: "Whitespace diff check",
    command: "git",
    args: ["diff", "--check"],
  },
];

function formatCommand(step) {
  return [step.command, ...step.args].join(" ");
}

function runStep(step) {
  console.log(`\n==> ${step.label}`);
  console.log(`$ ${formatCommand(step)}`);

  if (options.dryRun) return 0;

  const startedAt = Date.now();
  const result = spawnSync(step.command, step.args, {
    cwd: ROOT,
    env: commandEnv,
    stdio: "inherit",
    shell: isWindows,
  });
  const elapsedSeconds = ((Date.now() - startedAt) / 1000).toFixed(1);

  if (result.error) {
    console.error(`Release gate could not start "${step.label}" after ${elapsedSeconds}s.`);
    console.error(result.error.message);
    return 1;
  }

  if (result.status !== 0) {
    console.error(`Release gate failed at "${step.label}" after ${elapsedSeconds}s.`);
    return result.status ?? 1;
  }

  console.log(`Passed "${step.label}" in ${elapsedSeconds}s.`);
  return 0;
}

function verifyEnvironment() {
  if (!isWindows) return true;
  if (!options.checkEnvOnly && (options.dryRun || options.skipTauriBuild)) return true;

  const cargoExe = path.join(CARGO_BIN, "cargo.exe");
  if (!existsSync(cargoExe)) {
    console.error(`Cargo executable missing: ${cargoExe}`);
    console.error("Set up the Windows Rust toolchain before running release packaging.");
    return false;
  }

  console.log(`Cargo available: ${cargoExe}`);
  return true;
}

console.log(`Running release gate${options.dryRun ? " in dry-run mode" : ""}.`);
if (isWindows) {
  console.log(`Using Cargo bin: ${CARGO_BIN}`);
}

if (!verifyEnvironment()) {
  process.exit(1);
}

if (options.checkEnvOnly) {
  console.log("Release gate environment check passed.");
  process.exit(0);
}

for (const step of commands) {
  const status = runStep(step);
  if (status !== 0) {
    process.exit(status);
  }
}

console.log(`\nRelease gate passed with ${commands.length} steps.`);
