import { useEffect, useRef, useCallback } from 'react'
import { Editor, rootCtx, defaultValueCtx, editorViewCtx } from '@milkdown/kit/core'
import { commonmark } from '@milkdown/kit/preset/commonmark'
import { gfm } from '@milkdown/kit/preset/gfm'
import { history } from '@milkdown/kit/plugin/history'
import { listener, listenerCtx } from '@milkdown/kit/plugin/listener'
import { clipboard } from '@milkdown/kit/plugin/clipboard'
import { indent } from '@milkdown/kit/plugin/indent'
import { trailing } from '@milkdown/kit/plugin/trailing'
import { replaceAll, callCommand } from '@milkdown/kit/utils'
import { math } from '@milkdown/plugin-math'
import { diagram } from '@milkdown/plugin-diagram'
import { prism } from '@milkdown/plugin-prism'
import { search as prosemirrorSearchPlugin, SearchQuery, setSearchState, findNext, findPrev, replaceNext, replaceAll as pmReplaceAll } from 'prosemirror-search'
import { createSyntaxHintPlugin } from './plugins/syntaxHintPlugin'

// commonmark 命令
import {
    toggleStrongCommand,
    toggleEmphasisCommand,
    toggleInlineCodeCommand,
    wrapInHeadingCommand,
    wrapInBulletListCommand,
    wrapInOrderedListCommand,
    wrapInBlockquoteCommand,
    createCodeBlockCommand,
    insertHrCommand,
    insertImageCommand,
    toggleLinkCommand,
    turnIntoTextCommand,
    sinkListItemCommand,
    liftListItemCommand,
} from '@milkdown/kit/preset/commonmark'

// gfm 命令
import {
    toggleStrikethroughCommand,
    insertTableCommand,
} from '@milkdown/kit/preset/gfm'

// history 命令
import { undoCommand, redoCommand } from '@milkdown/kit/plugin/history'

import 'katex/dist/katex.min.css'
import 'prism-themes/themes/prism-one-light.css'

import { useEditorStore } from '@/stores/editorStore'

interface WysiwygEditorProps {
    tabId: string
    content: string
    onCommandRef?: React.MutableRefObject<((cmd: string, payload?: unknown) => void) | null>
}

export function WysiwygEditor({ tabId, content, onCommandRef }: WysiwygEditorProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const editorRef = useRef<Editor | null>(null)
    const updateContent = useEditorStore(s => s.updateContent)
    const setEditorCommand = useEditorStore(s => s.setEditorCommand)
    const setActiveMarks = useEditorStore(s => s.setActiveMarks)
    // 追踪编辑器自身产生的最新 markdown，避免反向同步引起闪烁
    const lastEditorMarkdownRef = useRef(content)
    const isUpdatingRef = useRef(false)

    // 检测当前选区的活跃 marks
    const detectActiveMarks = useCallback((editor: Editor) => {
        try {
            editor.action(ctx => {
                const view = ctx.get(editorViewCtx)
                const { state } = view
                const { from, $from } = state.selection
                const marks: string[] = []

                // 检测光标位置的 storedMarks 或 当前位置的 marks
                const storedMarks = state.storedMarks || $from.marks()
                for (const mark of storedMarks) {
                    const markName = mark.type.name
                    if (markName === 'strong') marks.push('bold')
                    else if (markName === 'emphasis') marks.push('italic')
                    else if (markName === 'strikethrough') marks.push('strikethrough')
                    else if (markName === 'inlineCode') marks.push('code')
                    else if (markName === 'link') marks.push('link')
                }

                // 检测当前块级节点类型
                const node = $from.parent
                if (node.type.name === 'heading') {
                    marks.push(`heading-${node.attrs.level}`)
                } else if (node.type.name === 'blockquote' || $from.depth > 1 && $from.node($from.depth - 1)?.type.name === 'blockquote') {
                    marks.push('blockquote')
                }

                setActiveMarks(marks)
            })
        } catch {
            // 静默处理
        }
    }, [setActiveMarks])

    // 创建编辑器
    useEffect(() => {
        if (!containerRef.current) return

        let editor: Editor | null = null
        let destroyed = false

        const initEditor = async () => {
            editor = await Editor.make()
                .config(ctx => {
                    ctx.set(rootCtx, containerRef.current!)
                    ctx.set(defaultValueCtx, content)

                    // 设置内容变更监听
                    const listenerManager = ctx.get(listenerCtx)
                    listenerManager.markdownUpdated((_ctx, markdown) => {
                        if (!isUpdatingRef.current && !destroyed) {
                            lastEditorMarkdownRef.current = markdown
                            updateContent(tabId, markdown)
                        }
                    })
                })
                .use(commonmark)
                .use(gfm)
                .use(history)
                .use(listener)
                .use(clipboard)
                .use(indent)
                .use(trailing)
                .use(math)
                .use(diagram)
                .use(prism)
                .create()

            if (!destroyed) {
                editorRef.current = editor

                // 注入 Typora 风格语法提示插件
                editor.action(ctx => {
                    const view = ctx.get(editorViewCtx)

                    // 通过 reconfigure 添加自定义 ProseMirror 插件
                    const newState = view.state.reconfigure({
                        plugins: [...view.state.plugins, createSyntaxHintPlugin(), prosemirrorSearchPlugin()]
                    })
                    view.updateState(newState)

                    // 监听选区变化以更新活跃 marks
                    const dom = view.dom
                    dom.addEventListener('mouseup', () => detectActiveMarks(editor!))
                    dom.addEventListener('keyup', () => detectActiveMarks(editor!))
                })
            }
        }

        initEditor()

        return () => {
            destroyed = true
            editor?.destroy()
            editorRef.current = null
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tabId])

    // 仅当外部内容与编辑器自身产出不同时才同步
    useEffect(() => {
        if (!editorRef.current) return
        if (content === lastEditorMarkdownRef.current) return

        isUpdatingRef.current = true
        try {
            editorRef.current.action(replaceAll(content))
            lastEditorMarkdownRef.current = content
        } finally {
            isUpdatingRef.current = false
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [content])

    // 编辑器命令执行器
    const executeCommand = useCallback((cmd: string, payload?: unknown) => {
        if (!editorRef.current) return

        const editor = editorRef.current

        try {
            switch (cmd) {
                // 文本格式命令
                case 'bold':
                    editor.action(callCommand(toggleStrongCommand.key))
                    break
                case 'italic':
                    editor.action(callCommand(toggleEmphasisCommand.key))
                    break
                case 'strikethrough':
                    editor.action(callCommand(toggleStrikethroughCommand.key))
                    break
                case 'code':
                    editor.action(callCommand(toggleInlineCodeCommand.key))
                    break

                // 标题层级切换
                case 'heading':
                    editor.action(callCommand(wrapInHeadingCommand.key, payload as number))
                    break

                // 恢复为普通段落
                case 'paragraph':
                    editor.action(callCommand(turnIntoTextCommand.key))
                    break

                // 列表
                case 'bulletList':
                    editor.action(callCommand(wrapInBulletListCommand.key))
                    break
                case 'orderedList':
                    editor.action(callCommand(wrapInOrderedListCommand.key))
                    break

                // 任务列表
                case 'taskList': {
                    editor.action(ctx => {
                        const view = ctx.get(editorViewCtx)
                        const { state, dispatch } = view
                        const { from } = state.selection
                        const tr = state.tr.insertText('- [ ] ', from)
                        dispatch(tr)
                        view.focus()
                    })
                    break
                }

                // 引用
                case 'blockquote':
                    editor.action(callCommand(wrapInBlockquoteCommand.key))
                    break

                // 代码块
                case 'codeBlock':
                    editor.action(callCommand(createCodeBlockCommand.key))
                    break

                // 分隔线
                case 'hr':
                    editor.action(callCommand(insertHrCommand.key))
                    break

                // 插入链接（由 InsertDialog 调用，payload 中包含 href 和 text）
                case 'insertLink': {
                    const linkData = payload as { href: string; text?: string }
                    if (linkData?.href) {
                        editor.action(callCommand(toggleLinkCommand.key, { href: linkData.href }))
                    }
                    break
                }

                // 保留旧的 link 命令以兼容（打开弹窗）
                case 'link': {
                    useEditorStore.getState().setInsertDialog('link')
                    break
                }

                // 插入图片（由 InsertDialog 调用，payload 中包含 src 和 alt）
                case 'insertImage': {
                    const imgData = payload as { src: string; alt?: string }
                    if (imgData?.src) {
                        editor.action(callCommand(insertImageCommand.key, { src: imgData.src, alt: imgData.alt || '' }))
                    }
                    break
                }

                // 保留旧的 image 命令以兼容（打开弹窗）
                case 'image': {
                    useEditorStore.getState().setInsertDialog('image')
                    break
                }

                // 插入表格（payload 传入 { row, col }）
                case 'table': {
                    const tableData = payload as { row: number; col: number } | undefined
                    editor.action(callCommand(insertTableCommand.key, tableData || { row: 3, col: 3 }))
                    break
                }

                // 撤销/恢复
                case 'undo':
                    editor.action(callCommand(undoCommand.key))
                    break
                case 'redo':
                    editor.action(callCommand(redoCommand.key))
                    break

                // 缩进操作
                case 'indent':
                    editor.action(callCommand(sinkListItemCommand.key))
                    break
                case 'outdent':
                    editor.action(callCommand(liftListItemCommand.key))
                    break

                // 搜索相关
                case 'search': {
                    editor.action(ctx => {
                        const view = ctx.get(editorViewCtx)
                        const queryStr = payload as string
                        const query = new SearchQuery({ search: queryStr })
                        view.dispatch(setSearchState(view.state.tr, query))
                    })
                    break
                }
                case 'searchNext': {
                    editor.action(ctx => {
                        const view = ctx.get(editorViewCtx)
                        findNext(view.state, view.dispatch)
                    })
                    break
                }
                case 'searchPrev': {
                    editor.action(ctx => {
                        const view = ctx.get(editorViewCtx)
                        findPrev(view.state, view.dispatch)
                    })
                    break
                }
                case 'replace': {
                    editor.action(ctx => {
                        const view = ctx.get(editorViewCtx)
                        const { search: q, replace: r } = payload as { search: string, replace: string }
                        const query = new SearchQuery({ search: q, replace: r })
                        view.dispatch(setSearchState(view.state.tr, query))
                        replaceNext(view.state, view.dispatch)
                    })
                    break
                }
                case 'replaceAll': {
                    editor.action(ctx => {
                        const view = ctx.get(editorViewCtx)
                        const { search: q, replace: r } = payload as { search: string, replace: string }
                        const query = new SearchQuery({ search: q, replace: r })
                        view.dispatch(setSearchState(view.state.tr, query))
                        pmReplaceAll(view.state, view.dispatch)
                    })
                    break
                }

                default:
                    editor.action(ctx => {
                        const view = ctx.get(editorViewCtx)
                        view.focus()
                    })
                    break
            }

            // 命令执行后更新活跃 marks
            setTimeout(() => detectActiveMarks(editor), 50)
        } catch (e) {
            console.warn(`命令 "${cmd}" 执行失败:`, e)
        }
    }, [detectActiveMarks])

    // 将命令执行器注册到 ref 和全局 store
    useEffect(() => {
        if (onCommandRef) {
            onCommandRef.current = executeCommand
        }
        setEditorCommand(executeCommand)

        return () => {
            setEditorCommand(null)
        }
    }, [executeCommand, onCommandRef, setEditorCommand])

    return (
        <div
            ref={containerRef}
            className="editor-wysiwyg selectable"
        />
    )
}
