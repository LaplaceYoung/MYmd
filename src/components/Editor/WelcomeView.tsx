import { useMemo, useState } from 'react'
import { FilePlus, FolderOpen, Home, Clock, FileText, Search, Link2, Sparkles } from 'lucide-react'
import { TemplateGallery } from './TemplateGallery'
import './WelcomeView.css'
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
    const openGlobalSearch = useEditorStore(s => s.openGlobalSearch)

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

    const quickGuide = [
        { id: 'write', title: '先开始写', description: '新建一篇 Markdown，先把内容写出来。' },
        { id: 'search', title: '再用全局搜索', description: '需要找资料时，按 Ctrl+P 搜文档、标题和标签。' },
        { id: 'link', title: '最后再连接知识', description: '输入 [[ 建立文档链接，反向链接会自动回流。' }
    ]

    const knowledgeHighlights = [
        {
            id: 'search',
            icon: Search,
            title: '全局搜索',
            description: '按 Ctrl+P，直接搜笔记、标题、标签和扩展结果。'
        },
        {
            id: 'backlinks',
            icon: Link2,
            title: '反向链接',
            description: '保存文档后，侧栏会自然显示谁在引用它。'
        },
        {
            id: 'flow',
            icon: Sparkles,
            title: '轻量知识流',
            description: '先写，再连接，再逐步进入图谱和插件等高级能力。'
        }
    ]

    const continueFile = useMemo(() => recentFiles[0] ?? null, [recentFiles])

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
                        设置
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
                        <div className="welcome-word__hero-copy">
                            <div className="welcome-word__eyebrow">Local-first Markdown knowledge workflow</div>
                            <h1 className="welcome-word__title">{greeting}</h1>
                            <p className="welcome-word__subtitle">
                                先打开或新建文档，直接开始写。知识连接会在你需要的时候自然出现，而不是一开始就要求你学习整套系统。
                            </p>
                        </div>
                    </div>

                    <div className="welcome-word__section">
                        <div className="welcome-word__section-header">
                            <h2 className="welcome-word__section-title">立刻开始</h2>
                            <span className="welcome-word__section-caption">把第一分钟留给写作，而不是设置。</span>
                        </div>
                        <div className="welcome-word__action-grid">
                            <button className="welcome-word__action-card welcome-word__action-card--primary" onClick={handleNewFile}>
                                <FilePlus size={18} />
                                <div>
                                    <div className="welcome-word__action-title">新建文档</div>
                                    <div className="welcome-word__action-copy">空白开始，马上写 Markdown。</div>
                                </div>
                            </button>
                            <button className="welcome-word__action-card" onClick={handleOpenFile}>
                                <FolderOpen size={18} />
                                <div>
                                    <div className="welcome-word__action-title">打开本地文件</div>
                                    <div className="welcome-word__action-copy">继续已有笔记或工作区内容。</div>
                                </div>
                            </button>
                            <button
                                className="welcome-word__action-card"
                                onClick={() => continueFile && handleOpenRecentFile(continueFile.path)}
                                disabled={!continueFile}
                            >
                                <Clock size={18} />
                                <div>
                                    <div className="welcome-word__action-title">继续最近文档</div>
                                    <div className="welcome-word__action-copy">
                                        {continueFile ? continueFile.title : '最近打开的文档会显示在这里。'}
                                    </div>
                                </div>
                            </button>
                            <button className="welcome-word__action-card" onClick={() => openGlobalSearch()}>
                                <Search size={18} />
                                <div>
                                    <div className="welcome-word__action-title">打开全局搜索</div>
                                    <div className="welcome-word__action-copy">按 Ctrl+P 搜笔记、标题和标签。</div>
                                </div>
                            </button>
                        </div>
                    </div>

                    <div className="welcome-word__section welcome-word__section--split">
                        <div className="welcome-word__guide-card">
                            <div className="welcome-word__section-header">
                                <h2 className="welcome-word__section-title">30 秒上手路径</h2>
                                <span className="welcome-word__section-caption">只需要理解三件事。</span>
                            </div>
                            <div className="welcome-word__guide-list">
                                {quickGuide.map((item, index) => (
                                    <div key={item.id} className="welcome-word__guide-item">
                                        <div className="welcome-word__guide-index">0{index + 1}</div>
                                        <div>
                                            <div className="welcome-word__guide-title">{item.title}</div>
                                            <div className="welcome-word__guide-copy">{item.description}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="welcome-word__knowledge-card">
                            <div className="welcome-word__section-header">
                                <h2 className="welcome-word__section-title">默认只露出三件知识能力</h2>
                                <span className="welcome-word__section-caption">链接建议、反向链接、全局搜索。</span>
                            </div>
                            <div className="welcome-word__knowledge-grid">
                                {knowledgeHighlights.map(item => {
                                    const Icon = item.icon
                                    return (
                                        <div key={item.id} className="welcome-word__knowledge-item">
                                            <div className="welcome-word__knowledge-icon">
                                                <Icon size={16} />
                                            </div>
                                            <div className="welcome-word__knowledge-title">{item.title}</div>
                                            <div className="welcome-word__knowledge-copy">{item.description}</div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="welcome-word__section">
                        <div className="welcome-word__section-header">
                            <h2 className="welcome-word__section-title">模板</h2>
                            <span className="welcome-word__section-caption">需要时再用模板，不打断主路径。</span>
                        </div>
                        <TemplateGallery />
                    </div>

                    <div className="welcome-word__section">
                        <div className="welcome-word__section-header">
                            <h2 className="welcome-word__section-title">最近文档</h2>
                            <span className="welcome-word__section-caption">从你离开的地方继续。</span>
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
                                                    还没有最近文档。先新建一篇，或者打开一个本地 Markdown 文件。
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

