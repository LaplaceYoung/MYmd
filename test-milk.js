const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
    page.on('pageerror', error => console.error('BROWSER ERROR:', error.message));

    console.log("Navigating to http://localhost:5175/");
    await page.goto('http://localhost:5175/');
    await page.waitForTimeout(1000);

    const newBtn = await page.getByText('空白文档');
    if (await newBtn.isVisible()) {
        await newBtn.click();
    }
    await page.waitForTimeout(1000);

    const viewTab = await page.getByText('视图', { exact: true });
    await viewTab.click();
    await page.waitForTimeout(500);

    const splitBtn = await page.getByText('源码 & 预览');
    await splitBtn.click();
    await page.waitForTimeout(1000);

    // click codemirror editor directly
    await page.mouse.click(250, 400);

    await page.keyboard.type('$$E=mc^2$$');
    await page.waitForTimeout(2000);

    await browser.close();
})();
