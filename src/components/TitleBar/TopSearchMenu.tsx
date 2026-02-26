import { useState, useRef, useEffect } from 'react'
import { Search, ChevronRight, FileText, Printer, ListOrdered, Type } from 'lucide-react'
import { useEditorStore } from '@/stores/editorStore'

export function TopSearchMenu() {
    const [isFocused, setIsFocused] = useState(false)
    const [inputValue, setInputValue] = useState('')
    const inputRef = useRef<HTMLInputElement>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const setSearchVisible = useEditorStore(s => s.setSearchVisible)
    const executeCommand = useEditorStore(s => s.executeCommand)
    const watermark = useEditorStore(s => s.watermark)
    const setWatermark = useEditorStore(s => s.setWatermark)
    const spellcheck = useEditorStore(s => s.spellcheck)
    const setSpellcheck = useEditorStore(s => s.setSpellcheck)

    const activeTab = useEditorStore(s => {
        const id = s.activeTabId
        return s.tabs.find(t => t.id === id)
    })

    // 监听全局 Alt+Q 进行聚焦
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.altKey && e.key.toLowerCase() === 'q') {
                e.preventDefault()
                if (inputRef.current) {
                    inputRef.current.focus()
                }
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    // 点击外部区域关闭下拉框
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(e.target as Node) &&
                inputRef.current &&
                !inputRef.current.contains(e.target as Node)
            ) {
                setIsFocused(false)
            }
        }

        if (isFocused) {
            window.addEventListener('mousedown', handleClickOutside)
        }
        return () => window.removeEventListener('mousedown', handleClickOutside)
    }, [isFocused])

    // 如果按下回车，自动把文字交给全局 SearchBar 并关闭自己
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && inputValue.trim() !== '') {
            // 这里我们粗略地唤起 SearchBar 并且把焦点让出
            setSearchVisible(true)
            setIsFocused(false)
            inputRef.current?.blur()
        }
    }

    // 唤起原生搜索框
    const invokeOriginalSearch = () => {
        setSearchVisible(true)
        setIsFocused(false)
        inputRef.current?.blur()
    }

    const handleInsertTOC = () => {
        executeCommand('insertText', '\n[TOC]\n')
        setIsFocused(false)
    }

    const handleToggleWatermark = () => {
        setWatermark(!watermark)
        setIsFocused(false)
    }

    const handleToggleSpellcheck = () => {
        setSpellcheck(!spellcheck)
        setIsFocused(false)
    }

    const handleWordCount = () => {
        if (activeTab) {
            const charCount = activeTab.content.length
            const wordCount = activeTab.content.trim().split(/\s+/).filter(Boolean).length
            alert(`📝 字数统计:\n\n当前文档大约包含了 ${wordCount} 个词/字\n总计产生了 ${charCount} 个字符。`)
        } else {
            alert('❌ 当前没有打开的文档')
        }
        setIsFocused(false)
    }

    const handlePrint = () => {
        window.print()
        setIsFocused(false)
    }

    return (
        <div className={`top-search-menu ${isFocused ? 'is-focused' : ''}`}>
            <div className="top-search-menu__input-wrapper">
                <Search size={14} className="top-search-menu__icon" />
                <input
                    ref={inputRef}
                    type="text"
                    className="top-search-menu__input"
                    placeholder="搜索操作、文本、帮助等 (Alt+Q)"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onKeyDown={handleKeyDown}
                />
            </div>

            {isFocused && (
                <div className="top-search-dropdown" ref={dropdownRef}>
                    {/* 最近使用过的操作 */}
                    <div className="top-search-dropdown__section">
                        <div className="top-search-dropdown__section-title">最近使用过的操作</div>
                        <div className="top-search-item" onClick={invokeOriginalSearch}>
                            <ListOrdered size={16} />
                            <span className="top-search-item__text">在当前文档中查找</span>
                            <ChevronRight size={14} className="top-search-item__arrow" />
                        </div>
                        <div className="top-search-item" onClick={handleInsertTOC}>
                            <FileText size={16} />
                            <span className="top-search-item__text">目录</span>
                            <ChevronRight size={14} className="top-search-item__arrow" />
                        </div>
                        <div className="top-search-item">
                            {/* 留空作为图标对齐 */}
                            <div className="top-search-item__icon-placeholder"></div>
                            <span className="top-search-item__text">签名服务和数字标识</span>
                        </div>
                        <div className="top-search-item" onClick={handleToggleWatermark}>
                            <span style={{ width: 16, display: 'flex', justifyContent: 'center' }}>
                                <Type size={16} color={watermark ? 'var(--accent)' : 'inherit'} />
                            </span>
                            <span className="top-search-item__text">
                                {watermark ? '取消水印' : '水印'}
                            </span>
                        </div>
                    </div>

                    <div className="top-search-dropdown__divider"></div>

                    {/* 建议的操作 */}
                    <div className="top-search-dropdown__section">
                        <div className="top-search-dropdown__section-title">建议的操作</div>
                        <div className="top-search-item" onClick={handleToggleSpellcheck}>
                            <span style={{ width: 16, display: 'flex', justifyContent: 'center', color: spellcheck ? 'var(--success, #107c10)' : 'inherit' }}>
                                {spellcheck ? 'A✓' : 'A...'}
                            </span>
                            <span className="top-search-item__text">
                                {spellcheck ? '关闭拼写和语法检查' : '开启拼写和语法'}
                            </span>
                        </div>
                        <div className="top-search-item" onClick={handleWordCount}>
                            <span style={{ width: 16, display: 'flex', justifyContent: 'center', fontSize: 10, fontWeight: 'bold', letterSpacing: -1 }}>123</span>
                            <span className="top-search-item__text">字数统计</span>
                        </div>
                        <div className="top-search-item" onClick={handlePrint}>
                            <Printer size={16} color="var(--success, #107c10)" />
                            <span className="top-search-item__text">打印</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
