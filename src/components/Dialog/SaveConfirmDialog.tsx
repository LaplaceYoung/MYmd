import { AlertTriangle } from 'lucide-react'
import { useEditorStore } from '@/stores/editorStore'
import './SaveConfirmDialog.css'

export function SaveConfirmDialog() {
    const pendingCloseAction = useEditorStore(s => s.pendingCloseAction)
    const pendingCloseTabId = useEditorStore(s => s.pendingCloseTabId)
    const pendingCloseSaving = useEditorStore(s => s.pendingCloseSaving)
    const pendingCloseError = useEditorStore(s => s.pendingCloseError)
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
                    <p className="save-confirm-text">是否保存“{tab.title}”的更改？</p>
                    <p className="save-confirm-subtext">如果不保存，最近的修改将会丢失。</p>
                    {pendingCloseError && (
                        <p className="save-confirm-error" role="status" aria-live="polite">
                            {pendingCloseError}
                        </p>
                    )}
                </div>

                <div className="save-confirm-footer">
                    <button className="btn btn-primary" onClick={confirmSave} disabled={pendingCloseSaving} autoFocus>
                        {pendingCloseSaving ? '保存中...' : '保存'}
                    </button>
                    <button className="btn btn-secondary" onClick={confirmDiscard} disabled={pendingCloseSaving}>
                        不保存
                    </button>
                    <button className="btn btn-secondary" onClick={cancelClose} disabled={pendingCloseSaving}>
                        取消
                    </button>
                </div>
            </div>
        </div>
    )
}
