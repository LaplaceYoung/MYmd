import { Monitor, Moon, Sun, Type, Info, Palette } from 'lucide-react'
import { useEditorStore } from '@/stores/editorStore'
import type { ThemeMode, ColorScheme } from '@/stores/editorStore'
import './SettingsPanel.css'

/** 配色方案定义 */
const COLOR_SCHEMES: { id: ColorScheme; label: string; color: string }[] = [
    { id: 'default', label: 'Word 蓝', color: '#2b579a' },
    { id: 'aurora-green', label: '极光绿', color: '#10b981' },
    { id: 'sunset-orange', label: '日落橘', color: '#f97316' },
    { id: 'lavender', label: '薰衣草紫', color: '#8b5cf6' },
    { id: 'sakura-pink', label: '樱花粉', color: '#ec4899' },
    { id: 'ocean-cyan', label: '深海青', color: '#06b6d4' },
    { id: 'amber-gold', label: '琥珀金', color: '#d97706' },
    { id: 'graphite', label: '石墨灰', color: '#6b7280' },
]

/** 设置面板：主题/配色/字体等设置 */
export function SettingsPanel() {
    const themeMode = useEditorStore(s => s.themeMode)
    const setThemeMode = useEditorStore(s => s.setThemeMode)
    const colorScheme = useEditorStore(s => s.colorScheme)
    const setColorScheme = useEditorStore(s => s.setColorScheme)
    const editorFontSize = useEditorStore(s => s.editorFontSize)
    const setEditorFontSize = useEditorStore(s => s.setEditorFontSize)

    const themes: { mode: ThemeMode; icon: typeof Sun; label: string }[] = [
        { mode: 'light', icon: Sun, label: '浅色' },
        { mode: 'dark', icon: Moon, label: '深色' },
        { mode: 'system', icon: Monitor, label: '跟随系统' },
    ]

    return (
        <div className="settings-panel">
            <h2 className="settings-panel__title">选项</h2>

            <div className="settings-panel__section">
                <h3 className="settings-panel__section-title">外观</h3>
                <div className="settings-panel__group">
                    <label className="settings-panel__label">主题</label>
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
                        配色方案
                    </label>
                    <div className="settings-panel__scheme-grid">
                        {COLOR_SCHEMES.map(({ id, label, color }) => (
                            <button
                                key={id}
                                className={`settings-panel__scheme-card ${colorScheme === id ? 'active' : ''}`}
                                onClick={() => setColorScheme(id)}
                            >
                                <span
                                    className="settings-panel__scheme-dot"
                                    style={{ background: color }}
                                />
                                <span className="settings-panel__scheme-label">{label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="settings-panel__section">
                <h3 className="settings-panel__section-title">编辑器</h3>
                <div className="settings-panel__group">
                    <label className="settings-panel__label">
                        <Type size={14} />
                        编辑器字号
                    </label>
                    <div className="settings-panel__font-size-row">
                        <input
                            type="range"
                            min="10"
                            max="32"
                            value={editorFontSize}
                            onChange={(e) => setEditorFontSize(Number(e.target.value))}
                            className="settings-panel__slider"
                        />
                        <span className="settings-panel__font-size-value">{editorFontSize}px</span>
                    </div>
                </div>
            </div>

            <div className="settings-panel__section">
                <h3 className="settings-panel__section-title">关于</h3>
                <div className="settings-panel__about">
                    <Info size={16} color="var(--accent)" />
                    <div>
                        <div className="settings-panel__about-name">MYmd</div>
                        <div className="settings-panel__about-ver">版本 1.0.0</div>
                        <div className="settings-panel__about-desc">轻量级 Markdown 桌面编辑器</div>
                    </div>
                </div>
            </div>
        </div>
    )
}
