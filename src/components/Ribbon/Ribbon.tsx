import { useState, useCallback, useRef, useEffect } from 'react'
import {
    ClipboardPaste, Copy, Scissors,
    Bold, Italic, Underline, Strikethrough,
    List, ListOrdered, IndentDecrease, IndentIncrease,
    PenTool, Columns2,
    Table, Image, Link, Code, CodeSquare, Minus,
    Quote, CheckSquare, FileText, FolderOpen, Save, FilePlus, Download,
    type LucideIcon
} from 'lucide-react'
import { useEditorStore } from '@/stores/editorStore'
import { TablePicker } from './TablePicker'
import './Ribbon.css'

// 检测 Electron 环境
const isElectron = typeof window !== 'undefined' && window.api !== undefined

interface RibbonGroupProps {
    title: string;
    children: React.ReactNode;
}

const RibbonGroup = ({ title, children }: RibbonGroupProps) => (
    <div className="ribbon-group">
        <div className="ribbon-group__content">
            {children}
        </div>
        <div className="ribbon-group__title">{title}</div>
    </div>
)

interface RibbonButtonProps {
    icon: LucideIcon;
    label?: string;
    active?: boolean;
    onClick?: () => void;
    large?: boolean;
    disabled?: boolean;
}

const RibbonButton = ({ icon: Icon, label, active, onClick, large = false, disabled = false }: RibbonButtonProps) => (
    <button
        className={`ribbon-btn ${large ? 'ribbon-btn--large' : ''} ${active ? 'active' : ''}`}
        onClick={onClick}
        disabled={disabled}
        title={label}
    >
        <Icon size={large ? 24 : 16} strokeWidth={large ? 1.5 : 2} />
        {large && label && <span className="ribbon-btn__label">{label}</span>}
    </button>
)

export function Ribbon() {
    const [activeTab, setActiveTab] = useState('home')
    const viewMode = useEditorStore(s => s.viewMode)
    const setViewMode = useEditorStore(s => s.setViewMode)
    const executeCommand = useEditorStore(s => s.executeCommand)
    const saveActiveTab = useEditorStore(s => s.saveActiveTab)
    const addTab = useEditorStore(s => s.addTab)
    const activeMarks = useEditorStore(s => s.activeMarks)
    const setInsertDialog = useEditorStore(s => s.setInsertDialog)
    const setSearchVisible = useEditorStore(s => s.setSearchVisible)

    // 表格选择器
    const [showTablePicker, setShowTablePicker] = useState(false)
    const tablePickerRef = useRef<HTMLDivElement>(null)

    // 点击外部关闭表格选择器
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (tablePickerRef.current && !tablePickerRef.current.contains(e.target as Node)) {
                setShowTablePicker(false)
            }
        }
        document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [])

    // 编辑器命令快捷调用
    const exec = useCallback((cmd: string, payload?: unknown) => {
        executeCommand(cmd, payload)
    }, [executeCommand])

    // 文件操作
    const handleNewFile = useCallback(() => {
        addTab(null, '# 新文档\n\n开始编写...\n')
    }, [addTab])

    const handleOpenFile = useCallback(async () => {
        if (!isElectron) {
            addTab(null, '# 浏览器模式\n\n在 Electron 环境中可以打开本地文件。\n')
            return
        }
        const result = await window.api.file.openDialog()
        if (result.success && result.filePaths) {
            for (const filePath of result.filePaths) {
                const readResult = await window.api.file.read(filePath)
                if (readResult.success && readResult.content !== undefined) {
                    const tabId = addTab(filePath, readResult.content)
                    useEditorStore.getState().markSaved(tabId, filePath)
                }
            }
        }
    }, [addTab])

    const handleSaveAs = useCallback(async () => {
        if (!isElectron) return
        const tab = useEditorStore.getState().getActiveTab()
        if (!tab) return
        const result = await window.api.file.saveAs(tab.content, tab.filePath ?? undefined)
        if (result.success && result.filePath) {
            useEditorStore.getState().markSaved(tab.id, result.filePath)
        }
    }, [])

    // 剪贴板操作
    const handleCopy = () => document.execCommand('copy')
    const handleCut = () => document.execCommand('cut')
    const handlePaste = () => {
        navigator.clipboard?.readText().then(text => {
            document.execCommand('insertText', false, text)
        }).catch(() => {
            document.execCommand('paste')
        })
    }

    // 检测 mark 是否激活
    const isActive = (mark: string) => activeMarks.includes(mark)

    return (
        <div className="ribbon">
            <div className="ribbon__tabs">
                <button
                    className={`ribbon__tab ${activeTab === 'file' ? 'active' : ''}`}
                    onClick={() => setActiveTab('file')}
                >
                    文件
                </button>
                <button
                    className={`ribbon__tab ${activeTab === 'home' ? 'active' : ''}`}
                    onClick={() => setActiveTab('home')}
                >
                    开始
                </button>
                <button
                    className={`ribbon__tab ${activeTab === 'insert' ? 'active' : ''}`}
                    onClick={() => setActiveTab('insert')}
                >
                    插入
                </button>
                <button
                    className={`ribbon__tab ${activeTab === 'view' ? 'active' : ''}`}
                    onClick={() => setActiveTab('view')}
                >
                    视图
                </button>
            </div>

            <div className="ribbon__panels">
                {/* 文件选项卡面板 */}
                {activeTab === 'file' && (
                    <div className="ribbon__panel">
                        <RibbonGroup title="文件操作">
                            <RibbonButton icon={FilePlus} label="新建" onClick={handleNewFile} large />
                            <RibbonButton icon={FolderOpen} label="打开" onClick={handleOpenFile} large />
                            <div className="ribbon-btn-col">
                                <RibbonButton icon={Save} label="保存" onClick={() => saveActiveTab()} />
                                <RibbonButton icon={Download} label="另存为" onClick={handleSaveAs} />
                            </div>
                        </RibbonGroup>
                    </div>
                )}

                {/* 开始选项卡面板 */}
                {activeTab === 'home' && (
                    <div className="ribbon__panel">
                        <RibbonGroup title="剪贴板">
                            <RibbonButton icon={ClipboardPaste} label="粘贴" onClick={handlePaste} large />
                            <div className="ribbon-btn-col">
                                <RibbonButton icon={Scissors} label="剪切" onClick={handleCut} />
                                <RibbonButton icon={Copy} label="复制" onClick={handleCopy} />
                            </div>
                        </RibbonGroup>

                        <div className="ribbon-divider" />

                        <RibbonGroup title="字体">
                            <div className="ribbon-btn-row mt-1">
                                <RibbonButton icon={Bold} label="加粗 (Ctrl+B)" active={isActive('bold')} onClick={() => exec('bold')} />
                                <RibbonButton icon={Italic} label="斜体 (Ctrl+I)" active={isActive('italic')} onClick={() => exec('italic')} />
                                <RibbonButton icon={Underline} label="下划线" disabled />
                                <RibbonButton icon={Strikethrough} label="删除线" active={isActive('strikethrough')} onClick={() => exec('strikethrough')} />
                                <RibbonButton icon={Code} label="行内代码" active={isActive('code')} onClick={() => exec('code')} />
                            </div>
                        </RibbonGroup>

                        <div className="ribbon-divider" />

                        <RibbonGroup title="段落">
                            <div className="ribbon-btn-row">
                                <RibbonButton icon={List} label="无序列表" onClick={() => exec('bulletList')} />
                                <RibbonButton icon={ListOrdered} label="有序列表" onClick={() => exec('orderedList')} />
                                <RibbonButton icon={CheckSquare} label="任务列表" onClick={() => exec('taskList')} />
                                <div className="ribbon-spacer" />
                                <RibbonButton icon={IndentDecrease} label="减少缩进" onClick={() => exec('outdent')} />
                                <RibbonButton icon={IndentIncrease} label="增加缩进" onClick={() => exec('indent')} />
                            </div>
                            <div className="ribbon-btn-row mt-1">
                                <RibbonButton icon={Quote} label="引用" active={isActive('blockquote')} onClick={() => exec('blockquote')} />
                            </div>
                        </RibbonGroup>
                    </div>
                )}

                {/* 插入选项卡面板 */}
                {activeTab === 'insert' && (
                    <div className="ribbon__panel">
                        <RibbonGroup title="表格">
                            <div ref={tablePickerRef} style={{ position: 'relative' }}>
                                <RibbonButton
                                    icon={Table}
                                    label="插入表格"
                                    onClick={() => setShowTablePicker(!showTablePicker)}
                                    large
                                />
                                {showTablePicker && (
                                    <TablePicker
                                        onSelect={(rows, cols) => exec('table', { row: rows, col: cols })}
                                        onClose={() => setShowTablePicker(false)}
                                    />
                                )}
                            </div>
                        </RibbonGroup>

                        <div className="ribbon-divider" />

                        <RibbonGroup title="媒体">
                            <RibbonButton icon={Image} label="插入图片" onClick={() => setInsertDialog('image')} large />
                            <RibbonButton icon={Link} label="插入链接" onClick={() => setInsertDialog('link')} large />
                        </RibbonGroup>

                        <div className="ribbon-divider" />

                        <RibbonGroup title="代码与公式">
                            <RibbonButton icon={CodeSquare} label="代码块" onClick={() => exec('codeBlock')} large />
                            <RibbonButton icon={Minus} label="分隔线" onClick={() => exec('hr')} large />
                        </RibbonGroup>
                    </div>
                )}

                {/* 视图选项卡面板 */}
                {activeTab === 'view' && (
                    <div className="ribbon__panel">
                        <RibbonGroup title="视图模式">
                            <RibbonButton
                                icon={PenTool}
                                label="所见即所得"
                                active={viewMode === 'wysiwyg'}
                                onClick={() => setViewMode('wysiwyg')}
                                large
                            />
                            <RibbonButton
                                icon={Columns2}
                                label="源码 & 预览"
                                active={viewMode === 'split'}
                                onClick={() => setViewMode('split')}
                                large
                            />
                        </RibbonGroup>
                    </div>
                )}
            </div>
        </div>
    )
}
