import { Monitor, Moon, Sun, Type, Info, Palette, FileSpreadsheet, Bot, KeyRound, Link2, LayoutTemplate } from 'lucide-react'
import { useEditorStore } from '@/stores/editorStore'
import type {
    ThemeMode,
    ColorScheme,
    PaperPreset,
    DocumentProfile,
    ExportProfile,
    ExportPageBreakMode
} from '@/stores/editorStore'
import { getDocumentProfileMeta, getExportProfileMeta, getPaperPresetMeta } from '@/utils/paper'
import './SettingsPanel.css'

const COLOR_SCHEMES: { id: ColorScheme; label: string; color: string }[] = [
    { id: 'default', label: 'Word Blue', color: '#2b579a' },
    { id: 'aurora-green', label: 'Aurora Green', color: '#10b981' },
    { id: 'sunset-orange', label: 'Sunset Orange', color: '#f97316' },
    { id: 'lavender', label: 'Lavender', color: '#8b5cf6' },
    { id: 'sakura-pink', label: 'Sakura Pink', color: '#ec4899' },
    { id: 'ocean-cyan', label: 'Ocean Cyan', color: '#06b6d4' },
    { id: 'amber-gold', label: 'Amber Gold', color: '#d97706' },
    { id: 'graphite', label: 'Graphite', color: '#6b7280' }
]

const PAPER_PRESETS: { id: PaperPreset; label: string; detail: string }[] = [
    getPaperPresetMeta('screen'),
    getPaperPresetMeta('a4'),
    getPaperPresetMeta('letter'),
    getPaperPresetMeta('legal'),
    getPaperPresetMeta('custom')
]

const DOCUMENT_PROFILES: { id: DocumentProfile; label: string; detail: string }[] = [
    getDocumentProfileMeta('standard'),
    getDocumentProfileMeta('resume'),
    getDocumentProfileMeta('manuscript')
]

const EXPORT_PROFILES: { id: ExportProfile; label: string; detail: string }[] = [
    getExportProfileMeta('print'),
    getExportProfileMeta('share'),
    getExportProfileMeta('web')
]

const PAGE_BREAK_MODES: { id: ExportPageBreakMode; label: string; detail: string }[] = [
    { id: 'flow', label: 'Flow', detail: 'No forced section pagination.' },
    { id: 'manual', label: 'Manual', detail: 'Only explicit pagebreak markers create a new page.' },
    { id: 'sections', label: 'Sections', detail: 'Insert page breaks before each H1 section.' },
]

export function SettingsPanel() {
    const themeMode = useEditorStore(s => s.themeMode)
    const setThemeMode = useEditorStore(s => s.setThemeMode)
    const colorScheme = useEditorStore(s => s.colorScheme)
    const setColorScheme = useEditorStore(s => s.setColorScheme)
    const editorFontSize = useEditorStore(s => s.editorFontSize)
    const setEditorFontSize = useEditorStore(s => s.setEditorFontSize)
    const paperPreset = useEditorStore(s => s.paperPreset)
    const customPaperSize = useEditorStore(s => s.customPaperSize)
    const setPaperPreset = useEditorStore(s => s.setPaperPreset)
    const setCustomPaperSize = useEditorStore(s => s.setCustomPaperSize)
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

    const themes: { mode: ThemeMode; icon: typeof Sun; label: string }[] = [
        { mode: 'light', icon: Sun, label: 'Light' },
        { mode: 'dark', icon: Moon, label: 'Dark' },
        { mode: 'system', icon: Monitor, label: 'System' }
    ]

    return (
        <div className="settings-panel">
            <h2 className="settings-panel__title">Settings</h2>

            <div className="settings-panel__section">
                <h3 className="settings-panel__section-title">Appearance</h3>
                <div className="settings-panel__group">
                    <label className="settings-panel__label">Theme</label>
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
                        Color Scheme
                    </label>
                    <div className="settings-panel__scheme-grid">
                        {COLOR_SCHEMES.map(({ id, label, color }) => (
                            <button
                                key={id}
                                className={`settings-panel__scheme-card ${colorScheme === id ? 'active' : ''}`}
                                onClick={() => setColorScheme(id)}
                            >
                                <span className="settings-panel__scheme-dot" style={{ background: color }} />
                                <span className="settings-panel__scheme-label">{label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="settings-panel__section">
                <h3 className="settings-panel__section-title">Editor</h3>
                <div className="settings-panel__group">
                    <label className="settings-panel__label">
                        <Type size={14} />
                        Font Size
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
                        Paper Size
                    </label>
                    <div className="settings-panel__paper-grid">
                        {PAPER_PRESETS.map(preset => (
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
                    <div className="settings-panel__hint">
                        Custom paper size flows through the editor canvas and HTML export together.
                    </div>
                </div>

                <div className="settings-panel__group">
                    <label className="settings-panel__label">
                        <Type size={14} />
                        Layout Profile
                    </label>
                    <div className="settings-panel__paper-grid">
                        {DOCUMENT_PROFILES.map(profile => (
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
                        Export Profile
                    </label>
                    <div className="settings-panel__paper-grid">
                        {EXPORT_PROFILES.map(profile => (
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
                        Export Chrome
                    </label>
                    <div className="settings-panel__toggle-row">
                        <label className="settings-panel__checkbox-card">
                            <input
                                type="checkbox"
                                checked={exportOptions.showHeader}
                                onChange={e => setExportShowHeader(e.target.checked)}
                            />
                            <span>Header bar</span>
                        </label>
                        <label className="settings-panel__checkbox-card">
                            <input
                                type="checkbox"
                                checked={exportOptions.showFooter}
                                onChange={e => setExportShowFooter(e.target.checked)}
                            />
                            <span>Footer stamp</span>
                        </label>
                    </div>
                </div>

                <div className="settings-panel__group">
                    <label className="settings-panel__label">
                        <FileSpreadsheet size={14} />
                        Page Breaks
                    </label>
                    <div className="settings-panel__paper-grid">
                        {PAGE_BREAK_MODES.map(mode => (
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
                    <div className="settings-panel__hint">
                        Manual mode recognizes <code>&lt;!-- pagebreak --&gt;</code> and <code>:::pagebreak</code>.
                    </div>
                </div>
            </div>

            <div className="settings-panel__section">
                <h3 className="settings-panel__section-title">AI Access</h3>
                <div className="settings-panel__group">
                    <label className="settings-panel__label">
                        <Link2 size={14} />
                        Endpoint
                    </label>
                    <input
                        className="settings-panel__text-input"
                        value={aiConfig.endpoint}
                        onChange={e => setAiConfig({ endpoint: e.target.value })}
                        placeholder="https://api.openai.com/v1/chat/completions"
                    />
                </div>
                <div className="settings-panel__group">
                    <label className="settings-panel__label">
                        <Bot size={14} />
                        Model
                    </label>
                    <input
                        className="settings-panel__text-input"
                        value={aiConfig.model}
                        onChange={e => setAiConfig({ model: e.target.value })}
                        placeholder="gpt-4.1-mini"
                    />
                </div>
                <div className="settings-panel__group">
                    <label className="settings-panel__label">
                        <KeyRound size={14} />
                        API Key
                    </label>
                    <input
                        type="password"
                        className="settings-panel__text-input"
                        value={aiConfig.apiKey}
                        onChange={e => setAiConfig({ apiKey: e.target.value })}
                        placeholder="sk-..."
                    />
                    <div className="settings-panel__hint">
                        Uses an OpenAI-compatible Chat Completions endpoint. You can later switch to a proxy or self-hosted model.
                    </div>
                </div>
            </div>

            <div className="settings-panel__section">
                <h3 className="settings-panel__section-title">About</h3>
                <div className="settings-panel__about">
                    <Info size={16} color="var(--accent)" />
                    <div>
                        <div className="settings-panel__about-name">MYmd</div>
                        <div className="settings-panel__about-ver">Version 1.0.0</div>
                        <div className="settings-panel__about-desc">
                            Local-first Markdown desktop editor with stronger print layout, knowledge workflow, and AI-assisted editing.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
