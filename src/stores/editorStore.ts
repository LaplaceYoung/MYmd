import { create } from 'zustand'
import { invoke } from '@tauri-apps/api/core'
import { indexKnowledgeDocument, rebuildWorkspaceIndex } from '@/knowledge/service'
// 单个标签页
export interface Tab {
    /** 唯一标识 */
    id: string
    /** 文件路径（null 表示新建未保存文件） */
    filePath: string | null
    /** 显示标题 */
    title: string
    /** 文档内容 */
    content: string
    /** 是否有未保存修改 */
    isDirty: boolean
}

// 视图模式
export type ViewMode = 'wysiwyg' | 'split'

// 编辑器命令执行器类型
export type CommandExecutor = (cmd: string, payload?: unknown) => void

// 插入弹窗类型
export type InsertDialogType = 'link' | 'image' | null

// 主题类型
export type ThemeMode = 'light' | 'dark' | 'system'

// 配色方案
export type ColorScheme = 'default' | 'aurora-green' | 'sunset-orange' | 'lavender' | 'sakura-pink' | 'ocean-cyan' | 'amber-gold' | 'graphite'

// 数学公式编辑浮层定位信息
export interface MathEditRect {
    left: number
    top: number
    width: number
    height: number
}

// 数学公式编辑上下文
export interface MathEditState {
    rect: MathEditRect
    targetPos: number
    value: string
    nodeType: 'math_inline' | 'math_block'
}

export interface PluginCommand {
    id: string
    title: string
    run: (payload?: unknown) => void
}

export interface PluginSidebarCard {
    id: string
    title: string
    description?: string
    actionLabel?: string
    onAction?: () => void
}

export interface PluginSearchHit {
    id: string
    title: string
    subtitle?: string
    onSelect: () => void
}

export interface PluginSearchProvider {
    id: string
    search: (query: string) => Promise<PluginSearchHit[]>
}

type SaveTabResult = 'saved' | 'cancelled' | 'failed'

interface EditorState {
    /** 所有标签页 */
    tabs: Tab[]
    /** 当前活跃标签的 ID */
    activeTabId: string | null
    /** 视图模式 */
    viewMode: ViewMode
    /** 缩放比例 */
    zoom: number
    /** 最近打开的文件列表 */
    recentFiles: { path: string; title: string; time: number }[]
    /** 编辑器命令执行器集合（支持多实例如源码和预览模式同时响应） */
    editorCommands: Record<string, CommandExecutor>
    /** 当前光标处激活的文本标记 */
    activeMarks: string[]
    /** 当前打开的插入弹窗类型 */
    insertDialog: InsertDialogType
    /** 搜索栏是否可见 */
    searchVisible: boolean
    /** 全局知识检索弹窗是否可见 */
    globalSearchVisible: boolean
    /** 全局知识检索弹窗的初始/当前查询词 */
    globalSearchQuery: string
    /** Recent search terms used by the in-editor search bar */
    searchHistory: string[]
    /** Max number of search terms to keep */
    searchHistoryLimit: number
    /** 主题模式 */
    themeMode: ThemeMode
    /** 配色方案 */
    colorScheme: ColorScheme
    /** 编辑器字号 */
    editorFontSize: number
    /** 是否开启拼写检查 */
    spellcheck: boolean
    /** 是否显示水印 */
    watermark: boolean
    /** 是否开启专注模式 */
    focusMode: boolean
    /** 是否开启打字机模式 (光标居中) */
    typewriterMode: boolean
    /** 是否显示 TOC (大纲) 侧边栏 */
    tocVisible: boolean
    /** 是否显示反向链接侧边栏 */
    backlinksVisible: boolean
    /** 是否显示文件浏览侧边栏 */
    fileExplorerVisible: boolean
    /** 当前打开的文件夹路径 */
    activeWorkspace: string | null
    /** 图谱侧栏可见性 */
    knowledgeGraphVisible: boolean
    /** 知识索引状态 */
    knowledgeIndexStatus: 'idle' | 'indexing' | 'error'
    /** 知识索引已处理文件数 */
    knowledgeIndexProcessed: number
    /** 知识索引总文件数 */
    knowledgeIndexTotal: number
    /** 知识索引错误信息 */
    knowledgeIndexError: string | null
    /** 当前数学公式编辑浮层 */
    mathEdit: MathEditState | null
    /** 只读插件命令注册表 */
    pluginCommands: Record<string, PluginCommand>
    /** 只读插件侧栏卡片 */
    pluginSidebarCards: Record<string, PluginSidebarCard>
    /** 只读插件搜索提供器 */
    pluginSearchProviders: Record<string, PluginSearchProvider>

    // 操作
    addTab: (filePath: string | null, content?: string) => string
    removeTab: (tabId: string) => void
    setActiveTab: (tabId: string) => void
    updateContent: (tabId: string, content: string) => void
    markSaved: (tabId: string, filePath?: string) => void
    setViewMode: (mode: ViewMode) => void
    getActiveTab: () => Tab | null
    setZoom: (zoom: number) => void
    addRecentFile: (filePath: string, title: string) => void
    registerCommand: (id: string, executor: CommandExecutor) => void
    unregisterCommand: (id: string) => void
    executeCommand: (cmd: string, payload?: unknown) => void
    setActiveMarks: (marks: string[]) => void
    setInsertDialog: (type: InsertDialogType) => void
    setSearchVisible: (visible: boolean) => void
    openGlobalSearch: (query?: string) => void
    closeGlobalSearch: () => void
    setGlobalSearchQuery: (query: string) => void
    pushSearchHistory: (query: string) => void
    clearSearchHistory: () => void
    setSearchHistory: (history: string[]) => void
    setThemeMode: (mode: ThemeMode) => void
    setColorScheme: (scheme: ColorScheme) => void
    setEditorFontSize: (size: number) => void
    setSpellcheck: (enable: boolean) => void
    setWatermark: (enable: boolean) => void
    setFocusMode: (enable: boolean) => void
    setTypewriterMode: (enable: boolean) => void
    setTocVisible: (visible: boolean) => void
    setBacklinksVisible: (visible: boolean) => void
    setFileExplorerVisible: (visible: boolean) => void
    setKnowledgeGraphVisible: (visible: boolean) => void
    setActiveWorkspace: (path: string | null) => void
    rebuildKnowledgeIndex: () => Promise<void>
    registerPluginCommand: (command: PluginCommand) => void
    unregisterPluginCommand: (id: string) => void
    runPluginCommand: (id: string, payload?: unknown) => void
    registerPluginSidebarCard: (card: PluginSidebarCard) => void
    unregisterPluginSidebarCard: (id: string) => void
    registerPluginSearchProvider: (provider: PluginSearchProvider) => void
    unregisterPluginSearchProvider: (id: string) => void
    queryPluginSearch: (query: string) => Promise<PluginSearchHit[]>
    openMathEdit: (state: MathEditState) => void
    closeMathEdit: () => void
    /** 执行保存操作（保存当前活动标签） */
    saveActiveTab: () => Promise<void>
    /** 执行保存操作（保存指定标签） */
    saveTab: (tabId: string) => Promise<SaveTabResult>
    /** 执行另存为（保存指定标签） */
    saveTabAs: (tabId: string) => Promise<SaveTabResult>

    /** 当前等待确认的关闭动作类型 */
    pendingCloseAction: 'tab' | 'window' | null
    /** 当前正在确认关闭的标签 ID */
    pendingCloseTabId: string | null
    pendingCloseSaving: boolean
    pendingCloseError: string | null
    /** 请求关闭标签（可能触发未保存确认） */
    requestCloseTab: (tabId: string) => void
    /** 请求关闭窗口（可能触发未保存确认） */
    requestCloseWindow: () => void
    /** 在确认弹窗中选择"保存" */
    confirmSave: () => Promise<void>
    /** 在确认弹窗中选择"不保存" */
    confirmDiscard: () => void
    /** 在确认弹窗中选择"取消" */
    cancelClose: () => void
}

let tabCounter = 0
const SEARCH_HISTORY_STORAGE_KEY = 'mymd.searchHistory'
const DEFAULT_SEARCH_HISTORY_LIMIT = 10

function loadSearchHistoryFromStorage(): string[] {
    if (typeof window === 'undefined') return []
    try {
        const raw = window.localStorage.getItem(SEARCH_HISTORY_STORAGE_KEY)
        if (!raw) return []
        const parsed = JSON.parse(raw)
        if (!Array.isArray(parsed)) return []
        return parsed
            .map(item => (typeof item === 'string' ? item.trim() : ''))
            .filter(Boolean)
            .slice(0, DEFAULT_SEARCH_HISTORY_LIMIT)
    } catch {
        return []
    }
}

function persistSearchHistory(history: string[]) {
    if (typeof window === 'undefined') return
    try {
        window.localStorage.setItem(SEARCH_HISTORY_STORAGE_KEY, JSON.stringify(history))
    } catch {
        // ignore persistence failures
    }
}

function generateTabId(): string {
    return `tab-${Date.now()}-${++tabCounter}`
}

function getFileName(filePath: string): string {
    return filePath.split(/[\\/]/).pop() || '未命名'
}

function getSaveFileSuggestion(tab: Tab): string {
    const fallbackName = tab.filePath ? getFileName(tab.filePath) : tab.title || '未命名.md'
    const safeName = fallbackName
        .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '_')
        .trim() || '未命名.md'
    return /\.md$/i.test(safeName) ? safeName : `${safeName}.md`
}

function normalizeSavedPath(path: string | null): string | null {
    if (!path) return null
    const normalized = path.trim()
    return normalized.length > 0 ? normalized : null
}

async function saveTabWithNativeDialog(tab: Tab): Promise<string | null> {
    const savedPath = await invoke<string | null>('save_markdown_via_dialog', {
        defaultFileName: getSaveFileSuggestion(tab),
        currentPath: tab.filePath,
        content: tab.content
    })
    return normalizeSavedPath(savedPath)
}

// 检测 Tauri 环境
const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window

export const useEditorStore = create<EditorState>((set, get) => ({
    tabs: [],
    activeTabId: null,
    viewMode: 'wysiwyg',
    zoom: 100,
    recentFiles: [],
    editorCommands: {},
    activeMarks: [],
    insertDialog: null,
    searchVisible: false,
    globalSearchVisible: false,
    globalSearchQuery: '',
    searchHistory: loadSearchHistoryFromStorage(),
    searchHistoryLimit: DEFAULT_SEARCH_HISTORY_LIMIT,
    themeMode: 'system',
    colorScheme: 'default',
    editorFontSize: 16,
    spellcheck: false,
    watermark: false,
    focusMode: false,
    typewriterMode: false,
    tocVisible: false,
    backlinksVisible: false,
    fileExplorerVisible: true,
    activeWorkspace: null,
    knowledgeGraphVisible: false,
    knowledgeIndexStatus: 'idle',
    knowledgeIndexProcessed: 0,
    knowledgeIndexTotal: 0,
    knowledgeIndexError: null,
    mathEdit: null,
    pluginCommands: {},
    pluginSidebarCards: {},
    pluginSearchProviders: {},
    pendingCloseAction: null,
    pendingCloseTabId: null,
    pendingCloseSaving: false,
    pendingCloseError: null,

    addTab: (filePath, content = '') => {
        const id = generateTabId()
        const title = filePath ? getFileName(filePath) : '未命名.md'

        // 如果文件已经打开，直接切换到对应标签
        if (filePath) {
            const existing = get().tabs.find(t => t.filePath === filePath)
            if (existing) {
                set({ activeTabId: existing.id })
                return existing.id
            }
        }

        const newTab: Tab = { id, filePath, title, content, isDirty: false }

        set(state => ({
            tabs: [...state.tabs, newTab],
            activeTabId: id
        }))

        // 添加到最近文件
        if (filePath) {
            get().addRecentFile(filePath, title)
        }

        return id
    },

    removeTab: (tabId) => {
        set(state => {
            const idx = state.tabs.findIndex(t => t.id === tabId)
            const newTabs = state.tabs.filter(t => t.id !== tabId)

            let newActiveId = state.activeTabId
            if (state.activeTabId === tabId) {
                if (newTabs.length === 0) {
                    newActiveId = null
                } else {
                    // 切换到相邻标签
                    newActiveId = newTabs[Math.min(idx, newTabs.length - 1)].id
                }
            }

            return { tabs: newTabs, activeTabId: newActiveId }
        })
    },

    setActiveTab: (tabId) => set({ activeTabId: tabId }),

    updateContent: (tabId, content) => {
        set(state => ({
            tabs: state.tabs.map(t =>
                t.id === tabId ? { ...t, content, isDirty: true } : t
            )
        }))
    },

    markSaved: (tabId, filePath) => {
        const existingTab = get().tabs.find(t => t.id === tabId)
        const resolvedPath = filePath ?? existingTab?.filePath ?? null
        set(state => ({
            tabs: state.tabs.map(t =>
                t.id === tabId
                    ? {
                        ...t,
                        isDirty: false,
                        filePath: filePath ?? t.filePath,
                        title: filePath ? getFileName(filePath) : t.title
                    }
                    : t
            )
        }))

        if (resolvedPath) {
            const latestTab = get().tabs.find(t => t.id === tabId)
            const content = latestTab?.content ?? existingTab?.content ?? ''
            void indexKnowledgeDocument(resolvedPath, content, get().activeWorkspace)
        }
    },

    setViewMode: (mode) => set({ viewMode: mode }),

    getActiveTab: () => {
        const { tabs, activeTabId } = get()
        return tabs.find(t => t.id === activeTabId) ?? null
    },

    setZoom: (zoom) => set({ zoom: Math.max(10, Math.min(500, zoom)) }),

    addRecentFile: (filePath, title) => {
        set(state => {
            const filtered = state.recentFiles.filter(f => f.path !== filePath)
            const updated = [{ path: filePath, title, time: Date.now() }, ...filtered].slice(0, 20)
            return { recentFiles: updated }
        })
    },

    registerCommand: (id, executor) => set(state => ({
        editorCommands: { ...state.editorCommands, [id]: executor }
    })),

    unregisterCommand: (id) => set(state => {
        const newCmds = { ...state.editorCommands }
        delete newCmds[id]
        return { editorCommands: newCmds }
    }),

    executeCommand: (cmd, payload) => {
        if (cmd === 'openGlobalSearch') {
            const query =
                typeof payload === 'string'
                    ? payload
                    : (payload as { query?: string } | undefined)?.query ?? ''
            get().openGlobalSearch(query)
            return
        }

        if (cmd === 'closeGlobalSearch') {
            get().closeGlobalSearch()
            return
        }

        if (cmd === 'openInDocumentSearch') {
            get().setSearchVisible(true)
            return
        }

        if (cmd === 'toggleKnowledgeGraph') {
            const current = get().knowledgeGraphVisible
            get().setKnowledgeGraphVisible(!current)
            return
        }

        if (cmd.startsWith('plugin:')) {
            get().runPluginCommand(cmd, payload)
            return
        }

        const { editorCommands } = get()
        Object.values(editorCommands).forEach(executor => executor(cmd, payload))
    },

    setActiveMarks: (marks) => set({ activeMarks: marks }),

    setInsertDialog: (type) => set({ insertDialog: type }),

    setSearchVisible: (visible) => set({ searchVisible: visible }),

    openGlobalSearch: (query = '') => {
        set({
            globalSearchVisible: true,
            globalSearchQuery: query.trim()
        })
    },

    closeGlobalSearch: () => {
        set({
            globalSearchVisible: false,
            globalSearchQuery: ''
        })
    },

    setGlobalSearchQuery: (query) => set({ globalSearchQuery: query }),

    pushSearchHistory: (query) => {
        const normalized = query.trim()
        if (!normalized) return

        set(state => {
            const deduped = state.searchHistory.filter(item => item !== normalized)
            const nextHistory = [normalized, ...deduped].slice(0, state.searchHistoryLimit)
            persistSearchHistory(nextHistory)
            return { searchHistory: nextHistory }
        })
    },

    clearSearchHistory: () => {
        persistSearchHistory([])
        set({ searchHistory: [] })
    },

    setSearchHistory: (history) => {
        const nextHistory = history
            .map(item => item.trim())
            .filter(Boolean)
            .slice(0, get().searchHistoryLimit)
        persistSearchHistory(nextHistory)
        set({ searchHistory: nextHistory })
    },

    setThemeMode: (mode) => set({ themeMode: mode }),

    setColorScheme: (scheme) => set({ colorScheme: scheme }),

    setEditorFontSize: (size) => set({ editorFontSize: Math.max(10, Math.min(32, size)) }),

    setSpellcheck: (enable) => set({ spellcheck: enable }),

    setWatermark: (enable) => set({ watermark: enable }),

    setFocusMode: (enable) => set({ focusMode: enable }),

    setTypewriterMode: (enable) => set({ typewriterMode: enable }),

    setTocVisible: (enable) => set({ tocVisible: enable }),
    setBacklinksVisible: (enable) => set({ backlinksVisible: enable }),

    setFileExplorerVisible: (enable) => set({ fileExplorerVisible: enable }),

    setKnowledgeGraphVisible: (visible) => set({ knowledgeGraphVisible: visible }),

    setActiveWorkspace: (path) => {
        set({ activeWorkspace: path })
        if (!path) {
            set({
                knowledgeIndexStatus: 'idle',
                knowledgeIndexProcessed: 0,
                knowledgeIndexTotal: 0,
                knowledgeIndexError: null
            })
            return
        }
        void get().rebuildKnowledgeIndex()
    },

    rebuildKnowledgeIndex: async () => {
        const workspacePath = get().activeWorkspace
        if (!workspacePath) return

        set({
            knowledgeIndexStatus: 'indexing',
            knowledgeIndexProcessed: 0,
            knowledgeIndexTotal: 0,
            knowledgeIndexError: null
        })

        try {
            await rebuildWorkspaceIndex(workspacePath, {
                onStart: ({ total }) => {
                    set({
                        knowledgeIndexStatus: 'indexing',
                        knowledgeIndexProcessed: 0,
                        knowledgeIndexTotal: total,
                        knowledgeIndexError: null
                    })
                },
                onProgress: ({ processed, total }) => {
                    set({
                        knowledgeIndexStatus: 'indexing',
                        knowledgeIndexProcessed: processed,
                        knowledgeIndexTotal: total
                    })
                },
                onComplete: ({ processed, total }) => {
                    set({
                        knowledgeIndexStatus: 'idle',
                        knowledgeIndexProcessed: processed,
                        knowledgeIndexTotal: total,
                        knowledgeIndexError: null
                    })
                },
                onError: ({ message, processed, total }) => {
                    set({
                        knowledgeIndexStatus: 'error',
                        knowledgeIndexProcessed: processed,
                        knowledgeIndexTotal: total,
                        knowledgeIndexError: message
                    })
                }
            })
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Knowledge indexing failed'
            set({
                knowledgeIndexStatus: 'error',
                knowledgeIndexError: message
            })
        }
    },

    registerPluginCommand: (command) =>
        set(state => ({
            pluginCommands: {
                ...state.pluginCommands,
                [command.id]: command
            }
        })),

    unregisterPluginCommand: (id) =>
        set(state => {
            const next = { ...state.pluginCommands }
            delete next[id]
            return { pluginCommands: next }
        }),

    runPluginCommand: (id, payload) => {
        const command = get().pluginCommands[id]
        if (!command) return
        try {
            command.run(payload)
        } catch (error) {
            console.warn(`plugin command failed: ${id}`, error)
        }
    },

    registerPluginSidebarCard: (card) =>
        set(state => ({
            pluginSidebarCards: {
                ...state.pluginSidebarCards,
                [card.id]: card
            }
        })),

    unregisterPluginSidebarCard: (id) =>
        set(state => {
            const next = { ...state.pluginSidebarCards }
            delete next[id]
            return { pluginSidebarCards: next }
        }),

    registerPluginSearchProvider: (provider) =>
        set(state => ({
            pluginSearchProviders: {
                ...state.pluginSearchProviders,
                [provider.id]: provider
            }
        })),

    unregisterPluginSearchProvider: (id) =>
        set(state => {
            const next = { ...state.pluginSearchProviders }
            delete next[id]
            return { pluginSearchProviders: next }
        }),

    queryPluginSearch: async (query) => {
        const normalized = query.trim()
        if (!normalized) return []

        const providers = Object.values(get().pluginSearchProviders)
        const results = await Promise.all(
            providers.map(async provider => {
                try {
                    return await provider.search(normalized)
                } catch (error) {
                    console.warn(`plugin search provider failed: ${provider.id}`, error)
                    return []
                }
            })
        )
        return results.flat().slice(0, 40)
    },

    openMathEdit: (state) => set({ mathEdit: state }),

    closeMathEdit: () => set({ mathEdit: null }),

    saveActiveTab: async () => {
        const tab = get().getActiveTab()
        if (tab) {
            await get().saveTab(tab.id)
        }
    },

    saveTabAs: async (tabId: string) => {
        if (!isTauri) return 'failed'

        const tab = get().tabs.find(t => t.id === tabId)
        if (!tab) return 'failed'

        try {
            const filePath = await saveTabWithNativeDialog(tab)
            if (!filePath) return 'cancelled'

            get().markSaved(tab.id, filePath)
            get().addRecentFile(filePath, getFileName(filePath))
            return 'saved'
        } catch (e) {
            console.error('Failed to save file as:', e)
            return 'failed'
        }
    },

    saveTab: async (tabId: string) => {
        if (!isTauri) return 'failed'

        const tab = get().tabs.find(t => t.id === tabId)
        if (!tab) return 'failed'

        try {
            if (!tab.filePath) {
                return get().saveTabAs(tabId)
            }

            await invoke('write_text_file_to_path', {
                path: tab.filePath,
                content: tab.content
            })
            get().markSaved(tab.id)
            return 'saved'
        } catch (e) {
            console.error('Failed to save file:', e)
            return 'failed'
        }
    },

    requestCloseTab: (tabId: string) => {
        const tab = get().tabs.find(t => t.id === tabId)
        if (!tab) return

        if (tab.isDirty) {
            // 需要弹窗确认
            set({ pendingCloseAction: 'tab', pendingCloseTabId: tabId, pendingCloseSaving: false, pendingCloseError: null })
        } else {
            // 直接关闭
            get().removeTab(tabId)
        }
    },

    requestCloseWindow: () => {
        const dirtyTabs = get().tabs.filter(t => t.isDirty)
        if (dirtyTabs.length > 0) {
            // 取第一个未保存的进行确认
            set({ pendingCloseAction: 'window', pendingCloseTabId: dirtyTabs[0].id, pendingCloseSaving: false, pendingCloseError: null })
        } else {
            // 全部已保存，直接退出程序
            set({ pendingCloseAction: null, pendingCloseTabId: null, pendingCloseSaving: false, pendingCloseError: null })
            if (isTauri) {
                invoke('exit_app')
            }
        }
    },

    confirmSave: async () => {
        const { pendingCloseTabId, pendingCloseAction } = get()
        if (!pendingCloseTabId) return

        set({ pendingCloseSaving: true, pendingCloseError: null })
        const saveResult = await get().saveTab(pendingCloseTabId)
        set({ pendingCloseSaving: false })

        if (saveResult === 'saved') {
            if (pendingCloseAction === 'tab') {
                // 保存后关闭标签页
                get().removeTab(pendingCloseTabId)
                set({ pendingCloseAction: null, pendingCloseTabId: null, pendingCloseSaving: false, pendingCloseError: null })
            } else if (pendingCloseAction === 'window') {
                // 将被保存的标签页从 dirty 状态中移除(移除此 tab 即可)
                get().removeTab(pendingCloseTabId)
                set({ pendingCloseAction: null, pendingCloseTabId: null, pendingCloseSaving: false, pendingCloseError: null })

                // 检查是否还有其他未保存的标签页
                get().requestCloseWindow()
            }
            return
        }

        if (saveResult === 'cancelled') {
            set({ pendingCloseError: 'Save was cancelled. Please choose a file path and try again.' })
            return
        }

        set({ pendingCloseError: 'Save failed. Please check file path and permissions, then retry.' })
    },

    confirmDiscard: () => {
        const { pendingCloseTabId, pendingCloseAction } = get()
        if (!pendingCloseTabId) return

        if (pendingCloseAction === 'tab') {
            // 丢弃并关闭当前标签页
            get().removeTab(pendingCloseTabId)
            set({ pendingCloseAction: null, pendingCloseTabId: null, pendingCloseSaving: false, pendingCloseError: null })
        } else if (pendingCloseAction === 'window') {
            // 丢弃并关闭当前标签页
            get().removeTab(pendingCloseTabId)
            set({ pendingCloseAction: null, pendingCloseTabId: null, pendingCloseSaving: false, pendingCloseError: null })

            // 检查是否还有其他未保存的标签页
            get().requestCloseWindow()
        }
    },

    cancelClose: () => {
        set({ pendingCloseAction: null, pendingCloseTabId: null, pendingCloseSaving: false, pendingCloseError: null })
    }
}))
