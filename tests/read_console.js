const { chromium } = require('@playwright/test');

(async () => {
    try {
        const browser = await chromium.launch();
        const page = await browser.newPage();

        page.on('console', msg => {
            if (msg.type() === 'error' || msg.type() === 'warning') {
                console.log(`[${msg.type()}] ${msg.text()}`);
            }
        });

        page.on('pageerror', exception => {
            console.log(`[uncaught exception] ${exception.message}`);
        });

        console.log("Navigating to local dev server...");
        await page.goto('http://localhost:5500');

        console.log("Waiting for app to load...");
        await page.waitForSelector('.title-bar', { timeout: 10000 });

        console.log("Clicking View Tab...");
        const viewTab = await page.locator('button.ribbon__tab:has-text("视图")');
        await viewTab.waitFor({ state: 'visible' });
        await viewTab.click();

        console.log("Waiting for potential crash...");
        await page.waitForTimeout(2000);

        console.log("Done. Closing browser.");
        await browser.close();
        process.exit(0);
    } catch (e) {
        console.error("Script failed:", e);
        process.exit(1);
    }
})();
