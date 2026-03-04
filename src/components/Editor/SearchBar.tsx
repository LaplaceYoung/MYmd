import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Search, X, ChevronUp, ChevronDown, Replace, History, Trash2 } from 'lucide-react'
import { useEditorStore } from '@/stores/editorStore'
import './SearchBar.css'

export function SearchBar() {
    const searchVisible = useEditorStore(s => s.searchVisible)
    const setSearchVisible = useEditorStore(s => s.setSearchVisible)
    const executeCommand = useEditorStore(s => s.executeCommand)
    const searchHistory = useEditorStore(s => s.searchHistory)
    const pushSearchHistory = useEditorStore(s => s.pushSearchHistory)
    const clearSearchHistory = useEditorStore(s => s.clearSearchHistory)
    const activeTabContent = useEditorStore(
        s => s.tabs.find(tab => tab.id === s.activeTabId)?.content ?? ''
    )

    const [query, setQuery] = useState('')
    const [replaceText, setReplaceText] = useState('')
    const [showReplace, setShowReplace] = useState(false)
    const [matchCount, setMatchCount] = useState(0)
    const [currentMatch, setCurrentMatch] = useState(0)
    const [showHistory, setShowHistory] = useState(false)
    const [historyIndex, setHistoryIndex] = useState(-1)
    const [feedback, setFeedback] = useState<string | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const feedbackTimerRef = useRef<number | null>(null)

    const filteredHistory = useMemo(() => {
        const normalized = query.trim().toLowerCase()
        if (!normalized) return searchHistory
        return searchHistory.filter(item => item.toLowerCase().includes(normalized))
    }, [query, searchHistory])

    const flashFeedback = useCallback((message: string) => {
        setFeedback(message)
        if (feedbackTimerRef.current) {
            window.clearTimeout(feedbackTimerRef.current)
        }
        feedbackTimerRef.current = window.setTimeout(() => {
            setFeedback(null)
            feedbackTimerRef.current = null
        }, 1600)
    }, [])

    const updateMatchStats = useCallback((rawQuery: string, content: string) => {
        const normalizedQuery = rawQuery.trim()
        if (!normalizedQuery) {
            setMatchCount(0)
            setCurrentMatch(0)
            return 0
        }

        let count = 0
        let start = 0
        while (start <= content.length) {
            const idx = content.indexOf(normalizedQuery, start)
            if (idx === -1) break
            count += 1
            start = idx + normalizedQuery.length
        }

        setMatchCount(count)
        setCurrentMatch(prev => {
            if (count === 0) return 0
            if (prev <= 0) return 1
            return Math.min(prev, count)
        })
        return count
    }, [])

    useEffect(() => {
        if (searchVisible) {
            setTimeout(() => inputRef.current?.focus(), 50)
        } else {
            setQuery('')
            setReplaceText('')
            setShowReplace(false)
            setMatchCount(0)
            setCurrentMatch(0)
            setShowHistory(false)
            setHistoryIndex(-1)
            setFeedback(null)
        }
    }, [searchVisible])

    useEffect(() => {
        updateMatchStats(query, activeTabContent)
    }, [query, activeTabContent, updateMatchStats])

    useEffect(() => {
        return () => {
            if (feedbackTimerRef.current) {
                window.clearTimeout(feedbackTimerRef.current)
            }
        }
    }, [])

    const doSearch = useCallback((searchText: string, addToHistory = false) => {
        const normalized = searchText.trim()
        if (!normalized) {
            setMatchCount(0)
            setCurrentMatch(0)
            return
        }

        executeCommand('search', normalized)
        if (addToHistory) {
            pushSearchHistory(normalized)
        }

        const count = updateMatchStats(normalized, activeTabContent)
        flashFeedback(count > 0 ? `Found ${count} matches` : 'No matches found')
    }, [executeCommand, pushSearchHistory, updateMatchStats, activeTabContent, flashFeedback])

    const handleQueryChange = (value: string) => {
        setQuery(value)
        setShowHistory(true)
        setHistoryIndex(-1)
        doSearch(value)
    }

    const handleNext = useCallback(() => {
        if (matchCount <= 0) {
            setCurrentMatch(0)
            flashFeedback('No matches found')
            return
        }
        executeCommand('searchNext')
        setCurrentMatch(c => (c <= 0 || c >= matchCount ? 1 : c + 1))
    }, [matchCount, executeCommand, flashFeedback])

    const handlePrev = useCallback(() => {
        if (matchCount <= 0) {
            setCurrentMatch(0)
            flashFeedback('No matches found')
            return
        }
        executeCommand('searchPrev')
        setCurrentMatch(c => (c <= 1 ? matchCount : c - 1))
    }, [matchCount, executeCommand, flashFeedback])

    const handleReplace = useCallback(() => {
        if (!query.trim()) return
        executeCommand('replace', { search: query, replace: replaceText })
        doSearch(query)
        flashFeedback('Replaced current match')
    }, [executeCommand, query, replaceText, doSearch, flashFeedback])

    const handleReplaceAll = useCallback(() => {
        if (!query.trim()) return
        executeCommand('replaceAll', { search: query, replace: replaceText })
        doSearch(query)
        flashFeedback('Replaced all matches')
    }, [executeCommand, query, replaceText, doSearch, flashFeedback])

    const applyHistoryItem = useCallback((term: string) => {
        setQuery(term)
        setShowHistory(false)
        setHistoryIndex(-1)
        doSearch(term, true)
    }, [doSearch])

    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
                e.preventDefault()
                setSearchVisible(true)
                return
            }

            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'h') {
                e.preventDefault()
                setSearchVisible(true)
                setShowReplace(true)
                return
            }

            if (!searchVisible) return

            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'g') {
                e.preventDefault()
                if (e.shiftKey) {
                    handlePrev()
                } else {
                    handleNext()
                }
                return
            }

            if (e.key === 'Escape') {
                e.preventDefault()
                setSearchVisible(false)
            }
        }

        window.addEventListener('keydown', handleGlobalKeyDown)
        return () => window.removeEventListener('keydown', handleGlobalKeyDown)
    }, [searchVisible, setSearchVisible, handleNext, handlePrev])

    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.altKey && e.key === 'Enter') {
            e.preventDefault()
            handleReplace()
            return
        }

        if (showHistory && filteredHistory.length > 0 && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
            e.preventDefault()
            if (e.key === 'ArrowDown') {
                setHistoryIndex(prev => Math.min(prev + 1, filteredHistory.length - 1))
            } else {
                setHistoryIndex(prev => Math.max(prev - 1, -1))
            }
            return
        }

        if (e.key === 'Enter') {
            e.preventDefault()

            if (showHistory && historyIndex >= 0 && filteredHistory[historyIndex]) {
                applyHistoryItem(filteredHistory[historyIndex])
                return
            }

            pushSearchHistory(query)
            if (e.shiftKey) {
                handlePrev()
            } else {
                handleNext()
            }
            return
        }
    }

    if (!searchVisible) return null

    return (
        <div className="search-bar">
            <div className="search-bar__main">
                <button
                    className="search-bar__toggle"
                    onClick={() => setShowReplace(!showReplace)}
                    title={showReplace ? 'Hide replace' : 'Show replace'}
                >
                    <Replace size={14} />
                </button>

                <div className="search-bar__input-wrap">
                    <Search size={14} className="search-bar__icon" />
                    <input
                        ref={inputRef}
                        type="text"
                        className="search-bar__input"
                        placeholder="Find in document..."
                        value={query}
                        onFocus={() => setShowHistory(true)}
                        onChange={(e) => handleQueryChange(e.target.value)}
                        onKeyDown={handleInputKeyDown}
                    />
                    {query && (
                        <span className="search-bar__count">
                            {matchCount > 0 ? `${currentMatch}/${matchCount}` : 'No result'}
                        </span>
                    )}
                </div>

                <button className="search-bar__btn" onClick={handlePrev} title="Previous (Shift+Enter / Ctrl+Shift+G)">
                    <ChevronUp size={16} />
                </button>
                <button className="search-bar__btn" onClick={handleNext} title="Next (Enter / Ctrl+G)">
                    <ChevronDown size={16} />
                </button>
                <button className="search-bar__btn search-bar__close" onClick={() => setSearchVisible(false)} title="Close (Esc)">
                    <X size={16} />
                </button>
            </div>

            <div className="search-bar__meta">
                <span className="search-bar__shortcut">Enter/Shift+Enter: Next/Prev</span>
                <span className="search-bar__shortcut">Ctrl/Cmd+G: Navigate</span>
                <span className="search-bar__shortcut">Alt+Enter: Replace current</span>
            </div>

            {feedback && <div className="search-bar__feedback">{feedback}</div>}

            {showHistory && filteredHistory.length > 0 && (
                <div className="search-bar__history">
                    <div className="search-bar__history-head">
                        <span className="search-bar__history-title">
                            <History size={12} />
                            Recent searches
                        </span>
                        <button className="search-bar__history-clear" onClick={clearSearchHistory} title="Clear search history">
                            <Trash2 size={12} />
                            Clear
                        </button>
                    </div>
                    <ul className="search-bar__history-list">
                        {filteredHistory.map((item, idx) => (
                            <li key={item}>
                                <button
                                    className={`search-bar__history-item${idx === historyIndex ? ' is-active' : ''}`}
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => applyHistoryItem(item)}
                                >
                                    {item}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {showReplace && (
                <div className="search-bar__replace">
                    <div className="search-bar__input-wrap">
                        <input
                            type="text"
                            className="search-bar__input"
                            placeholder="Replace with..."
                            value={replaceText}
                            onChange={(e) => setReplaceText(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.altKey && e.key === 'Enter') {
                                    e.preventDefault()
                                    handleReplace()
                                }
                            }}
                        />
                    </div>
                    <button className="search-bar__replace-btn" onClick={handleReplace}>
                        Replace
                    </button>
                    <button className="search-bar__replace-btn" onClick={handleReplaceAll}>
                        Replace all
                    </button>
                </div>
            )}
        </div>
    )
}
