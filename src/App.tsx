import { useEffect } from 'react'
import { TitleBar } from './components/TitleBar/TitleBar'
import { TabBar } from './components/TabBar/TabBar'
import { Ribbon } from './components/Ribbon/Ribbon'
import { EditorContainer } from './components/Editor/EditorContainer'
import { StatusBar } from './components/StatusBar/StatusBar'
import { SaveConfirmDialog } from './components/Dialog/SaveConfirmDialog'
import { useEditorStore } from './stores/editorStore'
import { useAutoSave } from './components/Editor/hooks/useAutoSave'
import './styles/immersive.css'

import { TOCPanel } from './components/Sidebar/TOCPanel'

export default function App() {
    useAutoSave()
    const tabs = useEditorStore(s => s.tabs)
    const hasActiveTab = tabs.length > 0
    const themeMode = useEditorStore(s => s.themeMode)

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

    return (
        <>
            <TitleBar />
            {hasActiveTab && (
                <div className="app-header">
                    <Ribbon />
                    <TabBar />
                </div>
            )}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden', width: '100%' }}>
                <TOCPanel />
                <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <EditorContainer />
                </div>
            </div>
            <StatusBar />
            <SaveConfirmDialog />
        </>
    )
}
