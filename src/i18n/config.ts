export type AppLocale =
    | 'system'
    | 'en-US'
    | 'zh-CN'
    | 'ja-JP'
    | 'ko-KR'
    | 'fr-FR'
    | 'de-DE'
    | 'es-ES'

export type ResolvedAppLocale = 'en-US' | 'zh-CN'

export interface LocaleOption {
    id: AppLocale
    label: string
    nativeLabel: string
}

export const APP_LOCALE_OPTIONS: LocaleOption[] = [
    { id: 'system', label: 'System', nativeLabel: 'Follow system' },
    { id: 'en-US', label: 'English', nativeLabel: 'English' },
    { id: 'zh-CN', label: 'Simplified Chinese', nativeLabel: '简体中文' },
    { id: 'ja-JP', label: 'Japanese', nativeLabel: '日本語' },
    { id: 'ko-KR', label: 'Korean', nativeLabel: '한국어' },
    { id: 'fr-FR', label: 'French', nativeLabel: 'Français' },
    { id: 'de-DE', label: 'German', nativeLabel: 'Deutsch' },
    { id: 'es-ES', label: 'Spanish', nativeLabel: 'Español' },
]

export function resolveAppLocale(
    locale: AppLocale,
    systemLocale: string = typeof navigator !== 'undefined' ? navigator.language : 'en-US'
): ResolvedAppLocale {
    const source = locale === 'system' ? systemLocale : locale
    return source.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en-US'
}
