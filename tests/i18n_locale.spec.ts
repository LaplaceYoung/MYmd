import { expect, test } from '@playwright/test'
import { resolveAppLocale, tForLocale } from '@/i18n'

test('resolves Chinese system locales to zh-CN and other locales to en-US', () => {
    expect(resolveAppLocale('system', 'zh-CN')).toBe('zh-CN')
    expect(resolveAppLocale('system', 'zh-TW')).toBe('zh-CN')
    expect(resolveAppLocale('system', 'en-US')).toBe('en-US')
    expect(resolveAppLocale('ja-JP')).toBe('en-US')
    expect(resolveAppLocale('fr-FR')).toBe('en-US')
})

test('returns clean localized strings without mixed-language fallback for zh and en', () => {
    expect(tForLocale('zh-CN', 'settings.title')).toBe('设置')
    expect(tForLocale('zh-CN', 'ai.title')).toBe('AI 助手')
    expect(tForLocale('en-US', 'settings.title')).toBe('Settings')
    expect(tForLocale('en-US', 'ai.title')).toBe('AI Assistant')
})

test('falls back non-Chinese locales to consistent English UI copy', () => {
    expect(tForLocale('ja-JP', 'settings.title')).toBe('Settings')
    expect(tForLocale('de-DE', 'search.openGlobal')).toBe('Open global search')
    expect(tForLocale('es-ES', 'status.ai')).toBe('AI assistant')
})
