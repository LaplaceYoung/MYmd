import { expect, test } from '@playwright/test'
import {
    buildLocalAssetFileName,
    buildLocalAssetRelativePath,
    imageExtensionFromMime,
    sanitizeAssetBaseName,
} from '../src/utils/localAssets'

test('local asset names are stable for identical image bytes', () => {
    const bytes = new Uint8Array([137, 80, 78, 71, 1, 2, 3])

    const first = buildLocalAssetFileName(bytes, 'clipboard image.png', 'image/png')
    const second = buildLocalAssetFileName(bytes, 'clipboard image.png', 'image/png')

    expect(first).toBe(second)
    expect(first).toMatch(/^clipboard-image-[a-z0-9]+\.png$/)
    expect(buildLocalAssetRelativePath(first)).toBe(`assets/${first}`)
})

test('local asset names use content hash to separate changed bytes', () => {
    const first = buildLocalAssetFileName(new Uint8Array([1, 2, 3]), 'diagram.png', 'image/png')
    const second = buildLocalAssetFileName(new Uint8Array([1, 2, 4]), 'diagram.png', 'image/png')

    expect(first).not.toBe(second)
    expect(first).toMatch(/^diagram-[a-z0-9]+\.png$/)
    expect(second).toMatch(/^diagram-[a-z0-9]+\.png$/)
})

test('local asset names sanitize unsafe path segments and extensions', () => {
    const bytes = new Uint8Array([1])

    expect(sanitizeAssetBaseName('../bad:name image')).toBe('bad-name-image')
    expect(buildLocalAssetFileName(bytes, 'screen-shot.exe', 'image/webp')).toMatch(/^screen-shot-[a-z0-9]+\.webp$/)
})

test('local asset names infer image extensions from mime types', () => {
    expect(imageExtensionFromMime('image/jpeg')).toBe('jpg')
    expect(imageExtensionFromMime('image/svg+xml')).toBe('svg')
    expect(buildLocalAssetFileName(new Uint8Array([1]), 'pasted-image', 'image/jpeg')).toMatch(/^pasted-image-[a-z0-9]+\.jpg$/)
})
