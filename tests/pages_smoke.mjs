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
  await page.waitForSelector("#release-cta", { state: "attached", timeout: 15_000 });
  await page.waitForSelector("#celebrate-btn", { state: "attached", timeout: 15_000 });
  await page.waitForSelector("#latest-version", { state: "attached", timeout: 15_000 });

  const title = await page.title();
  if (!title.includes("MYmd")) {
    throw new Error(`Unexpected page title: ${title}`);
  }

  await page.evaluate(() => {
    const button = document.getElementById("celebrate-btn");
    if (button instanceof HTMLButtonElement) {
      button.click();
    }
  });
  await page.waitForTimeout(220);

  const burstCount = await page.locator("#burst-layer .burst").count();
  if (burstCount === 0) {
    throw new Error("Celebrate button did not create burst particles.");
  }

  const latestVersion = (await page.locator("#latest-version").innerText()).trim();
  const starsText = (await page.locator("#stars-count").innerText()).trim();

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
