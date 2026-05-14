import { chromium } from "playwright";

const url = process.argv[2] ?? "http://127.0.0.1:4173";
const screenshotPath = "test-results/pages-home.png";

const errorLogs = [];

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 2200 } });

page.on("console", (msg) => {
  if (msg.type() === "error") {
    errorLogs.push(msg.text());
  }
});

try {
  await page.goto(url, { waitUntil: "networkidle", timeout: 60_000 });
  await page.waitForSelector("#hero", { state: "attached", timeout: 15_000 });
  await page.waitForSelector(".brand-logo", { state: "attached", timeout: 15_000 });
  await page.waitForSelector("#mobile-toggle", { state: "attached", timeout: 15_000 });
  await page.waitForSelector("#latest-version", { state: "attached", timeout: 15_000 });

  const title = await page.title();
  if (!title.includes("MYmd")) {
    throw new Error(`Unexpected page title: ${title}`);
  }

  const logoReady = await page.locator(".brand-logo").evaluate((img) => {
    return img instanceof HTMLImageElement && img.complete && img.naturalWidth > 0;
  });
  if (!logoReady) throw new Error("Brand logo did not load.");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator("#mobile-toggle").click();
  await page.waitForSelector("#mobile-menu.is-active", { state: "attached", timeout: 5_000 });
  await page.locator("#mobile-close").click();
  await page.waitForFunction(() => !document.getElementById("mobile-menu")?.classList.contains("is-active"));

  const latestVersion = (await page.locator("#latest-version").innerText()).trim();
  const starsText = await page.locator("#stars-count").count()
    ? (await page.locator("#stars-count").innerText()).trim()
    : "hidden";

  await page.evaluate(async () => {
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    window.scrollTo({ top: document.body.scrollHeight, behavior: "auto" });
    await wait(180);
    window.scrollTo({ top: 0, behavior: "auto" });
    await wait(120);
  });

  await page.screenshot({ path: screenshotPath, fullPage: true });

  const result = {
    ok: true,
    url,
    title,
    latestVersion,
    starsText,
    screenshotPath,
    consoleErrorCount: errorLogs.length
  };

  console.log(JSON.stringify(result, null, 2));

  if (errorLogs.length > 0) {
    throw new Error(`Console errors found:\n${errorLogs.join("\n")}`);
  }
} finally {
  await browser.close();
}
