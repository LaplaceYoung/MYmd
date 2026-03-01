import { useEffect, useRef, RefObject } from 'react'

export function useSyncScroll(viewMode: 'wysiwyg' | 'split', activeTabId: string | null, splitContainerRef: RefObject<HTMLDivElement | null>, isDraggingRef: RefObject<boolean>) {
    const isSyncingLeftRef = useRef(false)
    const isSyncingRightRef = useRef(false)

    useEffect(() => {
        if (viewMode !== 'split' || !splitContainerRef.current) return

        let animFrameId: number

        const syncScroll = () => {
            const sourceEl = splitContainerRef.current?.querySelector('.cm-scroller') as HTMLElement
            const previewEl = splitContainerRef.current?.querySelector('.editor-split__preview') as HTMLElement
            if (!sourceEl || !previewEl) return

            const onSourceScroll = () => {
                if (isSyncingRightRef.current || isDraggingRef.current) return
                isSyncingLeftRef.current = true

                const editorNode = previewEl.querySelector('.editor') as HTMLElement
                let offsetTop = 0
                if (editorNode) {
                    const previewRect = previewEl.getBoundingClientRect()
                    const editorRect = editorNode.getBoundingClientRect()
                    offsetTop = editorRect.top - previewRect.top + previewEl.scrollTop
                }

                const sourceScrollable = sourceEl.scrollHeight - sourceEl.clientHeight
                const targetScrollable = previewEl.scrollHeight - previewEl.clientHeight

                if (sourceScrollable > 0) {
                    const percentage = sourceEl.scrollTop / sourceScrollable
                    const availableScroll = targetScrollable - offsetTop
                    previewEl.scrollTop = offsetTop + percentage * availableScroll
                }

                cancelAnimationFrame(animFrameId)
                animFrameId = requestAnimationFrame(() => {
                    isSyncingLeftRef.current = false
                })
            }

            const onPreviewScroll = () => {
                if (isSyncingLeftRef.current) return
                isSyncingRightRef.current = true

                const editorNode = previewEl.querySelector('.editor') as HTMLElement
                let offsetTop = 0
                if (editorNode) {
                    const previewRect = previewEl.getBoundingClientRect()
                    const editorRect = editorNode.getBoundingClientRect()
                    offsetTop = editorRect.top - previewRect.top + previewEl.scrollTop
                }

                const sourceScrollable = sourceEl.scrollHeight - sourceEl.clientHeight
                const targetScrollable = previewEl.scrollHeight - previewEl.clientHeight

                if (sourceScrollable > 0 && targetScrollable > 0) {
                    const availableScroll = targetScrollable - offsetTop

                    if (availableScroll > 0) {
                        const calcScrollTop = Math.max(0, previewEl.scrollTop - offsetTop)
                        const percentage = Math.min(1, Math.max(0, calcScrollTop / availableScroll))
                        sourceEl.scrollTop = percentage * sourceScrollable
                    }
                }

                cancelAnimationFrame(animFrameId)
                animFrameId = requestAnimationFrame(() => {
                    isSyncingRightRef.current = false
                })
            }

            const onContainerClick = (e: MouseEvent) => {
                if (document.activeElement?.closest('.cm-scroller')) {
                    onSourceScroll()

                    const sourceRect = sourceEl.getBoundingClientRect()
                    const clickY = e.clientY - sourceRect.top + sourceEl.scrollTop
                    const ratio = clickY / sourceEl.scrollHeight
                    const targetY = ratio * previewEl.scrollHeight

                    const editorContainer = previewEl.querySelector('.editor') as HTMLElement
                    if (editorContainer) {
                        const children = Array.from(editorContainer.children) as HTMLElement[]
                        let targetBlock = children[0]
                        let minDiff = Infinity

                        for (const child of children) {
                            const childCenter = child.offsetTop + child.offsetHeight / 2
                            const diff = Math.abs(childCenter - targetY)
                            if (diff < minDiff) {
                                minDiff = diff
                                targetBlock = child
                            }
                        }

                        if (targetBlock) {
                            targetBlock.classList.remove('sync-flash')
                            void targetBlock.offsetWidth
                            targetBlock.classList.add('sync-flash')
                        }
                    }
                } else if (document.activeElement?.closest('.editor-split__preview')) {
                    onPreviewScroll()
                }
            }

            sourceEl.addEventListener('scroll', onSourceScroll, { passive: true })
            previewEl.addEventListener('scroll', onPreviewScroll, { passive: true })
            splitContainerRef.current?.addEventListener('click', onContainerClick, { passive: true })

            return () => {
                sourceEl.removeEventListener('scroll', onSourceScroll)
                previewEl.removeEventListener('scroll', onPreviewScroll)
                splitContainerRef.current?.removeEventListener('click', onContainerClick)
                cancelAnimationFrame(animFrameId)
            }
        }

        const timer = setTimeout(syncScroll, 100)
        return () => clearTimeout(timer)
    }, [viewMode, activeTabId, splitContainerRef, isDraggingRef])
}
