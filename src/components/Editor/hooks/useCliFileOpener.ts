import { useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { readTextFile } from '@tauri-apps/plugin-fs'
import { useEditorStore } from '@/stores/editorStore'

/**
 * 监听应用程序启动时的命令行参数
 * 如果用户通过 Windows 资源管理器「打开方式」选择了 MYmd 来打开 .md 文件，
 * 系统会将文件路径作为命令行参数传递给启动的 MYmd.exe。
 * 该 Hook 将在启动时解析参数并加载对应的文件。
 */
export function useCliFileOpener() {
    const addTab = useEditorStore(s => s.addTab)

    useEffect(() => {
        let isMounted = true

        async function loadFilesFromArgs() {
            try {
                // 调用我们在 Rust 侧注册的获取进程参数方法
                const args = await invoke<string[]>('get_cli_args')
                console.log('[DEBUG] cli args:', args)

                // args[0] 通常是可执行文件路径本身，因此检查长度是否大于 1
                if (args.length > 1 && isMounted) {
                    for (let i = 1; i < args.length; i++) {
                        const filePath = args[i]
                        // 忽略可能的系统注入 flag (例如 --no-sandbox)
                        if (filePath.startsWith('-')) continue

                        try {
                            const content = await readTextFile(filePath)
                            if (isMounted) {
                                addTab(filePath, content)
                            }
                        } catch (err) {
                            console.error(`Failed to read file from cli arg: ${filePath}`, err)
                        }
                    }
                }
            } catch (e) {
                console.error('Failed to get cli args from backend', e)
            }
        }

        loadFilesFromArgs()

        return () => {
            isMounted = false
        }
    }, [addTab])
}
