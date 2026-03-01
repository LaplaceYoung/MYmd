import { test, expect } from '@playwright/test';

test('click view tab and get console logs', async ({ page }) => {
    // Setup console log listener to catch the crash error
    const logs: string[] = [];
    page.on('console', msg => {
        if (msg.type() === 'error' || msg.type() === 'warning') {
            logs.push(`[${msg.type()}] ${msg.text()}`);
        }
    });

    // Also catch uncaught page errors
    page.on('pageerror', exception => {
        logs.push(`[uncaught exception] ${exception}`);
    });

    await page.goto('http://localhost:1420');

    // Wait for the app to load
    await page.waitForSelector('.title-bar', { timeout: 10000 });

    // Find the View tab and click it
    const viewTab = await page.locator('button.ribbon__tab:has-text("视图")');
    await viewTab.waitFor({ state: 'visible' });
    await viewTab.click();

    // Wait a bit to let the crash happen and errors to be collected
    await page.waitForTimeout(2000);

    // Take a screenshot of the crashed state
    await page.screenshot({ path: 'crash_screenshot.png' });

    // Print logs
    console.log('--- BROWSER CONSOLE LOGS ---');
    console.log(logs.join('\n'));
});
