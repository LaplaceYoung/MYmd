import { useState, useRef, useEffect, useMemo } from 'react'
import {
    Search,
    ChevronRight,
    FilePlus,
    FolderOpen,
    FileText,
    PanelsTopLeft,
    Link2,
    Network,
    List,
    FolderTree,
    Type,
    SpellCheck
} from 'lucide-react'
import { useEditorStore } from '@/stores/editorStore'
import { useEditorShortcuts } from '@/components/Editor/hooks/useEditorShortcuts'

export function TopSearchMenu() {
    const [isFocused, setIsFocused] = useState(false)
    const [inputValue, setInputValue] = useState('')
    const inputRef = useRef<HTMLInputElement>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const setSearchVisible = useEditorStore(s => s.setSearchVisible)
    const openGlobalSearch = useEditorStore(s => s.openGlobalSearch)
    const watermark = useEditorStore(s => s.watermark)
    const setWatermark = useEditorStore(s => s.setWatermark)
    const spellcheck = useEditorStore(s => s.spellcheck)
    const setSpellcheck = useEditorStore(s => s.setSpellcheck)
    const backlinksVisible = useEditorStore(s => s.backlinksVisible)
    const setBacklinksVisible = useEditorStore(s => s.setBacklinksVisible)
    const knowledgeGraphVisible = useEditorStore(s => s.knowledgeGraphVisible)
    const setKnowledgeGraphVisible = useEditorStore(s => s.setKnowledgeGraphVisible)
    const fileExplorerVisible = useEditorStore(s => s.fileExplorerVisible)
    const setFileExplorerVisible = useEditorStore(s => s.setFileExplorerVisible)
    const tocVisible = useEditorStore(s => s.tocVisible)
    const setTocVisible = useEditorStore(s => s.setTocVisible)
    const activeWorkspace = useEditorStore(s => s.activeWorkspace)
    const recentFiles = useEditorStore(s => s.recentFiles)
    const { handleNewFile, handleOpenFile, handleOpenRecentFile } = useEditorShortcuts()

    const activeTab = useEditorStore(s => {
        const id = s.activeTabId
        return s.tabs.find(t => t.id === id)
    })

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.altKey && e.key.toLowerCase() === 'q') {
                e.preventDefault()
                inputRef.current?.focus()
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(e.target as Node) &&
                inputRef.current &&
                !inputRef.current.contains(e.target as Node)
            ) {
                setIsFocused(false)
            }
        }

        if (isFocused) {
            window.addEventListener('mousedown', handleClickOutside)
        }
        return () => window.removeEventListener('mousedown', handleClickOutside)
    }, [isFocused])

    const closeMenu = () => {
        setIsFocused(false)
        inputRef.current?.blur()
    }

    const handleSearchKnowledge = () => {
        openGlobalSearch(inputValue.trim())
        closeMenu()
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            handleSearchKnowledge()
        }
    }

    const actions = useMemo(() => {
        const primary = [
            {
                id: 'search-knowledge',
                text: inputValue.trim() ? `搜索 “${inputValue.trim()}”` : '打开全局搜索',
                description: inputValue.trim() ? '在笔记、标题、标签与扩展结果中检索。' : 'Ctrl+P 搜知识库内容。',
                icon: <Search size={16} />,
                action: handleSearchKnowledge,
                section: 'primary',
                arrow: true
            },
            {
                id: 'new-note',
                text: '新建文档',
                description: '从空白页开始写。',
                icon: <FilePlus size={16} />,
                action: () => {
                    handleNewFile()
                    closeMenu()
                },
                section: 'primary',
                arrow: false
            },
            {
                id: 'open-file',
                text: '打开本地文件',
                description: '继续已有 Markdown 文档。',
                icon: <FolderOpen size={16} />,
                action: () => {
                    void handleOpenFile()
                    closeMenu()
                },
                section: 'primary',
                arrow: false
            }
        ]

        const recent = recentFiles.slice(0, 3).map(file => ({
            id: `recent:${file.path}`,
            text: `继续 ${file.title}`,
            description: file.path,
            icon: <FileText size={16} />,
            action: () => {
                void handleOpenRecentFile(file.path)
                closeMenu()
            },
            section: 'recent',
            arrow: false
        }))

        const workspaceActions = [
            {
                id: 'search-current',
                text: '在当前文档中查找',
                description: 'Ctrl+F 搜当前文件内容。',
                icon: <PanelsTopLeft size={16} />,
                action: () => {
                    setSearchVisible(true)
                    closeMenu()
                },
                section: 'workspace',
                arrow: true
            },
            {
                id: 'toggle-backlinks',
                text: backlinksVisible ? '隐藏反向链接' : '显示反向链接',
                description: '查看哪些文档引用当前笔记。',
                icon: <Link2 size={16} />,
                action: () => {
                    setBacklinksVisible(!backlinksVisible)
                    closeMenu()
                },
                section: 'workspace',
                arrow: false
            },
            {
                id: 'toggle-toc',
                text: tocVisible ? '隐藏目录' : '显示目录',
                description: '快速浏览当前文档结构。',
                icon: <List size={16} />,
                action: () => {
                    setTocVisible(!tocVisible)
                    closeMenu()
                },
                section: 'workspace',
                arrow: false
            },
            {
                id: 'toggle-explorer',
                text: fileExplorerVisible ? '隐藏文件树' : '显示文件树',
                description: activeWorkspace ? '浏览当前工作区。' : '打开后可浏览工作区文档。',
                icon: <FolderTree size={16} />,
                action: () => {
                    setFileExplorerVisible(!fileExplorerVisible)
                    closeMenu()
                },
                section: 'workspace',
                arrow: false
            },
            {
                id: 'toggle-graph',
                text: knowledgeGraphVisible ? '隐藏知识图谱' : '打开知识图谱',
                description: activeWorkspace ? '高级视图：查看文档链接网络。' : '仅在工作区内容较多时才需要。',
                icon: <Network size={16} />,
                action: () => {
                    setKnowledgeGraphVisible(!knowledgeGraphVisible)
                    closeMenu()
                },
                section: 'workspace',
                arrow: false
            },
            {
                id: 'toggle-watermark',
                text: watermark ? '关闭水印' : '打开水印',
                description: '调整编辑器展示样式。',
                icon: <Type size={16} />,
                action: () => {
                    setWatermark(!watermark)
                    closeMenu()
                },
                section: 'preferences',
                arrow: false
            },
            {
                id: 'toggle-spellcheck',
                text: spellcheck ? '关闭拼写检查' : '开启拼写检查',
                description: '减少输入时的低级错误。',
                icon: <SpellCheck size={16} />,
                action: () => {
                    setSpellcheck(!spellcheck)
                    closeMenu()
                },
                section: 'preferences',
                arrow: false
            }
        ]

        return [...primary, ...recent, ...workspaceActions]
    }, [
        activeWorkspace,
        backlinksVisible,
        fileExplorerVisible,
        handleNewFile,
        handleOpenFile,
        handleOpenRecentFile,
        inputValue,
        knowledgeGraphVisible,
        openGlobalSearch,
        recentFiles,
        setBacklinksVisible,
        setFileExplorerVisible,
        setKnowledgeGraphVisible,
        setSearchVisible,
        setSpellcheck,
        setTocVisible,
        setWatermark,
        spellcheck,
        tocVisible,
        watermark
    ])

    const query = inputValue.trim().toLowerCase()
    const filteredActions = query
        ? actions.filter(item => `${item.text} ${item.description}`.toLowerCase().includes(query))
        : actions

    const sections = {
        primary: filteredActions.filter(item => item.section === 'primary'),
        recent: filteredActions.filter(item => item.section === 'recent'),
        workspace: filteredActions.filter(item => item.section === 'workspace'),
        preferences: filteredActions.filter(item => item.section === 'preferences')
    }

    const helperText = activeTab
        ? '输入关键词后回车直接搜知识库，Alt+Q 可快速聚焦。'
        : '先新建或打开文档，再逐步用上搜索和链接能力。'

    return (
        <div className={`top-search-menu ${isFocused ? 'is-focused' : ''}`}>
            <div className="top-search-menu__input-wrapper">
                <Search size={14} className="top-search-menu__icon" />
                <input
                    ref={inputRef}
                    type="text"
                    className="top-search-menu__input"
                    placeholder="搜索笔记、命令或最近文档 (Alt+Q / Ctrl+P)"
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onKeyDown={handleKeyDown}
                />
            </div>

            {isFocused && (
                <div className="top-search-dropdown" ref={dropdownRef}>
                    {filteredActions.length === 0 ? (
                        <div className="top-search-dropdown__empty">
                            <div className="top-search-dropdown__empty-title">没有找到匹配项</div>
                            <div className="top-search-dropdown__empty-copy">按 Enter 仍可直接搜索知识库。</div>
                        </div>
                    ) : (
                        <>
                            {sections.primary.length > 0 && (
                                <div className="top-search-dropdown__section">
                                    <div className="top-search-dropdown__section-title">主任务</div>
                                    {sections.primary.map(item => (
                                        <div
                                            key={item.id}
                                            className="top-search-item"
                                            onMouseDown={e => {
                                                e.preventDefault()
                                                item.action()
                                            }}
                                        >
                                            {item.icon}
                                            <div className="top-search-item__copy">
                                                <span className="top-search-item__text">{item.text}</span>
                                                <span className="top-search-item__meta">{item.description}</span>
                                            </div>
                                            {item.arrow && <ChevronRight size={14} className="top-search-item__arrow" />}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {sections.recent.length > 0 && (
                                <div className="top-search-dropdown__section">
                                    <div className="top-search-dropdown__section-title">继续最近文档</div>
                                    {sections.recent.map(item => (
                                        <div
                                            key={item.id}
                                            className="top-search-item"
                                            onMouseDown={e => {
                                                e.preventDefault()
                                                item.action()
                                            }}
                                        >
                                            {item.icon}
                                            <div className="top-search-item__copy">
                                                <span className="top-search-item__text">{item.text}</span>
                                                <span className="top-search-item__meta">{item.description}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {sections.workspace.length > 0 && (
                                <div className="top-search-dropdown__section">
                                    <div className="top-search-dropdown__section-title">编辑与知识增强</div>
                                    {sections.workspace.map(item => (
                                        <div
                                            key={item.id}
                                            className="top-search-item"
                                            onMouseDown={e => {
                                                e.preventDefault()
                                                item.action()
                                            }}
                                        >
                                            {item.icon}
                                            <div className="top-search-item__copy">
                                                <span className="top-search-item__text">{item.text}</span>
                                                <span className="top-search-item__meta">{item.description}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {sections.preferences.length > 0 && (
                                <div className="top-search-dropdown__section">
                                    <div className="top-search-dropdown__section-title">展示与偏好</div>
                                    {sections.preferences.map(item => (
                                        <div
                                            key={item.id}
                                            className="top-search-item"
                                            onMouseDown={e => {
                                                e.preventDefault()
                                                item.action()
                                            }}
                                        >
                                            {item.icon}
                                            <div className="top-search-item__copy">
                                                <span className="top-search-item__text">{item.text}</span>
                                                <span className="top-search-item__meta">{item.description}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                    <div className="top-search-dropdown__footer">{helperText}</div>
                </div>
            )}
        </div>
    )
}


