import { useEffect, useRef, useState } from 'react'
import { ExternalLink, ImagePlus, Upload, X, Music2, Video, Globe } from 'lucide-react'
import { open as openDialog } from '@tauri-apps/plugin-dialog'
import { convertFileSrc } from '@tauri-apps/api/core'
import { useEditorStore, type InsertDialogType } from '@/stores/editorStore'
import { copyImageToLocalAssets } from '@/utils/fileUtils'
import './InsertDialog.css'

const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window

type LocalCapableDialogType = 'image' | 'audio' | 'video'

const TITLE_MAP: Record<Exclude<InsertDialogType, null>, string> = {
    link: '插入链接',
    image: '插入图片',
    audio: '插入音频',
    video: '插入视频',
    embed: '嵌入网页',
}

function supportsLocalInput(type: Exclude<InsertDialogType, null>): type is LocalCapableDialogType {
    return type === 'image' || type === 'audio' || type === 'video'
}

function getDialogFilters(type: LocalCapableDialogType) {
    if (type === 'image') {
        return [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'] }]
    }
    if (type === 'audio') {
        return [{ name: 'Audio', extensions: ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'] }]
    }
    return [{ name: 'Video', extensions: ['mp4', 'webm', 'mov', 'mkv', 'avi'] }]
}

function toDisplayName(path: string) {
    return path.split(/[\\/]/).pop() || path
}

export function InsertDialog() {
    const dialogType = useEditorStore(s => s.insertDialog)
    const setInsertDialog = useEditorStore(s => s.setInsertDialog)
    const executeCommand = useEditorStore(s => s.executeCommand)

    const [url, setUrl] = useState('')
    const [text, setText] = useState('')
    const [localFile, setLocalFile] = useState('')
    const [mode, setMode] = useState<'url' | 'local'>('url')
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (!dialogType) return
        setUrl('')
        setText('')
        setLocalFile('')
        setMode('url')
        window.setTimeout(() => inputRef.current?.focus(), 50)
    }, [dialogType])

    if (!dialogType) return null

    const title = TITLE_MAP[dialogType]
    const isImage = dialogType === 'image'
    const isLink = dialogType === 'link'
    const isAudio = dialogType === 'audio'
    const isVideo = dialogType === 'video'
    const isEmbed = dialogType === 'embed'
    const canUseLocal = supportsLocalInput(dialogType)

    const handleClose = () => setInsertDialog(null)

    const handleOverlayClick = (event: React.MouseEvent) => {
        if (event.target === event.currentTarget) handleClose()
    }

    const handleBrowseLocal = async () => {
        if (!canUseLocal || !isTauri) return

        const selected = await openDialog({
            multiple: false,
            filters: getDialogFilters(dialogType),
        })
        if (!selected) return

        const filePath = Array.isArray(selected) ? selected[0] : selected
        if (typeof filePath !== 'string') return
        setLocalFile(filePath)
        setMode('local')
        setText(toDisplayName(filePath))
    }

    const resolveLocalSrc = async () => {
        if (!localFile) return ''
        if (!canUseLocal) return localFile

        if (dialogType === 'image') {
            const activeTab = useEditorStore.getState().getActiveTab()
            if (isTauri && activeTab?.filePath) {
                try {
                    const relativePath = await copyImageToLocalAssets(localFile, activeTab.filePath)
                    if (relativePath) return relativePath
                } catch (error) {
                    console.warn('Failed to copy image to assets, fallback to absolute path:', error)
                }
            }
        }

        return isTauri ? convertFileSrc(localFile) : localFile
    }

    const getPrimarySource = async () => {
        if (canUseLocal && mode === 'local') {
            return await resolveLocalSrc()
        }
        return url.trim()
    }

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()

        const source = await getPrimarySource()
        if (!source) return

        if (isLink) {
            executeCommand('insertLink', { href: source, text: text.trim() || source })
            handleClose()
            return
        }

        if (isImage) {
            executeCommand('insertImage', { src: source, alt: text.trim() || '' })
            handleClose()
            return
        }

        if (isAudio) {
            executeCommand('insertAudio', { src: source, title: text.trim() || '' })
            handleClose()
            return
        }

        if (isVideo) {
            executeCommand('insertVideo', { src: source, title: text.trim() || '' })
            handleClose()
            return
        }

        if (isEmbed) {
            executeCommand('insertEmbed', { src: source, title: text.trim() || '' })
            handleClose()
        }
    }

    const canSubmit = canUseLocal
        ? (mode === 'local' ? Boolean(localFile) : Boolean(url.trim()))
        : Boolean(url.trim())

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
                    {canUseLocal && (
                        <div className="insert-dialog__tabs">
                            <button
                                type="button"
                                className={`insert-dialog__tab ${mode === 'url' ? 'active' : ''}`}
                                onClick={() => setMode('url')}
                            >
                                <ExternalLink size={14} />
                                网络地址
                            </button>
                            <button
                                type="button"
                                className={`insert-dialog__tab ${mode === 'local' ? 'active' : ''}`}
                                onClick={() => setMode('local')}
                            >
                                <Upload size={14} />
                                本地文件
                            </button>
                        </div>
                    )}

                    {(!canUseLocal || mode === 'url') && (
                        <div className="insert-dialog__field">
                            <label className="insert-dialog__label">
                                {isLink && <><ExternalLink size={14} /> 链接地址</>}
                                {isImage && <><ImagePlus size={14} /> 图片地址</>}
                                {isAudio && <><Music2 size={14} /> 音频地址</>}
                                {isVideo && <><Video size={14} /> 视频地址</>}
                                {isEmbed && <><Globe size={14} /> 嵌入地址</>}
                            </label>
                            <input
                                ref={inputRef}
                                type="text"
                                className="insert-dialog__input"
                                placeholder={
                                    isImage
                                        ? 'https://example.com/image.png'
                                        : isAudio
                                            ? 'https://example.com/audio.mp3'
                                            : isVideo
                                                ? 'https://example.com/video.mp4'
                                                : isEmbed
                                                    ? 'https://www.youtube.com/embed/...'
                                                    : 'https://example.com'
                                }
                                value={url}
                                onChange={e => setUrl(e.target.value)}
                            />
                        </div>
                    )}

                    {canUseLocal && mode === 'local' && (
                        <div className="insert-dialog__field">
                            <label className="insert-dialog__label">
                                <Upload size={14} /> 选择本地文件
                            </label>
                            <div className="insert-dialog__upload-area" onClick={() => void handleBrowseLocal()}>
                                {localFile ? (
                                    <div className="insert-dialog__upload-selected">
                                        <Upload size={20} color="var(--accent)" />
                                        <span className="insert-dialog__upload-filename">{toDisplayName(localFile)}</span>
                                        <span className="insert-dialog__upload-hint">点击更换</span>
                                    </div>
                                ) : (
                                    <div className="insert-dialog__upload-placeholder">
                                        <Upload size={32} color="var(--text-muted)" strokeWidth={1.5} />
                                        <span>点击选择文件</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="insert-dialog__field">
                        <label className="insert-dialog__label">
                            {isLink ? '显示文本（可选）' : '标题/描述（可选）'}
                        </label>
                        <input
                            type="text"
                            className="insert-dialog__input"
                            placeholder={isLink ? '点击此处' : '媒体描述'}
                            value={text}
                            onChange={e => setText(e.target.value)}
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
