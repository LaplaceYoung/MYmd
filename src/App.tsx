import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { TitleBar } from './components/TitleBar/TitleBar'
import { TabBar } from './components/TabBar/TabBar'
import { Ribbon } from './components/Ribbon/Ribbon'
import { EditorContainer } from './components/Editor/EditorContainer'
import { StatusBar } from './components/StatusBar/StatusBar'
import { SaveConfirmDialog } from './components/Dialog/SaveConfirmDialog'
import { useEditorStore } from './stores/editorStore'
import { useAutoSave } from './components/Editor/hooks/useAutoSave'
import { useCliFileOpener } from './components/Editor/hooks/useCliFileOpener'
import { useSessionRecovery } from './components/Editor/hooks/useSessionRecovery'
import { GlobalSearchModal } from './components/Editor/GlobalSearchModal'
import './styles/immersive.css'

import { installBuiltinKnowledgePlugin } from './plugins/builtinKnowledgePlugin'
import { installBuiltinAiPlugin } from './plugins/builtinAiPlugin'
import { resolveAppLocale } from './i18n'

const TOCPanel = lazy(() => import('./components/Sidebar/TOCPanel').then(module => ({ default: module.TOCPanel })))
const FileExplorer = lazy(() => import('./components/Sidebar/FileExplorer').then(module => ({ default: module.FileExplorer })))
const BacklinksPanel = lazy(() => import('./components/Sidebar/BacklinksPanel').then(module => ({ default: module.BacklinksPanel })))
const KnowledgeGraphPanel = lazy(() => import('./components/Sidebar/KnowledgeGraphPanel').then(module => ({ default: module.KnowledgeGraphPanel })))
const AiPanel = lazy(() => import('./components/Sidebar/AiPanel').then(module => ({ default: module.AiPanel })))

export default function App() {
    useAutoSave()
    const isCliInitDone = useCliFileOpener()
    const isSessionReady = useSessionRecovery(isCliInitDone)
    const [startupGuardExpired, setStartupGuardExpired] = useState(false)
    const tabs = useEditorStore(s => s.tabs)
    const hasActiveTab = tabs.length > 0
    const themeMode = useEditorStore(s => s.themeMode)
    const colorScheme = useEditorStore(s => s.colorScheme)
    const locale = useEditorStore(s => s.locale)
    const fileExplorerVisible = useEditorStore(s => s.fileExplorerVisible)
    const tocVisible = useEditorStore(s => s.tocVisible)
    const backlinksVisible = useEditorStore(s => s.backlinksVisible)
    const knowledgeGraphVisible = useEditorStore(s => s.knowledgeGraphVisible)
    const aiPanelVisible = useEditorStore(s => s.aiPanelVisible)

    // 主题切换：将 data-theme 属性应用到 <html> 元素
    useEffect(() => {
        const root = document.documentElement

        if (themeMode === 'system') {
            // 跟随系统：移除手动覆盖，让 CSS @media 生效
            root.removeAttribute('data-theme')
        } else {
            // 手动切换
            root.setAttribute('data-theme', themeMode)
        }
    }, [themeMode])

    // 配色方案切换：将 data-color-scheme 属性应用到 <html> 元素
    useEffect(() => {
        const root = document.documentElement

        if (colorScheme === 'default') {
            root.removeAttribute('data-color-scheme')
        } else {
            root.setAttribute('data-color-scheme', colorScheme)
        }
    }, [colorScheme])

    useEffect(() => {
        document.documentElement.lang = resolveAppLocale(locale)
    }, [locale])

    useEffect(() => {
        const cleanupKnowledge = installBuiltinKnowledgePlugin()
        const cleanupAi = installBuiltinAiPlugin()
        return () => {
            cleanupKnowledge()
            cleanupAi()
        }
    }, [])

    useEffect(() => {
        // Guard against a permanent blank screen if startup hooks never resolve.
        if (isCliInitDone && isSessionReady) {
            setStartupGuardExpired(false)
            return
        }

        const timer = window.setTimeout(() => {
            setStartupGuardExpired(true)
        }, 2500)

        return () => window.clearTimeout(timer)
    }, [isCliInitDone, isSessionReady])

    const suppressWelcome = useMemo(
        () => (!isCliInitDone || !isSessionReady) && !startupGuardExpired,
        [isCliInitDone, isSessionReady, startupGuardExpired]
    )

    return (
        <>
            <TitleBar />
            {hasActiveTab && (
                <div className="app-header">
                    <Ribbon />
                    <TabBar />
                </div>
            )}
            <div className="app-main-shell">
                <Suspense fallback={null}>
                    {fileExplorerVisible && <FileExplorer />}
                    {tocVisible && <TOCPanel />}
                    {backlinksVisible && <BacklinksPanel />}
                    {knowledgeGraphVisible && <KnowledgeGraphPanel />}
                    {aiPanelVisible && <AiPanel />}
                </Suspense>
                <div className="app-editor-frame">
                    <EditorContainer suppressWelcome={suppressWelcome} />
                </div>
            </div>
            <StatusBar />
            <SaveConfirmDialog />
            <GlobalSearchModal />
        </>
    )
}
