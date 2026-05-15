import { useEditorStore, type ViewMode } from '@/stores/editorStore'

export type EditorPrimarySurface = 'none' | 'wysiwyg' | 'source'

export interface EditorRuntimeQueryState {
    activeTabId: string | null
    activeTabTitle: string | null
    activeFilePath: string | null
    viewMode: ViewMode
    activeMarks: string[]
    searchVisible: boolean
    globalSearchVisible: boolean
    insertDialogOpen: boolean
    activeWorkspace: string | null
    knowledgeIndexStatus: 'idle' | 'indexing' | 'error'
    knowledgeIndexProcessed: number
    knowledgeIndexTotal: number
    knowledgeIndexSkipped: number
    panels: {
        toc: boolean
        backlinks: boolean
        fileExplorer: boolean
        knowledgeGraph: boolean
        ai: boolean
    }
    surfaces: {
        primary: EditorPrimarySurface
        hasPreview: boolean
        previewReadonly: boolean
        hasWritableEditor: boolean
    }
    registeredEditorCommandIds: string[]
}

export function getEditorRuntimeStateSnapshot(): EditorRuntimeQueryState {
    const state = useEditorStore.getState()
    const activeTab = state.getActiveTab()
    const isSplit = state.viewMode === 'split'

    return {
        activeTabId: state.activeTabId,
        activeTabTitle: activeTab?.title ?? null,
        activeFilePath: activeTab?.filePath ?? null,
        viewMode: state.viewMode,
        activeMarks: [...state.activeMarks],
        searchVisible: state.searchVisible,
        globalSearchVisible: state.globalSearchVisible,
        insertDialogOpen: state.insertDialog !== null,
        activeWorkspace: state.activeWorkspace,
        knowledgeIndexStatus: state.knowledgeIndexStatus,
        knowledgeIndexProcessed: state.knowledgeIndexProcessed,
        knowledgeIndexTotal: state.knowledgeIndexTotal,
        knowledgeIndexSkipped: state.knowledgeIndexSkipped,
        panels: {
            toc: state.tocVisible,
            backlinks: state.backlinksVisible,
            fileExplorer: state.fileExplorerVisible,
            knowledgeGraph: state.knowledgeGraphVisible,
            ai: state.aiPanelVisible,
        },
        surfaces: {
            primary: activeTab ? (isSplit ? 'source' : 'wysiwyg') : 'none',
            hasPreview: activeTab ? isSplit : false,
            previewReadonly: activeTab ? isSplit : false,
            hasWritableEditor: activeTab !== null,
        },
        registeredEditorCommandIds: Object.keys(state.editorCommands).sort(),
    }
}

export function canQueryEditorState() {
    return useEditorStore.getState().activeTabId !== null
}

export function isSplitEditorRuntime() {
    return useEditorStore.getState().viewMode === 'split'
}
