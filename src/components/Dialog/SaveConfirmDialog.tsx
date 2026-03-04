import { AlertTriangle } from 'lucide-react'
import { useEditorStore } from '@/stores/editorStore'
import './SaveConfirmDialog.css'

export function SaveConfirmDialog() {
    const pendingCloseAction = useEditorStore(s => s.pendingCloseAction)
    const pendingCloseTabId = useEditorStore(s => s.pendingCloseTabId)
    const tabs = useEditorStore(s => s.tabs)
    const confirmSave = useEditorStore(s => s.confirmSave)
    const confirmDiscard = useEditorStore(s => s.confirmDiscard)
    const cancelClose = useEditorStore(s => s.cancelClose)

    if (!pendingCloseAction || !pendingCloseTabId) return null

    const tab = tabs.find(t => t.id === pendingCloseTabId)
    if (!tab) return null

    return (
        <div className="save-confirm-overlay">
            <div className="save-confirm-dialog" role="dialog" aria-modal="true">
                <div className="save-confirm-header">
                    <div className="save-confirm-title">
                        <AlertTriangle size={16} className="save-confirm-icon" />
                        MYmd
                    </div>
                </div>

                <div className="save-confirm-body">
                    <p className="save-confirm-text">
                        是否保存对 "{tab.title}" 的更改？
                    </p>
                    <p className="save-confirm-subtext">
                        如果您不保存，系统将丢弃自上次保存以来的所有更改。
                    </p>
                </div>

                <div className="save-confirm-footer">
                    <button
                        className="btn btn-primary"
                        onClick={confirmSave}
                        autoFocus
                    >
                        保存
                    </button>
                    <button
                        className="btn btn-secondary"
                        onClick={confirmDiscard}
                    >
                        不保存
                    </button>
                    <button
                        className="btn btn-secondary"
                        onClick={cancelClose}
                    >
                        取消
                    </button>
                </div>
            </div>
        </div>
    )
}
