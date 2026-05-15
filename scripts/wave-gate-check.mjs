import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = new Set(process.argv.slice(2));
const waveFlagIndex = process.argv.lastIndexOf("--wave");
const waveArg = waveFlagIndex >= 0 ? process.argv[waveFlagIndex + 1] : "0";
const dryRun = args.has("--dry-run");
const skipBuild = args.has("--skip-build");

const isWindows = process.platform === "win32";
const npmCommand = "npm";

if (waveArg !== "0") {
  console.error(`Unsupported wave: ${waveArg}`);
  console.error("Current gate automation is defined for Wave 0.");
  process.exit(1);
}

const commands = [
  {
    label: "Iteration evidence audit",
    command: npmCommand,
    args: ["run", "iteration:audit"],
  },
  {
    label: "TypeScript health",
    command: npmCommand,
    args: ["run", "typecheck"],
  },
  ...(skipBuild
    ? []
    : [
        {
          label: "Production web build",
          command: npmCommand,
          args: ["run", "build"],
        },
      ]),
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

  if (dryRun) return 0;

  const startedAt = Date.now();
  const result = spawnSync(step.command, step.args, {
    cwd: ROOT,
    stdio: "inherit",
    shell: isWindows,
  });
  const elapsedSeconds = ((Date.now() - startedAt) / 1000).toFixed(1);

  if (result.error) {
    console.error(`Wave 0 gate could not start "${step.label}" after ${elapsedSeconds}s.`);
    console.error(result.error.message);
    return 1;
  }

  if (result.status !== 0) {
    console.error(`Wave 0 gate failed at "${step.label}" after ${elapsedSeconds}s.`);
    return result.status ?? 1;
  }

  console.log(`Passed "${step.label}" in ${elapsedSeconds}s.`);
  return 0;
}

console.log(`Running Wave ${waveArg} gate${skipBuild ? " with build skipped" : ""}${dryRun ? " in dry-run mode" : ""}.`);

for (const step of commands) {
  const status = runStep(step);
  if (status !== 0) {
    process.exit(status);
  }
}

console.log(`\nWave ${waveArg} gate passed with ${commands.length} steps.`);
