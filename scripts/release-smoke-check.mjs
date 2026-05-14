import { spawn } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

const DEFAULT_MARKERS = ["MYmd", "新建", "打开", "工作区", "欢迎使用 MYmd"];

function parseArgs(argv) {
  const options = {
    releaseDir: "",
    electronExe: path.join(repoRoot, "release", "electron", "win-unpacked", "MYmd.exe"),
    tauriExe:
      process.env.MYMD_TAURI_EXE ||
      (process.platform === "win32" ? "E:\\EnvConfig\\rust_target\\release\\app.exe" : ""),
    outputDir: path.join(repoRoot, "test-results"),
    cdpPort: 9444,
    cliCdpPort: 9445,
    markers: DEFAULT_MARKERS,
    skipAssets: false,
    skipElectron: false,
    skipTauri: false,
    skipCliIndexing: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];
    if (arg === "--release-dir") {
      options.releaseDir = path.resolve(repoRoot, next);
      i += 1;
    } else if (arg === "--electron-exe") {
      options.electronExe = path.resolve(repoRoot, next);
      i += 1;
    } else if (arg === "--tauri-exe") {
      options.tauriExe = path.resolve(repoRoot, next);
      i += 1;
    } else if (arg === "--output-dir") {
      options.outputDir = path.resolve(repoRoot, next);
      i += 1;
    } else if (arg === "--cdp-port") {
      options.cdpPort = Number(next);
      i += 1;
    } else if (arg === "--cli-cdp-port") {
      options.cliCdpPort = Number(next);
      i += 1;
    } else if (arg === "--marker") {
      options.markers.push(next);
      i += 1;
    } else if (arg === "--skip-assets") {
      options.skipAssets = true;
    } else if (arg === "--skip-electron") {
      options.skipElectron = true;
    } else if (arg === "--skip-tauri") {
      options.skipTauri = true;
    } else if (arg === "--skip-cli-indexing") {
      options.skipCliIndexing = true;
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!options.releaseDir) {
    options.releaseDir = findLatestReleaseDir();
  }

  return options;
}

function printHelp() {
  console.log(`Release smoke check

Usage:
  node scripts/release-smoke-check.mjs [options]

Options:
  --release-dir <path>   Release staging folder. Defaults to latest release/v* directory.
  --electron-exe <path>  Electron portable executable. Defaults to release/electron/win-unpacked/MYmd.exe.
  --tauri-exe <path>     Tauri executable. Defaults to MYMD_TAURI_EXE or E:\\EnvConfig\\rust_target\\release\\app.exe.
  --output-dir <path>    Smoke output folder. Defaults to test-results.
  --cdp-port <number>    Electron remote debugging port. Defaults to 9444.
  --cli-cdp-port <num>   Tauri CLI indexing remote debugging port. Defaults to 9445.
  --marker <text>        Extra renderer text marker expected in Electron DOM.
  --skip-assets          Skip release asset and SHA256 checks.
  --skip-electron        Skip Electron portable smoke.
  --skip-tauri           Skip Tauri window smoke.
  --skip-cli-indexing    Skip Tauri CLI-open knowledge indexing smoke.
`);
}

function findLatestReleaseDir() {
  const releaseRoot = path.join(repoRoot, "release");
  if (!existsSync(releaseRoot)) return path.join(releaseRoot, "v0.0.0");

  const dirs = readdirSync(releaseRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^v\d+\.\d+\.\d+/.test(entry.name))
    .map((entry) => {
      const fullPath = path.join(releaseRoot, entry.name);
      return { fullPath, mtimeMs: statSync(fullPath).mtimeMs };
    })
    .sort((a, b) => b.mtimeMs - a.mtimeMs);

  return dirs[0]?.fullPath || path.join(releaseRoot, "v0.0.0");
}

function assertFile(filePath, label) {
  if (!existsSync(filePath)) {
    throw new Error(`${label} missing: ${filePath}`);
  }
  const stat = statSync(filePath);
  if (!stat.isFile() || stat.size === 0) {
    throw new Error(`${label} is empty or invalid: ${filePath}`);
  }
  return stat;
}

function hashFile(filePath) {
  const hash = createHash("sha256");
  hash.update(readFileSync(filePath));
  return hash.digest("hex").toUpperCase();
}

function parseChecksumFile(filePath) {
  const content = readFileSync(filePath, "utf8");
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^([a-fA-F0-9]{64})\s+\*?(.+)$/);
      if (!match) throw new Error(`Invalid checksum line: ${line}`);
      return { expectedHash: match[1].toUpperCase(), fileName: match[2].trim() };
    });
}

function checkReleaseAssets(releaseDir) {
  if (!existsSync(releaseDir)) {
    throw new Error(`Release directory missing: ${releaseDir}`);
  }

  const checksumPath = path.join(releaseDir, "SHA256SUMS.txt");
  assertFile(checksumPath, "SHA256SUMS.txt");
  const entries = parseChecksumFile(checksumPath);
  if (entries.length === 0) throw new Error("SHA256SUMS.txt has no entries.");

  const files = readdirSync(releaseDir);
  const hasSetup = files.some((fileName) => /_x64-setup\.exe$/i.test(fileName));
  const hasMsi = files.some((fileName) => /_x64_.*\.msi$/i.test(fileName));
  const hasPortable = files.some((fileName) => /Electron-.*portable\.zip$/i.test(fileName));

  if (!hasSetup) throw new Error("Release directory is missing the NSIS setup exe.");
  if (!hasMsi) throw new Error("Release directory is missing the MSI installer.");
  if (!hasPortable) throw new Error("Release directory is missing the Electron portable zip.");

  const verified = [];
  for (const entry of entries) {
    const filePath = path.join(releaseDir, entry.fileName);
    const stat = assertFile(filePath, entry.fileName);
    const actualHash = hashFile(filePath);
    if (actualHash !== entry.expectedHash) {
      throw new Error(`SHA256 mismatch for ${entry.fileName}: expected ${entry.expectedHash}, got ${actualHash}`);
    }
    verified.push({ fileName: entry.fileName, size: stat.size, sha256: actualHash });
  }

  return { releaseDir, verified };
}

function httpJson(url, timeoutMs = 2000) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, { timeout: timeoutMs }, (res) => {
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => {
        body += chunk;
      });
      res.on("end", () => {
        try {
          resolve(JSON.parse(body));
        } catch (error) {
          reject(error);
        }
      });
    });
    req.on("timeout", () => {
      req.destroy(new Error(`Timed out fetching ${url}`));
    });
    req.on("error", reject);
  });
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForCdp(port, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  let lastError = null;
  while (Date.now() < deadline) {
    try {
      const pages = await httpJson(`http://127.0.0.1:${port}/json/list`);
      if (Array.isArray(pages) && pages.length > 0) return pages;
    } catch (error) {
      lastError = error;
    }
    await wait(500);
  }
  throw new Error(`CDP endpoint unavailable on port ${port}: ${lastError?.message || "timeout"}`);
}

function cdpClient(webSocketUrl) {
  if (typeof WebSocket === "undefined") {
    throw new Error("Global WebSocket is unavailable in this Node runtime.");
  }

  let id = 0;
  const pending = new Map();
  const events = [];
  const ws = new WebSocket(webSocketUrl);

  ws.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      pending.get(message.id)(message);
      pending.delete(message.id);
      return;
    }
    if (
      message.method === "Runtime.exceptionThrown" ||
      message.method === "Runtime.consoleAPICalled" ||
      message.method === "Log.entryAdded"
    ) {
      events.push(message);
    }
  });

  function send(method, params = {}) {
    const messageId = ++id;
    ws.send(JSON.stringify({ id: messageId, method, params }));
    return new Promise((resolve) => pending.set(messageId, resolve));
  }

  const opened = new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve, { once: true });
    ws.addEventListener("error", reject, { once: true });
  });

  return {
    opened,
    events,
    send,
    close: () => ws.close(),
  };
}

async function smokeElectron(options) {
  const stat = assertFile(options.electronExe, "Electron executable");
  const port = options.cdpPort;
  const screenshotPath = path.join(options.outputDir, "release-electron-smoke-cdp.png");
  const summaryPath = path.join(options.outputDir, "release-electron-smoke-summary.json");
  const child = spawn(options.electronExe, [`--remote-debugging-port=${port}`], {
    cwd: path.dirname(options.electronExe),
    windowsHide: true,
    stdio: "ignore",
  });

  try {
    const pages = await waitForCdp(port, 30000);
    const page = pages.find((entry) => entry.type === "page") || pages[0];
    if (!page?.webSocketDebuggerUrl) throw new Error("Electron CDP page has no websocket URL.");

    const client = cdpClient(page.webSocketDebuggerUrl);
    await client.opened;
    await client.send("Runtime.enable");
    await client.send("Log.enable");
    await client.send("Page.enable");
    await client.send("Emulation.setDeviceMetricsOverride", {
      width: 1400,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await wait(4000);

    const bodyTextResult = await client.send("Runtime.evaluate", {
      expression: "document.body ? document.body.innerText : ''",
      returnByValue: true,
    });
    const rootLengthResult = await client.send("Runtime.evaluate", {
      expression: "document.getElementById('root')?.innerHTML.length || 0",
      returnByValue: true,
    });
    const titleResult = await client.send("Runtime.evaluate", {
      expression: "document.title",
      returnByValue: true,
    });
    const screenshotResult = await client.send("Page.captureScreenshot", {
      format: "png",
      fromSurface: true,
      captureBeyondViewport: true,
    });

    const bodyText = String(bodyTextResult.result?.result?.value || "");
    const rootHtmlLength = Number(rootLengthResult.result?.result?.value || 0);
    const title = String(titleResult.result?.result?.value || page.title || "");
    const screenshotBytes = Buffer.from(screenshotResult.result.data, "base64");
    writeFileSync(screenshotPath, screenshotBytes);

    const blockingEvents = client.events.filter((event) => {
      if (event.method === "Runtime.exceptionThrown") return true;
      if (event.method === "Log.entryAdded") return event.params?.entry?.level === "error";
      if (event.method === "Runtime.consoleAPICalled") return event.params?.type === "error";
      return false;
    });

    const markerHit = options.markers.some((marker) => bodyText.includes(marker));
    if (!markerHit) {
      throw new Error(`Electron DOM text missed expected markers: ${options.markers.join(", ")}`);
    }
    if (rootHtmlLength < 1000) {
      throw new Error(`Electron root HTML is too small: ${rootHtmlLength}`);
    }
    if (screenshotBytes.length < 10000) {
      throw new Error(`Electron screenshot is too small: ${screenshotBytes.length} bytes`);
    }
    if (blockingEvents.length > 0) {
      throw new Error(`Electron renderer has blocking events: ${JSON.stringify(blockingEvents.slice(0, 3))}`);
    }

    const summary = {
      executable: options.electronExe,
      executableSize: stat.size,
      title,
      url: page.url,
      rootHtmlLength,
      bodyTextSample: bodyText.slice(0, 240),
      screenshotPath,
      screenshotBytes: screenshotBytes.length,
      blockingEventCount: blockingEvents.length,
    };
    writeFileSync(summaryPath, `${JSON.stringify(summary, null, 2)}\n`);
    client.close();
    return summary;
  } finally {
    await killProcessTree(child.pid);
  }
}

async function killProcessTree(pid) {
  if (!pid) return;
  if (process.platform === "win32") {
    await new Promise((resolve) => {
      const killer = spawn("taskkill", ["/PID", String(pid), "/T", "/F"], { windowsHide: true, stdio: "ignore" });
      killer.on("close", resolve);
      killer.on("error", resolve);
    });
    return;
  }

  try {
    process.kill(pid, "SIGTERM");
  } catch {
    // already exited
  }
}

function writeTauriSmokeScript(scriptPath, options) {
  const exe = options.tauriExe.replace(/'/g, "''");
  const screenshot = path.join(options.outputDir, "release-tauri-smoke-printwindow.png").replace(/'/g, "''");

  const content = `$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
Add-Type -AssemblyName System.Drawing
Add-Type @'
using System;
using System.Runtime.InteropServices;
public class Win32ReleaseSmoke {
  [DllImport("user32.dll")] public static extern bool PrintWindow(IntPtr hwnd, IntPtr hdcBlt, uint nFlags);
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
  public struct RECT { public int Left; public int Top; public int Right; public int Bottom; }
}
'@
$exe = '${exe}'
$screenshot = '${screenshot}'
if (!(Test-Path -LiteralPath $exe)) { throw "Missing Tauri executable: $exe" }
if (Test-Path -LiteralPath $screenshot) { Remove-Item -LiteralPath $screenshot -Force }
$p = Start-Process -FilePath $exe -PassThru
try {
  $hwnd = [IntPtr]::Zero
  for ($i = 0; $i -lt 80; $i++) {
    Start-Sleep -Milliseconds 500
    $p.Refresh()
    if ($p.HasExited) { throw "Tauri process exited early with code $($p.ExitCode)" }
    if ($p.MainWindowHandle -ne 0) { $hwnd = $p.MainWindowHandle; break }
  }
  if ($hwnd -eq [IntPtr]::Zero) { throw 'No main window handle found' }
  [Win32ReleaseSmoke]::SetForegroundWindow($hwnd) | Out-Null
  Start-Sleep -Seconds 6
  $rect = New-Object Win32ReleaseSmoke+RECT
  [Win32ReleaseSmoke]::GetWindowRect($hwnd, [ref]$rect) | Out-Null
  $w = [Math]::Max(1, $rect.Right - $rect.Left)
  $h = [Math]::Max(1, $rect.Bottom - $rect.Top)
  $bmp = New-Object System.Drawing.Bitmap $w, $h
  $gfx = [System.Drawing.Graphics]::FromImage($bmp)
  $hdc = $gfx.GetHdc()
  $ok = [Win32ReleaseSmoke]::PrintWindow($hwnd, $hdc, 2)
  $gfx.ReleaseHdc($hdc)
  $gfx.Dispose()
  $bmp.Save($screenshot, [System.Drawing.Imaging.ImageFormat]::Png)
  $sampleCount = 0
  $minLum = 255
  $maxLum = 0
  $sum = 0
  $stepX = [Math]::Max(1, [int]($w / 80))
  $stepY = [Math]::Max(1, [int]($h / 80))
  for ($x = 0; $x -lt $w; $x += $stepX) {
    for ($y = 0; $y -lt $h; $y += $stepY) {
      $c = $bmp.GetPixel($x, $y)
      $lum = [int](0.2126*$c.R + 0.7152*$c.G + 0.0722*$c.B)
      $sum += $lum
      $sampleCount++
      if ($lum -lt $minLum) { $minLum = $lum }
      if ($lum -gt $maxLum) { $maxLum = $lum }
    }
  }
  $avg = [Math]::Round($sum / [Math]::Max(1,$sampleCount), 2)
  $bmp.Dispose()
  $fileSize = (Get-Item -LiteralPath $screenshot).Length
  $result = [pscustomobject]@{
    executable = $exe
    title = $p.MainWindowTitle
    printWindow = $ok
    screenshotPath = $screenshot
    width = $w
    height = $h
    avgLuminance = $avg
    minLuminance = $minLum
    maxLuminance = $maxLum
    contrast = ($maxLum - $minLum)
    screenshotBytes = $fileSize
  }
  $result | ConvertTo-Json -Compress
} finally {
  if ($p -and !$p.HasExited) { Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue }
  Get-Process app -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
}
`;

  // Windows PowerShell 5 handles non-ASCII script paths and literals more reliably with a UTF-8 BOM.
  writeFileSync(scriptPath, `\uFEFF${content}`, "utf8");
}

async function smokeTauri(options) {
  const stat = assertFile(options.tauriExe, "Tauri executable");
  const scriptPath = path.join(options.outputDir, "release-tauri-smoke.ps1");
  const screenshotPath = path.join(options.outputDir, "release-tauri-smoke-printwindow.png");
  writeTauriSmokeScript(scriptPath, options);

  const result = await new Promise((resolve, reject) => {
    const child = spawn("powershell", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", scriptPath], {
      cwd: repoRoot,
      windowsHide: true,
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`Tauri smoke failed with code ${code}: ${stderr || stdout}`));
        return;
      }
      try {
        resolve(JSON.parse(stdout.trim()));
      } catch (error) {
        reject(new Error(`Failed to parse Tauri smoke output: ${error.message}\n${stdout}\n${stderr}`));
      }
    });
  });

  if (!result.title || !result.title.includes("MYmd")) {
    throw new Error(`Tauri window title is unexpected: ${result.title}`);
  }
  if (result.screenshotBytes < 10000) {
    throw new Error(`Tauri screenshot is too small: ${result.screenshotBytes} bytes`);
  }
  if (result.contrast < 20) {
    throw new Error(`Tauri screenshot contrast is too low: ${result.contrast}`);
  }

  return { ...result, screenshotPath, executableSize: stat.size };
}

async function evaluateCdp(client, expression) {
  const result = await client.send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });

  if (result.result?.exceptionDetails) {
    throw new Error(`CDP evaluation failed: ${JSON.stringify(result.result.exceptionDetails)}`);
  }

  return result.result?.result?.value;
}

function normalizePathForCompare(filePath) {
  return String(filePath || "").replace(/\\/g, "/").toLowerCase();
}

function jsString(value) {
  return JSON.stringify(String(value));
}

async function smokeCliIndexing(options) {
  const stat = assertFile(options.tauriExe, "Tauri executable");
  const port = options.cliCdpPort;
  const tempDir = path.join(options.outputDir, "cli-indexing-smoke");
  mkdirSync(tempDir, { recursive: true });

  const token = `mymd-cli-index-${randomUUID()}`;
  const filePath = path.join(tempDir, `CLI Index ${Date.now()}.md`);
  const markdown = [
    "# CLI Index Smoke",
    "",
    "This document verifies CLI open indexing.",
    "",
    token,
    "",
    "#cli-index-smoke",
    "",
  ].join("\n");
  writeFileSync(filePath, markdown, "utf8");

  const screenshotPath = path.join(options.outputDir, "release-cli-indexing-smoke-cdp.png");
  const summaryPath = path.join(options.outputDir, "release-cli-indexing-smoke-summary.json");
  const child = spawn(options.tauriExe, [filePath], {
    cwd: path.dirname(options.tauriExe),
    env: {
      ...process.env,
      WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS: `--remote-debugging-port=${port}`,
    },
    windowsHide: true,
    stdio: "ignore",
  });

  try {
    const pages = await waitForCdp(port, 30000);
    const page = pages.find((entry) => entry.type === "page") || pages[0];
    if (!page?.webSocketDebuggerUrl) throw new Error("Tauri CDP page has no websocket URL.");

    const client = cdpClient(page.webSocketDebuggerUrl);
    await client.opened;
    await client.send("Runtime.enable");
    await client.send("Log.enable");
    await client.send("Page.enable");
    await client.send("Emulation.setDeviceMetricsOverride", {
      width: 1400,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });

    const expectedPathKey = normalizePathForCompare(filePath);
    let pageState = null;
    for (let attempt = 0; attempt < 40; attempt += 1) {
      pageState = await evaluateCdp(
        client,
        `(async () => ({
          href: location.href,
          title: document.title,
          args: await window.__TAURI_INTERNALS__?.invoke?.("get_cli_args"),
          body: document.body?.innerText || "",
          rootHtmlLength: document.getElementById("root")?.innerHTML.length || 0
        }))()`,
      );

      const args = Array.isArray(pageState?.args) ? pageState.args.map(normalizePathForCompare) : [];
      const hasArg = args.some((arg) => arg === expectedPathKey);
      const hasBody = String(pageState?.body || "").includes(token);
      if (hasArg && hasBody) break;
      await wait(500);
    }

    if (!pageState || !String(pageState.body || "").includes(token)) {
      throw new Error("CLI-opened document text did not render in the Tauri window.");
    }

    const args = Array.isArray(pageState.args) ? pageState.args.map(normalizePathForCompare) : [];
    if (!args.some((arg) => arg === expectedPathKey)) {
      throw new Error(`Tauri get_cli_args did not include the CLI file path: ${filePath}`);
    }

    let knowledgeResult = null;
    for (let attempt = 0; attempt < 40; attempt += 1) {
      knowledgeResult = await evaluateCdp(
        client,
        `(async () => ({
          token: await window.__TAURI_INTERNALS__?.invoke?.("knowledge_query", { searchText: ${jsString(token)}, limit: 30, offset: 0 }),
          heading: await window.__TAURI_INTERNALS__?.invoke?.("knowledge_query", { searchText: "CLI Index Smoke", limit: 30, offset: 0 }),
          tag: await window.__TAURI_INTERNALS__?.invoke?.("knowledge_query", { searchText: "cli-index-smoke", limit: 30, offset: 0 })
        }))()`,
      );

      const documents = knowledgeResult?.token?.documents || [];
      const headings = knowledgeResult?.heading?.headings || [];
      const tags = knowledgeResult?.tag?.tags || [];
      const hasDocument = documents.some((item) => normalizePathForCompare(item.file_path) === expectedPathKey);
      const hasHeading = headings.some((item) => normalizePathForCompare(item.file_path) === expectedPathKey);
      const hasTag = tags.some((item) => normalizePathForCompare(item.file_path) === expectedPathKey);
      if (hasDocument && hasHeading && hasTag) break;
      await wait(500);
    }

    const documents = knowledgeResult?.token?.documents || [];
    const headings = knowledgeResult?.heading?.headings || [];
    const tags = knowledgeResult?.tag?.tags || [];
    const hasDocument = documents.some((item) => normalizePathForCompare(item.file_path) === expectedPathKey);
    const hasHeading = headings.some((item) => normalizePathForCompare(item.file_path) === expectedPathKey);
    const hasTag = tags.some((item) => normalizePathForCompare(item.file_path) === expectedPathKey);

    if (!hasDocument) throw new Error("CLI-opened document was not returned by knowledge document search.");
    if (!hasHeading) throw new Error("CLI-opened document heading was not returned by knowledge heading search.");
    if (!hasTag) throw new Error("CLI-opened document tag was not returned by knowledge tag search.");

    const screenshotResult = await client.send("Page.captureScreenshot", {
      format: "png",
      fromSurface: true,
      captureBeyondViewport: true,
    });
    const screenshotBytes = Buffer.from(screenshotResult.result.data, "base64");
    writeFileSync(screenshotPath, screenshotBytes);

    const blockingEvents = client.events.filter((event) => {
      if (event.method === "Runtime.exceptionThrown") return true;
      if (event.method === "Log.entryAdded") return event.params?.entry?.level === "error";
      if (event.method === "Runtime.consoleAPICalled") return event.params?.type === "error";
      return false;
    });

    if (blockingEvents.length > 0) {
      throw new Error(`Tauri CLI indexing smoke has blocking events: ${JSON.stringify(blockingEvents.slice(0, 3))}`);
    }
    if (screenshotBytes.length < 10000) {
      throw new Error(`Tauri CLI indexing screenshot is too small: ${screenshotBytes.length} bytes`);
    }

    const summary = {
      executable: options.tauriExe,
      executableSize: stat.size,
      filePath,
      token,
      title: pageState.title,
      rootHtmlLength: pageState.rootHtmlLength,
      documentHits: documents.length,
      headingHits: headings.length,
      tagHits: tags.length,
      screenshotPath,
      screenshotBytes: screenshotBytes.length,
      blockingEventCount: blockingEvents.length,
    };
    writeFileSync(summaryPath, `${JSON.stringify(summary, null, 2)}\n`);
    client.close();
    return summary;
  } finally {
    await killProcessTree(child.pid);
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  mkdirSync(options.outputDir, { recursive: true });

  const results = {
    generatedAt: new Date().toISOString(),
    releaseDir: options.releaseDir,
    checks: {},
  };

  if (!options.skipAssets) {
    results.checks.assets = checkReleaseAssets(options.releaseDir);
  }

  if (!options.skipElectron) {
    results.checks.electron = await smokeElectron(options);
  }

  if (!options.skipTauri) {
    results.checks.tauri = await smokeTauri(options);
  }

  if (!options.skipCliIndexing) {
    results.checks.cliIndexing = await smokeCliIndexing(options);
  }

  const summaryPath = path.join(options.outputDir, "release-smoke-summary.json");
  writeFileSync(summaryPath, `${JSON.stringify(results, null, 2)}\n`);
  console.log(JSON.stringify(results, null, 2));
  console.log(`Release smoke check passed. Summary: ${summaryPath}`);
}

main().catch((error) => {
  console.error(`Release smoke check failed: ${error.stack || error.message}`);
  process.exit(1);
});
