import { useState, type KeyboardEvent } from 'react'
import { FilePlus, FolderOpen, Home, Clock, FileText } from 'lucide-react'
import { TemplateGallery } from './TemplateGallery'
import { SettingsPanel } from '../Settings/SettingsPanel'
import { AccountPanel } from '../Account/AccountPanel'
import { useEditorStore } from '@/stores/editorStore'
import { useI18n } from '@/i18n'
import logoSrc from '@/assets/logo.svg'

type WelcomeViewType = 'home' | 'account' | 'settings'

interface WelcomeViewProps {
    handleNewFile: () => void
    handleOpenFile: () => void
    handleOpenRecentFile: (path: string) => void
}

export function WelcomeView({ handleNewFile, handleOpenFile, handleOpenRecentFile }: WelcomeViewProps) {
    const { t } = useI18n()
    const [welcomeView, setWelcomeView] = useState<WelcomeViewType>('home')
    const recentFiles = useEditorStore(s => s.recentFiles)

    const hour = new Date().getHours()
    const greeting = hour < 12
        ? t('welcome.greetingMorning')
        : hour < 18
            ? t('welcome.greetingAfternoon')
            : t('welcome.greetingEvening')

    const formatRelativeTime = (timestamp: number) => {
        const diff = Date.now() - timestamp
        const minutes = Math.floor(diff / 60000)
        if (minutes < 1) return t('welcome.justNow')
        if (minutes < 60) return t('welcome.minutesAgo', { count: minutes })
        const hours = Math.floor(minutes / 60)
        if (hours < 24) return t('welcome.hoursAgo', { count: hours })
        const days = Math.floor(hours / 24)
        return t('welcome.daysAgo', { count: days })
    }

    const openRecentFromKeyboard = (event: KeyboardEvent<HTMLTableRowElement>, path: string) => {
        if (event.key !== 'Enter' && event.key !== ' ') return
        event.preventDefault()
        handleOpenRecentFile(path)
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
                        <span>{t('welcome.start')}</span>
                    </button>
                    <button className="welcome-word__sidebar-btn" onClick={handleNewFile}>
                        <FilePlus size={28} strokeWidth={1} />
                        <span>{t('welcome.new')}</span>
                    </button>
                    <button className="welcome-word__sidebar-btn" onClick={handleOpenFile}>
                        <FolderOpen size={28} strokeWidth={1} />
                        <span>{t('welcome.open')}</span>
                    </button>
                </div>
                <div className="welcome-word__sidebar-bottom">
                    <div className="welcome-word__sidebar-divider"></div>
                    <button
                        className={`welcome-word__sidebar-btn text-only ${welcomeView === 'account' ? 'active' : ''}`}
                        onClick={() => setWelcomeView('account')}
                    >
                        {t('welcome.account')}
                    </button>
                    <button
                        className={`welcome-word__sidebar-btn text-only ${welcomeView === 'settings' ? 'active' : ''}`}
                        onClick={() => setWelcomeView('settings')}
                    >
                        {t('welcome.options')}
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
                            <h2 className="welcome-word__section-title active">{t('welcome.recent')}</h2>
                        </div>
                        <div className="welcome-word__recent-list">
                            <table className="welcome-word__recent-table">
                                <thead>
                                    <tr>
                                        <th>{t('welcome.tableName')}</th>
                                        <th>{t('welcome.tableModified')}</th>
                                        <th>{t('welcome.tableLocation')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentFiles.length > 0 ? (
                                        recentFiles.map((file) => (
                                            <tr
                                                key={file.path}
                                                className="welcome-word__recent-row"
                                                role="button"
                                                tabIndex={0}
                                                aria-label={`${t('welcome.open')} ${file.title}`}
                                                onClick={() => handleOpenRecentFile(file.path)}
                                                onKeyDown={(event) => openRecentFromKeyboard(event, file.path)}
                                            >
                                                <td>
                                                    <div className="welcome-word__recent-name">
                                                        <FileText size={16} color="var(--accent)" strokeWidth={1.5} />
                                                        {file.title}
                                                    </div>
                                                </td>
                                                <td>{formatRelativeTime(file.time)}</td>
                                                <td className="welcome-word__recent-location">
                                                    {file.path.split(/[\\/]/).slice(0, -1).join('\\')}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr className="welcome-word__recent-empty-row">
                                            <td colSpan={3}>
                                                <div className="welcome-word__recent-empty">
                                                    <Clock size={36} color="var(--text-muted)" strokeWidth={1.5} style={{ marginBottom: '8px' }} />
                                                    {t('welcome.noRecent')}
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
