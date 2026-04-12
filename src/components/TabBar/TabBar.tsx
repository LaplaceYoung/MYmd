import { X, Plus } from 'lucide-react'
import { useEditorStore } from '@/stores/editorStore'
import { useI18n } from '@/i18n'
import './TabBar.css'

export function TabBar() {
    const { t } = useI18n()
    const tabs = useEditorStore(s => s.tabs)
    const activeTabId = useEditorStore(s => s.activeTabId)
    const setActiveTab = useEditorStore(s => s.setActiveTab)
    const requestCloseTab = useEditorStore(s => s.requestCloseTab)
    const addTab = useEditorStore(s => s.addTab)

    return (
        <div className="tabbar">
            {tabs.map(tab => (
                <div
                    key={tab.id}
                    className={`tabbar__tab ${tab.id === activeTabId ? 'tabbar__tab--active' : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                >
                    {tab.isDirty && <span className="tabbar__tab-dirty" />}
                    <span className="tabbar__tab-title">{tab.title}</span>
                    <button
                        className="tabbar__tab-close"
                        onClick={(e) => {
                            e.stopPropagation()
                            requestCloseTab(tab.id)
                        }}
                        title={t('tab.close')}
                    >
                        <X size={12} />
                    </button>
                </div>
            ))}
            <button
                className="tabbar__add"
                onClick={() => addTab(null)}
                title={t('tab.new')}
            >
                <Plus size={16} />
            </button>
        </div>
    )
}
