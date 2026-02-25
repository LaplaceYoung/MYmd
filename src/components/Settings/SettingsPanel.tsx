import { Monitor, Moon, Sun, Type, Info } from 'lucide-react'
import { useEditorStore } from '@/stores/editorStore'
import type { ThemeMode } from '@/stores/editorStore'
import './SettingsPanel.css'

/** 设置面板：主题/字体等设置 */
export function SettingsPanel() {
    const themeMode = useEditorStore(s => s.themeMode)
    const setThemeMode = useEditorStore(s => s.setThemeMode)
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
