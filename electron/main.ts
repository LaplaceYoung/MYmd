import { app, BrowserWindow, ipcMain, dialog, shell, protocol, net } from 'electron'
import { join } from 'path'
import { readFile, writeFile, copyFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { basename, dirname, relative, extname } from 'path'
import { pathToFileURL } from 'url'

// 单实例锁定
const gotTheLock = app.requestSingleInstanceLock()

let mainWindow: BrowserWindow | null = null

// 是否强制关闭（跳过 dirty check）
let forceQuit = false

// 待打开的文件路径队列（从命令行参数或文件双击获取）
let pendingFilePaths: string[] = []

function createWindow(): void {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 600,
        minHeight: 400,
        frame: false, // 无边框窗口，使用自定义标题栏
        titleBarStyle: 'hidden',
        backgroundColor: '#1e1e2e',
        webPreferences: {
            preload: join(__dirname, '../preload/index.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false
        },
        show: false
    })

    // 窗口准备好后显示，避免白屏闪烁
    mainWindow.once('ready-to-show', () => {
        mainWindow?.show()

        // 发送待打开的文件
        if (pendingFilePaths.length > 0) {
            pendingFilePaths.forEach(filePath => {
                mainWindow?.webContents.send('file:opened-external', filePath)
            })
            pendingFilePaths = []
        }
    })

    // 窗口关闭拦截：检查未保存更改
    mainWindow.on('close', (e) => {
        if (!forceQuit && mainWindow) {
            e.preventDefault()
            // 通知渲染进程检查是否有未保存更改
            mainWindow.webContents.send('window:request-close')
        }
    })

    // 开发模式加载本地服务器，生产模式加载打包文件
    if (process.env.ELECTRON_RENDERER_URL) {
        mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
    } else {
        mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
    }
}

// 从命令行参数中提取 .md 文件路径
function extractMdPaths(args: string[]): string[] {
    return args
        .filter(arg => arg.endsWith('.md') && !arg.startsWith('-'))
        .map(arg => arg.replace(/"/g, ''))
}

// 初始化时收集命令行中的文件路径
pendingFilePaths = extractMdPaths(process.argv)

if (!gotTheLock) {
    // 第二个实例：退出，让第一个实例处理
    app.quit()
} else {
    // 第二个实例尝试启动时，在第一个实例中处理
    app.on('second-instance', (_event, commandLine) => {
        const filePaths = extractMdPaths(commandLine)
        filePaths.forEach(filePath => {
            mainWindow?.webContents.send('file:opened-external', filePath)
        })

        // 聚焦主窗口
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore()
            mainWindow.focus()
        }
    })

    app.whenReady().then(() => {
        // 注册自定义协议：允许渲染进程加载本地文件（图片等）
        protocol.handle('local-file', (request) => {
            // local-file:///C:/path/to/file.png -> file:///C:/path/to/file.png
            const filePath = decodeURIComponent(request.url.replace('local-file://', 'file://'))
            return net.fetch(filePath)
        })

        createWindow()
        registerIpcHandlers()
    })
}

app.on('window-all-closed', () => {
    app.quit()
})

// ==================== IPC 处理 ====================

function registerIpcHandlers(): void {
    // 窗口控制
    ipcMain.on('window:minimize', () => mainWindow?.minimize())
    ipcMain.on('window:maximize', () => {
        if (mainWindow?.isMaximized()) {
            mainWindow.unmaximize()
        } else {
            mainWindow?.maximize()
        }
    })
    ipcMain.on('window:close', () => mainWindow?.close())

    // 强制关闭窗口（跳过 dirty check，由渲染进程确认后调用）
    ipcMain.on('window:force-close', () => {
        forceQuit = true
        mainWindow?.close()
    })

    ipcMain.handle('window:isMaximized', () => mainWindow?.isMaximized())

    // 窗口最大化状态变化通知
    mainWindow?.on('maximize', () => {
        mainWindow?.webContents.send('window:maximized-changed', true)
    })
    mainWindow?.on('unmaximize', () => {
        mainWindow?.webContents.send('window:maximized-changed', false)
    })

    // 读取文件
    ipcMain.handle('file:read', async (_event, filePath: string) => {
        try {
            const content = await readFile(filePath, 'utf-8')
            return { success: true, content, filePath }
        } catch (error) {
            return { success: false, error: String(error) }
        }
    })

    // 保存文件
    ipcMain.handle('file:save', async (_event, filePath: string, content: string) => {
        try {
            await writeFile(filePath, content, 'utf-8')
            return { success: true }
        } catch (error) {
            return { success: false, error: String(error) }
        }
    })

    // 另存为
    ipcMain.handle('file:saveAs', async (_event, content: string, defaultPath?: string) => {
        const result = await dialog.showSaveDialog(mainWindow!, {
            defaultPath,
            filters: [
                { name: 'Markdown 文件', extensions: ['md'] },
                { name: '所有文件', extensions: ['*'] }
            ]
        })

        if (result.canceled || !result.filePath) {
            return { success: false, canceled: true }
        }

        try {
            await writeFile(result.filePath, content, 'utf-8')
            return { success: true, filePath: result.filePath }
        } catch (error) {
            return { success: false, error: String(error) }
        }
    })

    // 打开文件对话框
    ipcMain.handle('file:openDialog', async () => {
        const result = await dialog.showOpenDialog(mainWindow!, {
            properties: ['openFile', 'multiSelections'],
            filters: [
                { name: 'Markdown 文件', extensions: ['md'] },
                { name: '所有文件', extensions: ['*'] }
            ]
        })

        if (result.canceled) {
            return { success: false, canceled: true }
        }

        return { success: true, filePaths: result.filePaths }
    })

    // 插入图片：复制到 md 文件同级 assets 目录
    ipcMain.handle('file:insertImage', async (_event, mdFilePath: string, imagePath: string) => {
        try {
            const mdDir = dirname(mdFilePath)
            const assetsDir = join(mdDir, 'assets')

            // 创建 assets 目录
            if (!existsSync(assetsDir)) {
                await mkdir(assetsDir, { recursive: true })
            }

            const imageFileName = basename(imagePath)
            const targetPath = join(assetsDir, imageFileName)

            await copyFile(imagePath, targetPath)

            // 生成相对路径（用于 Markdown 文件保存）
            const relativePath = relative(mdDir, targetPath).replace(/\\/g, '/')
            // 生成 local-file 协议 URL（用于渲染进程实时预览）
            const absoluteUrl = 'local-file:///' + targetPath.replace(/\\/g, '/')
            return { success: true, relativePath, absoluteUrl }
        } catch (error) {
            return { success: false, error: String(error) }
        }
    })

    // 在系统文件管理器中显示文件
    ipcMain.handle('file:showInFolder', async (_event, filePath: string) => {
        shell.showItemInFolder(filePath)
    })
}
