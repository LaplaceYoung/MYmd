import { useState, useEffect, useRef } from 'react'
import { X, ExternalLink, ImagePlus, Upload } from 'lucide-react'
import { useEditorStore } from '@/stores/editorStore'
import './InsertDialog.css'

import { open as openDialog } from '@tauri-apps/plugin-dialog'
import { convertFileSrc } from '@tauri-apps/api/core'
import { copyImageToLocalAssets } from '@/utils/fileUtils'

// 检测 Tauri 环境
const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window

/** 通用插入弹窗：图片和链接两种模式 */
export function InsertDialog() {
    const dialogType = useEditorStore(s => s.insertDialog)
    const setInsertDialog = useEditorStore(s => s.setInsertDialog)
    const executeCommand = useEditorStore(s => s.executeCommand)

    const [url, setUrl] = useState('')
    const [text, setText] = useState('')
    const [localFile, setLocalFile] = useState('') // 本地选中的图片路径
    const [mode, setMode] = useState<'url' | 'local'>('url') // 图片输入模式
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (dialogType) {
            setUrl('')
            setText('')
            setLocalFile('')
            setMode('url')
            setTimeout(() => inputRef.current?.focus(), 50)
        }
    }, [dialogType])

    if (!dialogType) return null

    const isImage = dialogType === 'image'
    const title = isImage ? '插入图片' : '插入链接'



    // 选择本地图片文件
    const handleBrowseImage = async () => {
        if (!isTauri) return

        const selected = await openDialog({
            multiple: false,
            filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'] }]
        })
        if (selected) {
            const filePath = Array.isArray(selected) ? selected[0] : (selected as string)
            setLocalFile(filePath)
            setMode('local')
            // 显示文件名
            const fileName = filePath.split(/[\\/]/).pop() || filePath
            setText(fileName)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (isImage) {
            if (mode === 'local' && localFile) {
                const activeTab = useEditorStore.getState().getActiveTab()

                // If the markdown file is already saved to disk, copy the image to relative assets
                if (isTauri && activeTab && activeTab.filePath) {
                    try {
                        const relativePath = await copyImageToLocalAssets(localFile, activeTab.filePath)
                        if (relativePath) {
                            // Use physical relative path instead of Tauri dev asset URL so the exported markdown is portable
                            executeCommand('insertImage', { src: relativePath, alt: text || '' })
                        } else {
                            throw new Error("Copy failed")
                        }
                    } catch (e) {
                        console.warn("Falling back to absolute path due to error:", e)
                        const src = convertFileSrc(localFile)
                        executeCommand('insertImage', { src, alt: text || '' })
                    }
                } else {
                    // Fallback to absolute system path if unsaved
                    const src = isTauri ? convertFileSrc(localFile) : localFile
                    executeCommand('insertImage', { src, alt: text || '' })
                }
            } else if (url.trim()) {
                // URL 模式
                executeCommand('insertImage', { src: url, alt: text || '' })
            } else {
                return
            }
        } else {
            // 链接模式
            if (!url.trim()) return
            executeCommand('insertLink', { href: url, text: text || url })
        }
        setInsertDialog(null)
    }

    const handleClose = () => setInsertDialog(null)
    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) handleClose()
    }

    const canSubmit = isImage
        ? (mode === 'local' ? !!localFile : !!url.trim())
        : !!url.trim()

    return (
        <div className="insert-dialog__overlay" onClick={handleOverlayClick}>
            <div className="insert-dialog">
                <div className="insert-dialog__header">
                    <h3 className="insert-dialog__title">{title}</h3>
                    <button className="insert-dialog__close" onClick={handleClose} title="关闭">
                        <X size={16} />
                    </button>
                </div>
                <form className="insert-dialog__body" onSubmit={handleSubmit}>
                    {/* 图片模式：显示 URL / 本地 切换标签 */}
                    {isImage && (
                        <div className="insert-dialog__tabs">
                            <button
                                type="button"
                                className={`insert-dialog__tab ${mode === 'url' ? 'active' : ''}`}
                                onClick={() => setMode('url')}
                            >
                                <ExternalLink size={14} />
                                网络图片
                            </button>
                            <button
                                type="button"
                                className={`insert-dialog__tab ${mode === 'local' ? 'active' : ''}`}
                                onClick={() => setMode('local')}
                            >
                                <Upload size={14} />
                                本地上传
                            </button>
                        </div>
                    )}

                    {/* URL 输入（链接模式总是显示，图片模式仅 url 标签下显示） */}
                    {(!isImage || mode === 'url') && (
                        <div className="insert-dialog__field">
                            <label className="insert-dialog__label">
                                {isImage ? (
                                    <><ImagePlus size={14} /> 图片地址</>
                                ) : (
                                    <><ExternalLink size={14} /> 链接地址</>
                                )}
                            </label>
                            <input
                                ref={inputRef}
                                type="text"
                                className="insert-dialog__input"
                                placeholder={isImage ? 'https://example.com/image.png' : 'https://example.com'}
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                            />
                        </div>
                    )}

                    {/* 本地上传区域 */}
                    {isImage && mode === 'local' && (
                        <div className="insert-dialog__field">
                            <label className="insert-dialog__label">
                                <Upload size={14} /> 选择图片文件
                            </label>
                            <div className="insert-dialog__upload-area" onClick={handleBrowseImage}>
                                {localFile ? (
                                    <div className="insert-dialog__upload-selected">
                                        <ImagePlus size={20} color="var(--accent)" />
                                        <span className="insert-dialog__upload-filename">
                                            {localFile.split(/[\\/]/).pop()}
                                        </span>
                                        <span className="insert-dialog__upload-hint">点击更换</span>
                                    </div>
                                ) : (
                                    <div className="insert-dialog__upload-placeholder">
                                        <Upload size={32} color="var(--text-muted)" strokeWidth={1.5} />
                                        <span>点击选择图片</span>
                                        <span className="insert-dialog__upload-formats">支持 PNG、JPG、GIF、SVG、WebP</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* 替代文字 / 显示文本 */}
                    <div className="insert-dialog__field">
                        <label className="insert-dialog__label">
                            {isImage ? '替代文字（可选）' : '显示文本（可选）'}
                        </label>
                        <input
                            type="text"
                            className="insert-dialog__input"
                            placeholder={isImage ? '图片描述' : '点击此处'}
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                        />
                    </div>

                    <div className="insert-dialog__actions">
                        <button type="button" className="insert-dialog__btn insert-dialog__btn--cancel" onClick={handleClose}>
                            取消
                        </button>
                        <button type="submit" className="insert-dialog__btn insert-dialog__btn--confirm" disabled={!canSubmit}>
                            插入
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
