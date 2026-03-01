import { useState } from 'react'
import { FilePlus, FolderOpen, Home, Clock, FileText } from 'lucide-react'
import { TemplateGallery } from './TemplateGallery'
import { SettingsPanel } from '../Settings/SettingsPanel'
import { AccountPanel } from '../Account/AccountPanel'
import { useEditorStore } from '@/stores/editorStore'
import logoSrc from '@/assets/logo.svg'

type WelcomeViewType = 'home' | 'account' | 'settings'

interface WelcomeViewProps {
    handleNewFile: () => void
    handleOpenFile: () => void
    handleOpenRecentFile: (path: string) => void
}

export function WelcomeView({ handleNewFile, handleOpenFile, handleOpenRecentFile }: WelcomeViewProps) {
    const [welcomeView, setWelcomeView] = useState<WelcomeViewType>('home')
    const recentFiles = useEditorStore(s => s.recentFiles)

    const hour = new Date().getHours()
    const greeting = hour < 12 ? '早上好' : hour < 18 ? '下午好' : '晚上好'

    const formatRelativeTime = (timestamp: number) => {
        const diff = Date.now() - timestamp
        const minutes = Math.floor(diff / 60000)
        if (minutes < 1) return '刚刚'
        if (minutes < 60) return `${minutes} 分钟前`
        const hours = Math.floor(minutes / 60)
        if (hours < 24) return `${hours} 小时前`
        const days = Math.floor(hours / 24)
        return `${days} 天前`
    }

    return (
        <div className="welcome-word">
            <div className="welcome-word__sidebar">
                <div className="welcome-word__sidebar-brand">
                    <img src={logoSrc} alt="logo" className="welcome-word__sidebar-logo" />
                    <span className="welcome-word__sidebar-brand-name">MYmd</span>
                </div>

                <div className="welcome-word__sidebar-top">
                    <button
                        className={`welcome-word__sidebar-btn ${welcomeView === 'home' ? 'active' : ''}`}
                        onClick={() => setWelcomeView('home')}
                    >
                        <Home size={28} strokeWidth={1} />
                        <span>开始</span>
                    </button>
                    <button className="welcome-word__sidebar-btn" onClick={handleNewFile}>
                        <FilePlus size={28} strokeWidth={1} />
                        <span>新建</span>
                    </button>
                    <button className="welcome-word__sidebar-btn" onClick={handleOpenFile}>
                        <FolderOpen size={28} strokeWidth={1} />
                        <span>打开</span>
                    </button>
                </div>
                <div className="welcome-word__sidebar-bottom">
                    <div className="welcome-word__sidebar-divider"></div>
                    <button
                        className={`welcome-word__sidebar-btn text-only ${welcomeView === 'account' ? 'active' : ''}`}
                        onClick={() => setWelcomeView('account')}
                    >
                        账户
                    </button>
                    <button
                        className={`welcome-word__sidebar-btn text-only ${welcomeView === 'settings' ? 'active' : ''}`}
                        onClick={() => setWelcomeView('settings')}
                    >
                        选项
                    </button>
                </div>
            </div>

            {welcomeView === 'account' ? (
                <AccountPanel />
            ) : welcomeView === 'settings' ? (
                <SettingsPanel />
            ) : (
                <div className="welcome-word__main">
                    <div className="welcome-word__header">
                        <img src={logoSrc} alt="logo" className="welcome-word__logo" />
                        <h1 className="welcome-word__title">{greeting}</h1>
                    </div>

                    <div className="welcome-word__section">
                        <TemplateGallery />
                    </div>

                    <div className="welcome-word__section">
                        <div className="welcome-word__recent-header">
                            <h2 className="welcome-word__section-title active">最近</h2>
                        </div>
                        <div className="welcome-word__recent-list">
                            <table className="welcome-word__recent-table">
                                <thead>
                                    <tr>
                                        <th>名称</th>
                                        <th>修改时间</th>
                                        <th>位置</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentFiles.length > 0 ? (
                                        recentFiles.map((file, idx) => (
                                            <tr
                                                key={idx}
                                                className="welcome-word__recent-row"
                                                onClick={() => handleOpenRecentFile(file.path)}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <FileText size={16} color="var(--accent)" strokeWidth={1.5} />
                                                        {file.title}
                                                    </div>
                                                </td>
                                                <td>{formatRelativeTime(file.time)}</td>
                                                <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                                                    {file.path.split(/[\\/]/).slice(0, -1).join('\\')}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr className="welcome-word__recent-empty-row">
                                            <td colSpan={3}>
                                                <div className="welcome-word__recent-empty">
                                                    <Clock size={36} color="var(--text-muted)" strokeWidth={1.5} style={{ marginBottom: '8px' }} />
                                                    没有最近打开的文档。
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
