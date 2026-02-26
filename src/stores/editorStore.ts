import { create } from 'zustand'

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
    /** 主题模式 */
    themeMode: ThemeMode
    /** 编辑器字号 */
    editorFontSize: number
    /** 是否开启拼写检查 */
    spellcheck: boolean
    /** 是否显示水印 */
    watermark: boolean

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
    setThemeMode: (mode: ThemeMode) => void
    setEditorFontSize: (size: number) => void
    setSpellcheck: (enable: boolean) => void
    setWatermark: (enable: boolean) => void
    /** 执行保存操作（保存当前活动标签） */
    saveActiveTab: () => Promise<void>
    /** 执行保存操作（保存指定标签） */
    saveTab: (tabId: string) => Promise<boolean>

    /** 当前等待确认的关闭动作类型 */
    pendingCloseAction: 'tab' | 'window' | null
    /** 当前正在确认关闭的标签 ID */
    pendingCloseTabId: string | null
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

function generateTabId(): string {
    return `tab-${Date.now()}-${++tabCounter}`
}

function getFileName(filePath: string): string {
    return filePath.split(/[\\/]/).pop() || '未命名'
}

// 检测 Electron 环境
const isElectron = typeof window !== 'undefined' && window.api !== undefined

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
    themeMode: 'system',
    editorFontSize: 16,
    spellcheck: false,
    watermark: false,
    mathEdit: null,
    pendingCloseAction: null,
    pendingCloseTabId: null,

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
        const { editorCommands } = get()
        Object.values(editorCommands).forEach(executor => executor(cmd, payload))
    },

    setActiveMarks: (marks) => set({ activeMarks: marks }),

    setInsertDialog: (type) => set({ insertDialog: type }),

    setSearchVisible: (visible) => set({ searchVisible: visible }),

    setThemeMode: (mode) => set({ themeMode: mode }),

    setEditorFontSize: (size) => set({ editorFontSize: Math.max(10, Math.min(32, size)) }),

    setSpellcheck: (enable) => set({ spellcheck: enable }),

    setWatermark: (enable) => set({ watermark: enable }),

    saveActiveTab: async () => {
        const tab = get().getActiveTab()
        if (tab) {
            await get().saveTab(tab.id)
        }
    },

    saveTab: async (tabId: string) => {
        if (!isElectron) return false

        const tab = get().tabs.find(t => t.id === tabId)
        if (!tab) return false

        if (!tab.filePath) {
            // 另存为
            const result = await window.api.file.saveAs(tab.content, undefined)
            if (result.success && result.filePath) {
                get().markSaved(tab.id, result.filePath)
                get().addRecentFile(result.filePath, getFileName(result.filePath))
                return true
            }
            return false
        } else {
            const result = await window.api.file.save(tab.filePath, tab.content)
            if (result.success) {
                get().markSaved(tab.id)
                return true
            }
            return false
        }
    },

    requestCloseTab: (tabId: string) => {
        const tab = get().tabs.find(t => t.id === tabId)
        if (!tab) return

        if (tab.isDirty) {
            // 需要弹窗确认
            set({ pendingCloseAction: 'tab', pendingCloseTabId: tabId })
        } else {
            // 直接关闭
            get().removeTab(tabId)
        }
    },

    requestCloseWindow: () => {
        const dirtyTabs = get().tabs.filter(t => t.isDirty)
        if (dirtyTabs.length > 0) {
            // 取第一个未保存的进行确认
            set({ pendingCloseAction: 'window', pendingCloseTabId: dirtyTabs[0].id })
        } else {
            // 全部已保存，直接强制退出
            if (isElectron) {
                window.api.window.forceClose()
            }
        }
    },

    confirmSave: async () => {
        const { pendingCloseTabId, pendingCloseAction } = get()
        if (!pendingCloseTabId) return

        const saved = await get().saveTab(pendingCloseTabId)
        if (saved) {
            // 保存成功后执行关闭逻辑
            get().confirmDiscard()
        }
    },

    confirmDiscard: () => {
        const { pendingCloseTabId, pendingCloseAction } = get()
        if (!pendingCloseTabId) return

        if (pendingCloseAction === 'tab') {
            // 丢弃并关闭当前标签
            get().removeTab(pendingCloseTabId)
            set({ pendingCloseAction: null, pendingCloseTabId: null })
        } else if (pendingCloseAction === 'window') {
            // 移除当前处理完的标签
            get().removeTab(pendingCloseTabId)
            set({ pendingCloseAction: null, pendingCloseTabId: null })

            // 检查是否还有其他未保存的标签
            get().requestCloseWindow()
        }
    },

    cancelClose: () => {
        set({ pendingCloseAction: null, pendingCloseTabId: null })
    }
}))
