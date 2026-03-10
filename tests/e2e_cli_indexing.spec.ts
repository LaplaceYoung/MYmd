import { test } from '@playwright/test'

test.skip('cli open should index knowledge immediately (requires Tauri runtime)', async () => {
    // This scenario requires desktop runtime with file-association/CLI args:
    // 1) launch app with markdown path argument
    // 2) verify opened tab exists
    // 3) verify global search returns this document without manual save/open cycle
})
