import { useEffect } from 'react'
import { TitleBar } from './components/TitleBar/TitleBar'
import { TabBar } from './components/TabBar/TabBar'
import { Ribbon } from './components/Ribbon/Ribbon'
import { EditorContainer } from './components/Editor/EditorContainer'
import { StatusBar } from './components/StatusBar/StatusBar'
import { SaveConfirmDialog } from './components/Dialog/SaveConfirmDialog'
import { useEditorStore } from './stores/editorStore'

export default function App() {
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
            <EditorContainer />
            <StatusBar />
            <SaveConfirmDialog />
        </>
    )
}
