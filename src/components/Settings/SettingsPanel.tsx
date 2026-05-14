import { useState } from 'react'
import {
    Monitor,
    Moon,
    Sun,
    Type,
    Info,
    Palette,
    FileSpreadsheet,
    Bot,
    KeyRound,
    Link2,
    LayoutTemplate,
    CheckCircle2,
    LoaderCircle,
    Languages,
} from 'lucide-react'
import { useEditorStore } from '@/stores/editorStore'
import { useI18n, type AppLocale } from '@/i18n'
import type {
    ThemeMode,
    ColorScheme,
    PaperOrientation,
    PaperPreset,
    DocumentProfile,
    ExportProfile,
    ExportPageBreakMode,
} from '@/stores/editorStore'
import { verifyAiConnection } from '@/utils/ai'
import './SettingsPanel.css'

const COLOR_SCHEMES: { id: ColorScheme; labelKey: string; color: string }[] = [
    { id: 'default', labelKey: 'settings.schemeDefault', color: '#2b579a' },
    { id: 'aurora-green', labelKey: 'settings.schemeAuroraGreen', color: '#10b981' },
    { id: 'sunset-orange', labelKey: 'settings.schemeSunsetOrange', color: '#f97316' },
    { id: 'lavender', labelKey: 'settings.schemeLavender', color: '#8b5cf6' },
    { id: 'sakura-pink', labelKey: 'settings.schemeSakuraPink', color: '#ec4899' },
    { id: 'ocean-cyan', labelKey: 'settings.schemeOceanCyan', color: '#06b6d4' },
    { id: 'amber-gold', labelKey: 'settings.schemeAmberGold', color: '#d97706' },
    { id: 'graphite', labelKey: 'settings.schemeGraphite', color: '#6b7280' },
]

export function SettingsPanel() {
    const { locale, setLocale, localeOptions, t } = useI18n()
    const themeMode = useEditorStore(s => s.themeMode)
    const setThemeMode = useEditorStore(s => s.setThemeMode)
    const colorScheme = useEditorStore(s => s.colorScheme)
    const setColorScheme = useEditorStore(s => s.setColorScheme)
    const editorFontSize = useEditorStore(s => s.editorFontSize)
    const setEditorFontSize = useEditorStore(s => s.setEditorFontSize)
    const paperPreset = useEditorStore(s => s.paperPreset)
    const paperOrientation = useEditorStore(s => s.paperOrientation)
    const customPaperSize = useEditorStore(s => s.customPaperSize)
    const pageMarginMm = useEditorStore(s => s.pageMarginMm)
    const autoExpandPaperForWideTables = useEditorStore(s => s.autoExpandPaperForWideTables)
    const maxAutoPaperWidthPx = useEditorStore(s => s.maxAutoPaperWidthPx)
    const setPaperPreset = useEditorStore(s => s.setPaperPreset)
    const setPaperOrientation = useEditorStore(s => s.setPaperOrientation)
    const setCustomPaperSize = useEditorStore(s => s.setCustomPaperSize)
    const setPageMarginMm = useEditorStore(s => s.setPageMarginMm)
    const setAutoExpandPaperForWideTables = useEditorStore(s => s.setAutoExpandPaperForWideTables)
    const setMaxAutoPaperWidthPx = useEditorStore(s => s.setMaxAutoPaperWidthPx)
    const documentProfile = useEditorStore(s => s.documentProfile)
    const setDocumentProfile = useEditorStore(s => s.setDocumentProfile)
    const exportProfile = useEditorStore(s => s.exportProfile)
    const setExportProfile = useEditorStore(s => s.setExportProfile)
    const exportOptions = useEditorStore(s => s.exportOptions)
    const setExportShowHeader = useEditorStore(s => s.setExportShowHeader)
    const setExportShowFooter = useEditorStore(s => s.setExportShowFooter)
    const setExportPageBreakMode = useEditorStore(s => s.setExportPageBreakMode)
    const aiConfig = useEditorStore(s => s.aiConfig)
    const setAiConfig = useEditorStore(s => s.setAiConfig)
    const [aiProbeRunning, setAiProbeRunning] = useState(false)
    const [aiProbeMessage, setAiProbeMessage] = useState('')

    const themes: { mode: ThemeMode; icon: typeof Sun; label: string }[] = [
        { mode: 'light', icon: Sun, label: t('settings.themeLight') },
        { mode: 'dark', icon: Moon, label: t('settings.themeDark') },
        { mode: 'system', icon: Monitor, label: t('settings.themeSystem') },
    ]

    const paperPresets: { id: PaperPreset; label: string; detail: string }[] = [
        { id: 'screen', label: t('settings.paperScreen'), detail: t('settings.paperScreenDetail') },
        { id: 'a4', label: 'A4', detail: '210 x 297 mm' },
        { id: 'letter', label: 'Letter', detail: '8.5 x 11 in' },
        { id: 'legal', label: 'Legal', detail: '8.5 x 14 in' },
        { id: 'custom', label: t('settings.paperCustom'), detail: t('settings.paperCustomDetail') },
    ]

    const paperOrientations: { id: PaperOrientation; label: string; detail: string }[] = [
        { id: 'portrait', label: t('settings.orientationPortrait'), detail: t('settings.orientationPortraitDetail') },
        { id: 'landscape', label: t('settings.orientationLandscape'), detail: t('settings.orientationLandscapeDetail') },
    ]

    const documentProfiles: { id: DocumentProfile; label: string; detail: string }[] = [
        { id: 'standard', label: t('settings.profileStandard'), detail: t('settings.profileStandardDetail') },
        { id: 'resume', label: t('settings.profileResume'), detail: t('settings.profileResumeDetail') },
        { id: 'manuscript', label: t('settings.profileManuscript'), detail: t('settings.profileManuscriptDetail') },
    ]

    const exportProfiles: { id: ExportProfile; label: string; detail: string }[] = [
        { id: 'print', label: t('settings.exportPrint'), detail: t('settings.exportPrintDetail') },
        { id: 'share', label: t('settings.exportShare'), detail: t('settings.exportShareDetail') },
        { id: 'web', label: t('settings.exportWeb'), detail: t('settings.exportWebDetail') },
    ]

    const pageBreakModes: { id: ExportPageBreakMode; label: string; detail: string }[] = [
        { id: 'flow', label: t('settings.pageBreakFlow'), detail: t('settings.pageBreakFlowDetail') },
        { id: 'manual', label: t('settings.pageBreakManual'), detail: t('settings.pageBreakManualDetail') },
        { id: 'sections', label: t('settings.pageBreakSections'), detail: t('settings.pageBreakSectionsDetail') },
    ]

    const applySiliconFlowPreset = () => {
        setAiConfig({
            endpoint: 'https://api.siliconflow.cn/v1/chat/completions',
            model: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-7B',
        })
        setAiProbeMessage(t('settings.connectionPresetApplied'))
    }

    const handleAiProbe = async () => {
        if (!aiConfig.endpoint.trim() || !aiConfig.model.trim() || !aiConfig.apiKey.trim()) {
            setAiProbeMessage(t('settings.connectionMissing'))
            return
        }
        setAiProbeRunning(true)
        setAiProbeMessage(t('settings.connectionTesting'))
        try {
            const text = await verifyAiConnection({
                config: aiConfig,
                timeoutMs: 20_000,
            })
            if (text.includes('CONNECTION_OK')) {
                setAiProbeMessage(t('settings.connectionOk'))
            } else {
                setAiProbeMessage(t('settings.connectionUnexpected', { text: text.slice(0, 40) }))
            }
        } catch (error) {
            setAiProbeMessage(error instanceof Error ? error.message : t('settings.connectionFailed'))
        } finally {
            setAiProbeRunning(false)
        }
    }

    return (
        <div className="settings-panel">
            <h2 className="settings-panel__title">{t('settings.title')}</h2>

            <div className="settings-panel__section">
                <h3 className="settings-panel__section-title">{t('settings.appearance')}</h3>
                <div className="settings-panel__group">
                    <label className="settings-panel__label">{t('settings.theme')}</label>
                    <div className="settings-panel__theme-row">
                        {themes.map(({ mode, icon: Icon, label }) => (
                            <button
                                key={mode}
                                className={`settings-panel__theme-btn ${themeMode === mode ? 'active' : ''}`}
                                onClick={() => setThemeMode(mode)}
                            >
                                <Icon size={20} strokeWidth={1.5} />
                                <span>{label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="settings-panel__group">
                    <label className="settings-panel__label">
                        <Palette size={14} />
                        {t('settings.colorScheme')}
                    </label>
                    <div className="settings-panel__scheme-grid">
                        {COLOR_SCHEMES.map(({ id, labelKey, color }) => (
                            <button
                                key={id}
                                className={`settings-panel__scheme-card ${colorScheme === id ? 'active' : ''}`}
                                onClick={() => setColorScheme(id)}
                            >
                                <span className="settings-panel__scheme-dot" style={{ background: color }} />
                                <span className="settings-panel__scheme-label">{t(labelKey)}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="settings-panel__group">
                    <label className="settings-panel__label">
                        <Languages size={14} />
                        {t('settings.language')}
                    </label>
                    <div className="settings-panel__paper-grid">
                        {localeOptions.map((option) => (
                            <button
                                key={option.id}
                                type="button"
                                data-locale-option={option.id}
                                className={`settings-panel__paper-card ${locale === option.id ? 'active' : ''}`}
                                onClick={() => setLocale(option.id as AppLocale)}
                            >
                                <span className="settings-panel__paper-label">
                                    {option.id === 'system' ? t('common.system') : option.nativeLabel}
                                </span>
                                <span className="settings-panel__paper-detail">
                                    {option.id === 'system' ? t('common.followSystem') : option.label}
                                </span>
                            </button>
                        ))}
                    </div>
                    <div className="settings-panel__hint">{t('settings.languageHint')}</div>
                </div>
            </div>

            <div className="settings-panel__section">
                <h3 className="settings-panel__section-title">{t('settings.editor')}</h3>

                <div className="settings-panel__group">
                    <label className="settings-panel__label">
                        <Type size={14} />
                        {t('settings.fontSize')}
                    </label>
                    <div className="settings-panel__font-size-row">
                        <input
                            type="range"
                            min="10"
                            max="32"
                            value={editorFontSize}
                            onChange={e => setEditorFontSize(Number(e.target.value))}
                            className="settings-panel__slider"
                        />
                        <span className="settings-panel__font-size-value">{editorFontSize}px</span>
                    </div>
                </div>

                <div className="settings-panel__group">
                    <label className="settings-panel__label">
                        <FileSpreadsheet size={14} />
                        {t('settings.paperSize')}
                    </label>
                    <div className="settings-panel__paper-grid">
                        {paperPresets.map(preset => (
                            <button
                                key={preset.id}
                                className={`settings-panel__paper-card ${paperPreset === preset.id ? 'active' : ''}`}
                                onClick={() => setPaperPreset(preset.id)}
                            >
                                <span className="settings-panel__paper-label">{preset.label}</span>
                                <span className="settings-panel__paper-detail">{preset.detail}</span>
                            </button>
                        ))}
                    </div>
                    {paperPreset === 'custom' && (
                        <div className="settings-panel__custom-paper-grid">
                            <label className="settings-panel__field">
                                <span className="settings-panel__field-label">Width (mm)</span>
                                <input
                                    type="number"
                                    min="120"
                                    max="420"
                                    className="settings-panel__text-input"
                                    aria-label="Custom paper width"
                                    value={customPaperSize.widthMm}
                                    onChange={e => setCustomPaperSize({ widthMm: Number(e.target.value) })}
                                />
                            </label>
                            <label className="settings-panel__field">
                                <span className="settings-panel__field-label">Height (mm)</span>
                                <input
                                    type="number"
                                    min="120"
                                    max="420"
                                    className="settings-panel__text-input"
                                    aria-label="Custom paper height"
                                    value={customPaperSize.heightMm}
                                    onChange={e => setCustomPaperSize({ heightMm: Number(e.target.value) })}
                                />
                            </label>
                        </div>
                    )}
                    <div className="settings-panel__hint">{t('settings.paperHint')}</div>
                </div>

                <div className="settings-panel__group">
                    <label className="settings-panel__label">
                        <FileSpreadsheet size={14} />
                        {t('settings.paperOrientation')}
                    </label>
                    <div className="settings-panel__paper-grid settings-panel__paper-grid--compact">
                        {paperOrientations.map(orientation => (
                            <button
                                key={orientation.id}
                                className={`settings-panel__paper-card ${paperOrientation === orientation.id ? 'active' : ''}`}
                                onClick={() => setPaperOrientation(orientation.id)}
                            >
                                <span className="settings-panel__paper-label">{orientation.label}</span>
                                <span className="settings-panel__paper-detail">{orientation.detail}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="settings-panel__group">
                    <label className="settings-panel__label">
                        <LayoutTemplate size={14} />
                        {t('settings.pageMargin')}
                    </label>
                    <div className="settings-panel__custom-paper-grid settings-panel__custom-paper-grid--single">
                        <label className="settings-panel__field">
                            <span className="settings-panel__field-label">{t('settings.uniformMargin')}</span>
                            <input
                                type="number"
                                min="8"
                                max="40"
                                className="settings-panel__text-input"
                                aria-label="Page margin"
                                value={pageMarginMm}
                                onChange={e => setPageMarginMm(Number(e.target.value))}
                            />
                        </label>
                    </div>
                    <div className="settings-panel__hint">{t('settings.marginHint')}</div>
                </div>

                <div className="settings-panel__group">
                    <label className="settings-panel__label">
                        <LayoutTemplate size={14} />
                        {t('settings.wideTableHandling')}
                    </label>
                    <div className="settings-panel__toggle-row">
                        <label className="settings-panel__checkbox-card">
                            <input
                                type="checkbox"
                                checked={autoExpandPaperForWideTables}
                                onChange={e => setAutoExpandPaperForWideTables(e.target.checked)}
                            />
                            <span>{t('settings.autoExpandWideTables')}</span>
                        </label>
                    </div>
                    <div className="settings-panel__custom-paper-grid settings-panel__custom-paper-grid--single">
                        <label className="settings-panel__field">
                            <span className="settings-panel__field-label">{t('settings.maxAutoWidth')}</span>
                            <input
                                type="number"
                                min="900"
                                max="2800"
                                className="settings-panel__text-input"
                                aria-label="Max auto paper width"
                                value={maxAutoPaperWidthPx}
                                onChange={e => setMaxAutoPaperWidthPx(Number(e.target.value))}
                                disabled={!autoExpandPaperForWideTables}
                            />
                        </label>
                    </div>
                    <div className="settings-panel__hint">{t('settings.wideTableHint')}</div>
                </div>

                <div className="settings-panel__group">
                    <label className="settings-panel__label">
                        <Type size={14} />
                        {t('settings.layoutProfile')}
                    </label>
                    <div className="settings-panel__paper-grid">
                        {documentProfiles.map(profile => (
                            <button
                                key={profile.id}
                                className={`settings-panel__paper-card ${documentProfile === profile.id ? 'active' : ''}`}
                                onClick={() => setDocumentProfile(profile.id)}
                            >
                                <span className="settings-panel__paper-label">{profile.label}</span>
                                <span className="settings-panel__paper-detail">{profile.detail}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="settings-panel__group">
                    <label className="settings-panel__label">
                        <FileSpreadsheet size={14} />
                        {t('settings.exportProfile')}
                    </label>
                    <div className="settings-panel__paper-grid">
                        {exportProfiles.map(profile => (
                            <button
                                key={profile.id}
                                className={`settings-panel__paper-card ${exportProfile === profile.id ? 'active' : ''}`}
                                onClick={() => setExportProfile(profile.id)}
                            >
                                <span className="settings-panel__paper-label">{profile.label}</span>
                                <span className="settings-panel__paper-detail">{profile.detail}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="settings-panel__group">
                    <label className="settings-panel__label">
                        <LayoutTemplate size={14} />
                        {t('settings.exportChrome')}
                    </label>
                    <div className="settings-panel__toggle-row">
                        <label className="settings-panel__checkbox-card">
                            <input
                                type="checkbox"
                                checked={exportOptions.showHeader}
                                onChange={e => setExportShowHeader(e.target.checked)}
                            />
                            <span>{t('settings.headerBar')}</span>
                        </label>
                        <label className="settings-panel__checkbox-card">
                            <input
                                type="checkbox"
                                checked={exportOptions.showFooter}
                                onChange={e => setExportShowFooter(e.target.checked)}
                            />
                            <span>{t('settings.footerStamp')}</span>
                        </label>
                    </div>
                </div>

                <div className="settings-panel__group">
                    <label className="settings-panel__label">
                        <FileSpreadsheet size={14} />
                        {t('settings.pageBreaks')}
                    </label>
                    <div className="settings-panel__paper-grid">
                        {pageBreakModes.map(mode => (
                            <button
                                key={mode.id}
                                className={`settings-panel__paper-card ${exportOptions.pageBreakMode === mode.id ? 'active' : ''}`}
                                onClick={() => setExportPageBreakMode(mode.id)}
                            >
                                <span className="settings-panel__paper-label">{mode.label}</span>
                                <span className="settings-panel__paper-detail">{mode.detail}</span>
                            </button>
                        ))}
                    </div>
                    <div className="settings-panel__hint">{t('settings.pageBreakHint')}</div>
                </div>
            </div>

            <div className="settings-panel__section">
                <h3 className="settings-panel__section-title">{t('settings.aiAccess')}</h3>
                <div className="settings-panel__group">
                    <label className="settings-panel__label">
                        <Bot size={14} />
                        {t('settings.quickProvider')}
                    </label>
                    <div className="settings-panel__toggle-row">
                        <button className="settings-panel__theme-btn settings-panel__theme-btn--inline" onClick={applySiliconFlowPreset}>
                            <Bot size={16} strokeWidth={1.5} />
                            <span>{t('settings.useSiliconFlow')}</span>
                        </button>
                    </div>
                </div>

                <div className="settings-panel__group">
                    <label className="settings-panel__label">
                        <Link2 size={14} />
                        {t('settings.endpoint')}
                    </label>
                    <input
                        className="settings-panel__text-input"
                        value={aiConfig.endpoint}
                        onChange={e => setAiConfig({ endpoint: e.target.value })}
                        placeholder="https://api.siliconflow.cn/v1/chat/completions"
                    />
                </div>

                <div className="settings-panel__group">
                    <label className="settings-panel__label">
                        <Bot size={14} />
                        {t('settings.model')}
                    </label>
                    <input
                        className="settings-panel__text-input"
                        value={aiConfig.model}
                        onChange={e => setAiConfig({ model: e.target.value })}
                        placeholder="deepseek-ai/DeepSeek-R1-Distill-Qwen-7B"
                    />
                </div>

                <div className="settings-panel__group">
                    <label className="settings-panel__label">
                        <KeyRound size={14} />
                        {t('settings.apiKey')}
                    </label>
                    <input
                        type="password"
                        className="settings-panel__text-input"
                        value={aiConfig.apiKey}
                        onChange={e => setAiConfig({ apiKey: e.target.value })}
                        placeholder="sk-..."
                    />
                    <div className="settings-panel__hint">{t('settings.apiKeyHint')}</div>
                </div>

                <div className="settings-panel__group">
                    <div className="settings-panel__toggle-row">
                        <button
                            className="settings-panel__theme-btn settings-panel__theme-btn--inline"
                            onClick={() => void handleAiProbe()}
                            disabled={aiProbeRunning}
                        >
                            {aiProbeRunning ? <LoaderCircle size={16} className="settings-panel__spin" /> : <CheckCircle2 size={16} strokeWidth={1.5} />}
                            <span>{aiProbeRunning ? t('settings.testing') : t('settings.testConnection')}</span>
                        </button>
                    </div>
                    {aiProbeMessage && <div className="settings-panel__hint">{aiProbeMessage}</div>}
                </div>
            </div>

            <div className="settings-panel__section">
                <h3 className="settings-panel__section-title">{t('settings.about')}</h3>
                <div className="settings-panel__about">
                    <Info size={16} color="var(--accent)" />
                    <div>
                        <div className="settings-panel__about-name">MYmd</div>
                        <div className="settings-panel__about-ver">Version 1.0.0</div>
                        <div className="settings-panel__about-desc">{t('settings.aboutDesc')}</div>
                    </div>
                </div>
            </div>
        </div>
    )
}

