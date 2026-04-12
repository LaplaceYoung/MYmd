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
    SpellCheck,
    type LucideIcon,
} from 'lucide-react'
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { useEditorStore } from '@/stores/editorStore'
import { useEditorShortcuts } from '@/components/Editor/hooks/useEditorShortcuts'
import { useI18n } from '@/i18n'

interface SearchAction {
    id: string
    text: string
    description: string
    icon: ReactNode
    action: () => void
    section: 'primary' | 'recent' | 'workspace' | 'preferences'
    arrow: boolean
}

function buildIcon(Icon: LucideIcon) {
    return <Icon size={16} />
}

export function TopSearchMenu() {
    const { t } = useI18n()
    const [isFocused, setIsFocused] = useState(false)
    const [inputValue, setInputValue] = useState('')
    const [activeIndex, setActiveIndex] = useState(0)
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
        return s.tabs.find(tab => tab.id === id)
    })

    useEffect(() => {
        const handleGlobalKeyDown = (event: KeyboardEvent) => {
            const normalizedKey = event.key.toLowerCase()
            if ((event.ctrlKey || event.metaKey) && normalizedKey === 'k') {
                event.preventDefault()
                inputRef.current?.focus()
                return
            }
            if (event.altKey && normalizedKey === 'q') {
                event.preventDefault()
                inputRef.current?.focus()
            }
        }

        window.addEventListener('keydown', handleGlobalKeyDown)
        return () => window.removeEventListener('keydown', handleGlobalKeyDown)
    }, [])

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node) &&
                inputRef.current &&
                !inputRef.current.contains(event.target as Node)
            ) {
                setIsFocused(false)
                setActiveIndex(0)
            }
        }

        if (isFocused) {
            window.addEventListener('mousedown', handleClickOutside)
        }
        return () => window.removeEventListener('mousedown', handleClickOutside)
    }, [isFocused])

    const closeMenu = () => {
        setIsFocused(false)
        setActiveIndex(0)
        inputRef.current?.blur()
    }

    const handleSearchKnowledge = () => {
        openGlobalSearch(inputValue.trim())
        closeMenu()
    }

    const actions = useMemo<SearchAction[]>(() => {
        const primary: SearchAction[] = [
            {
                id: 'search-knowledge',
                text: inputValue.trim() ? t('search.searchFor', { query: inputValue.trim() }) : t('search.openGlobal'),
                description: t('search.searchDesc'),
                icon: buildIcon(Search),
                action: handleSearchKnowledge,
                section: 'primary',
                arrow: true,
            },
            {
                id: 'new-note',
                text: t('search.newFile'),
                description: t('search.newDesc'),
                icon: buildIcon(FilePlus),
                action: () => {
                    handleNewFile()
                    closeMenu()
                },
                section: 'primary',
                arrow: false,
            },
            {
                id: 'open-file',
                text: t('search.openFile'),
                description: t('search.openDesc'),
                icon: buildIcon(FolderOpen),
                action: () => {
                    void handleOpenFile()
                    closeMenu()
                },
                section: 'primary',
                arrow: false,
            },
        ]

        const recent: SearchAction[] = recentFiles.slice(0, 3).map(file => ({
            id: `recent:${file.path}`,
            text: t('search.resumeFile', { title: file.title }),
            description: file.path,
            icon: buildIcon(FileText),
            action: () => {
                void handleOpenRecentFile(file.path)
                closeMenu()
            },
            section: 'recent',
            arrow: false,
        }))

        const workspaceActions: SearchAction[] = [
            {
                id: 'search-current',
                text: t('search.searchCurrent'),
                description: t('search.searchCurrentDesc'),
                icon: buildIcon(PanelsTopLeft),
                action: () => {
                    setSearchVisible(true)
                    closeMenu()
                },
                section: 'workspace',
                arrow: true,
            },
            {
                id: 'toggle-backlinks',
                text: backlinksVisible ? t('search.hideBacklinks') : t('search.showBacklinks'),
                description: t('search.backlinksDesc'),
                icon: buildIcon(Link2),
                action: () => {
                    setBacklinksVisible(!backlinksVisible)
                    closeMenu()
                },
                section: 'workspace',
                arrow: false,
            },
            {
                id: 'toggle-toc',
                text: tocVisible ? t('search.hideToc') : t('search.showToc'),
                description: t('search.tocDesc'),
                icon: buildIcon(List),
                action: () => {
                    setTocVisible(!tocVisible)
                    closeMenu()
                },
                section: 'workspace',
                arrow: false,
            },
            {
                id: 'toggle-explorer',
                text: fileExplorerVisible ? t('search.hideExplorer') : t('search.showExplorer'),
                description: activeWorkspace ? t('search.explorerDescWorkspace') : t('search.explorerDescNoWorkspace'),
                icon: buildIcon(FolderTree),
                action: () => {
                    setFileExplorerVisible(!fileExplorerVisible)
                    closeMenu()
                },
                section: 'workspace',
                arrow: false,
            },
            {
                id: 'toggle-graph',
                text: knowledgeGraphVisible ? t('search.hideGraph') : t('search.showGraph'),
                description: activeWorkspace ? t('search.graphDescWorkspace') : t('search.graphDescNoWorkspace'),
                icon: buildIcon(Network),
                action: () => {
                    setKnowledgeGraphVisible(!knowledgeGraphVisible)
                    closeMenu()
                },
                section: 'workspace',
                arrow: false,
            },
            {
                id: 'toggle-watermark',
                text: watermark ? t('search.disableWatermark') : t('search.enableWatermark'),
                description: t('search.watermarkDesc'),
                icon: buildIcon(Type),
                action: () => {
                    setWatermark(!watermark)
                    closeMenu()
                },
                section: 'preferences',
                arrow: false,
            },
            {
                id: 'toggle-spellcheck',
                text: spellcheck ? t('search.disableSpellcheck') : t('search.enableSpellcheck'),
                description: t('search.spellcheckDesc'),
                icon: buildIcon(SpellCheck),
                action: () => {
                    setSpellcheck(!spellcheck)
                    closeMenu()
                },
                section: 'preferences',
                arrow: false,
            },
        ]

        return [...primary, ...recent, ...workspaceActions]
    }, [activeWorkspace, backlinksVisible, fileExplorerVisible, handleNewFile, handleOpenFile, handleOpenRecentFile, inputValue, knowledgeGraphVisible, recentFiles, setBacklinksVisible, setFileExplorerVisible, setKnowledgeGraphVisible, setSearchVisible, setSpellcheck, setTocVisible, setWatermark, spellcheck, t, tocVisible, watermark])

    const query = inputValue.trim().toLowerCase()
    const filteredActions = query
        ? actions.filter(item => `${item.text} ${item.description}`.toLowerCase().includes(query))
        : actions

    useEffect(() => {
        if (!isFocused) return
        if (filteredActions.length === 0) {
            setActiveIndex(-1)
            return
        }
        setActiveIndex(current => {
            if (current < 0) return 0
            if (current >= filteredActions.length) return filteredActions.length - 1
            return current
        })
    }, [filteredActions, isFocused])

    const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'ArrowDown') {
            event.preventDefault()
            if (filteredActions.length === 0) return
            setActiveIndex(current => (current + 1) % filteredActions.length)
            return
        }

        if (event.key === 'ArrowUp') {
            event.preventDefault()
            if (filteredActions.length === 0) return
            setActiveIndex(current => (current - 1 + filteredActions.length) % filteredActions.length)
            return
        }

        if (event.key === 'Escape') {
            event.preventDefault()
            closeMenu()
            return
        }

        if (event.key === 'Enter') {
            event.preventDefault()
            const selectedAction = filteredActions[activeIndex]
            if (selectedAction) {
                selectedAction.action()
            } else {
                handleSearchKnowledge()
            }
        }
    }

    const sections = {
        primary: filteredActions.filter(item => item.section === 'primary'),
        recent: filteredActions.filter(item => item.section === 'recent'),
        workspace: filteredActions.filter(item => item.section === 'workspace'),
        preferences: filteredActions.filter(item => item.section === 'preferences'),
    }

    const helperText = activeTab ? t('search.helperActive') : t('search.helperIdle')

    let renderIndex = -1
    const renderActionItem = (item: SearchAction) => {
        renderIndex += 1
        const itemIndex = renderIndex
        const isActive = itemIndex === activeIndex

        return (
            <div
                key={item.id}
                className={`top-search-item${isActive ? ' top-search-item--active' : ''}`}
                onMouseEnter={() => setActiveIndex(itemIndex)}
                onMouseDown={event => {
                    event.preventDefault()
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
        )
    }

    return (
        <div className={`top-search-menu ${isFocused ? 'is-focused' : ''}`}>
            <div className="top-search-menu__input-wrapper">
                <Search size={14} className="top-search-menu__icon" />
                <input
                    ref={inputRef}
                    type="text"
                    className="top-search-menu__input"
                    placeholder={t('search.placeholder')}
                    value={inputValue}
                    onChange={event => setInputValue(event.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onKeyDown={handleInputKeyDown}
                />
            </div>

            {isFocused && (
                <div className="top-search-dropdown" ref={dropdownRef}>
                    {filteredActions.length === 0 ? (
                        <div className="top-search-dropdown__empty">
                            <div className="top-search-dropdown__empty-title">{t('search.emptyTitle')}</div>
                            <div className="top-search-dropdown__empty-copy">{t('search.emptyDesc')}</div>
                        </div>
                    ) : (
                        <>
                            {sections.primary.length > 0 && (
                                <div className="top-search-dropdown__section">
                                    <div className="top-search-dropdown__section-title">{t('search.sectionPrimary')}</div>
                                    {sections.primary.map(renderActionItem)}
                                </div>
                            )}

                            {sections.recent.length > 0 && (
                                <div className="top-search-dropdown__section">
                                    <div className="top-search-dropdown__section-title">{t('search.sectionRecent')}</div>
                                    {sections.recent.map(renderActionItem)}
                                </div>
                            )}

                            {sections.workspace.length > 0 && (
                                <div className="top-search-dropdown__section">
                                    <div className="top-search-dropdown__section-title">{t('search.sectionWorkspace')}</div>
                                    {sections.workspace.map(renderActionItem)}
                                </div>
                            )}

                            {sections.preferences.length > 0 && (
                                <div className="top-search-dropdown__section">
                                    <div className="top-search-dropdown__section-title">{t('search.sectionPreferences')}</div>
                                    {sections.preferences.map(renderActionItem)}
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
