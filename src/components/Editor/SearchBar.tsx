import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, X, ChevronUp, ChevronDown, Replace } from 'lucide-react'
import { useEditorStore } from '@/stores/editorStore'
import './SearchBar.css'

/** 搜索/替换浮动条 */
export function SearchBar() {
    const searchVisible = useEditorStore(s => s.searchVisible)
    const setSearchVisible = useEditorStore(s => s.setSearchVisible)
    const editorCommand = useEditorStore(s => s.editorCommand)

    const [query, setQuery] = useState('')
    const [replaceText, setReplaceText] = useState('')
    const [showReplace, setShowReplace] = useState(false)
    const [matchCount, setMatchCount] = useState(0)
    const [currentMatch, setCurrentMatch] = useState(0)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (searchVisible) {
            setTimeout(() => inputRef.current?.focus(), 50)
        } else {
            setQuery('')
            setReplaceText('')
            setShowReplace(false)
            setMatchCount(0)
            setCurrentMatch(0)
        }
    }, [searchVisible])

    // 键盘快捷键
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
                e.preventDefault()
                setSearchVisible(true)
            }
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'h') {
                e.preventDefault()
                setSearchVisible(true)
                setShowReplace(true)
            }
            if (e.key === 'Escape' && searchVisible) {
                setSearchVisible(false)
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [searchVisible, setSearchVisible])

    // 搜索逻辑
    const doSearch = useCallback((searchText: string) => {
        if (!searchText.trim()) {
            setMatchCount(0)
            setCurrentMatch(0)
            return
        }
        editorCommand?.('search', searchText)
    }, [editorCommand])

    const handleQueryChange = (value: string) => {
        setQuery(value)
        doSearch(value)
    }

    const handleNext = () => {
        editorCommand?.('searchNext')
        setCurrentMatch(c => Math.min(c + 1, matchCount))
    }

    const handlePrev = () => {
        editorCommand?.('searchPrev')
        setCurrentMatch(c => Math.max(c - 1, 1))
    }

    const handleReplace = () => {
        editorCommand?.('replace', { search: query, replace: replaceText })
    }

    const handleReplaceAll = () => {
        editorCommand?.('replaceAll', { search: query, replace: replaceText })
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            if (e.shiftKey) {
                handlePrev()
            } else {
                handleNext()
            }
        }
    }

    if (!searchVisible) return null

    return (
        <div className="search-bar">
            <div className="search-bar__main">
                <button
                    className="search-bar__toggle"
                    onClick={() => setShowReplace(!showReplace)}
                    title={showReplace ? '隐藏替换' : '展开替换'}
                >
                    <Replace size={14} />
                </button>
                <div className="search-bar__input-wrap">
                    <Search size={14} className="search-bar__icon" />
                    <input
                        ref={inputRef}
                        type="text"
                        className="search-bar__input"
                        placeholder="查找..."
                        value={query}
                        onChange={(e) => handleQueryChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    {query && (
                        <span className="search-bar__count">
                            {matchCount > 0 ? `${currentMatch}/${matchCount}` : '无结果'}
                        </span>
                    )}
                </div>
                <button className="search-bar__btn" onClick={handlePrev} title="上一个 (Shift+Enter)">
                    <ChevronUp size={16} />
                </button>
                <button className="search-bar__btn" onClick={handleNext} title="下一个 (Enter)">
                    <ChevronDown size={16} />
                </button>
                <button className="search-bar__btn search-bar__close" onClick={() => setSearchVisible(false)} title="关闭 (Esc)">
                    <X size={16} />
                </button>
            </div>
            {showReplace && (
                <div className="search-bar__replace">
                    <div className="search-bar__input-wrap">
                        <input
                            type="text"
                            className="search-bar__input"
                            placeholder="替换为..."
                            value={replaceText}
                            onChange={(e) => setReplaceText(e.target.value)}
                        />
                    </div>
                    <button className="search-bar__replace-btn" onClick={handleReplace}>
                        替换
                    </button>
                    <button className="search-bar__replace-btn" onClick={handleReplaceAll}>
                        全部替换
                    </button>
                </div>
            )}
        </div>
    )
}
