import { useState, useRef, useEffect, RefObject } from 'react'

export function useSplitPanes(viewMode: 'wysiwyg' | 'split', splitContainerRef: RefObject<HTMLDivElement | null>) {
    const [splitRatio, setSplitRatio] = useState(50) // 左右比例 (0-100)
    const isDraggingRef = useRef(false)

    useEffect(() => {
        if (viewMode !== 'split') return

        const handleMouseMove = (e: MouseEvent) => {
            if (!isDraggingRef.current) return
            const container = splitContainerRef.current
            if (!container) return

            const rect = container.getBoundingClientRect()
            const x = e.clientX - rect.left
            const newRatio = (x / rect.width) * 100

            if (newRatio > 20 && newRatio < 80) {
                setSplitRatio(newRatio)
            }
        }

        const handleMouseUp = () => {
            if (isDraggingRef.current) {
                isDraggingRef.current = false
                document.body.style.cursor = 'default'
                // 强制重新渲染以移除 transition: none
                setSplitRatio(r => r)
            }
        }

        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mouseup', handleMouseUp)

        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
        }
    }, [viewMode, splitContainerRef])

    const startDragging = (e: React.MouseEvent) => {
        e.preventDefault()
        isDraggingRef.current = true
        document.body.style.cursor = 'col-resize'
        setSplitRatio(r => r)
    }

    return { splitRatio, isDraggingRef, startDragging }
}
