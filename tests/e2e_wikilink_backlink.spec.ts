import { test } from '@playwright/test'

test.skip('wikilink to backlink closure with heading jump (requires Tauri workspace + fs)', async () => {
    // This scenario requires workspace markdown files on disk:
    // 1) create note A and note B with [[A#Heading]]
    // 2) trigger indexing
    // 3) verify backlink panel on A shows B with snippet
    // 4) click backlink and assert heading jump behavior
})
