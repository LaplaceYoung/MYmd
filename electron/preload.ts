import { contextBridge, ipcRenderer } from 'electron'

// 类型定义
export interface FileReadResult {
    success: boolean
    content?: string
    filePath?: string
    error?: string
}

export interface FileSaveResult {
    success: boolean
    canceled?: boolean
    filePath?: string
    error?: string
}

export interface FileOpenResult {
    success: boolean
    canceled?: boolean
    filePaths?: string[]
}

export interface ImageInsertResult {
    success: boolean
    relativePath?: string
    absoluteUrl?: string
    error?: string
}

// 暴露 API 到渲染进程
const api = {
    // 窗口控制
    window: {
        minimize: () => ipcRenderer.send('window:minimize'),
        maximize: () => ipcRenderer.send('window:maximize'),
        close: () => ipcRenderer.send('window:close'),
        /** 强制关闭窗口（跳过 dirty check） */
        forceClose: () => ipcRenderer.send('window:force-close'),
        isMaximized: (): Promise<boolean> => ipcRenderer.invoke('window:isMaximized'),
        onMaximizedChanged: (callback: (isMaximized: boolean) => void) => {
            const handler = (_event: Electron.IpcRendererEvent, isMaximized: boolean) => callback(isMaximized)
            ipcRenderer.on('window:maximized-changed', handler)
            return () => ipcRenderer.removeListener('window:maximized-changed', handler)
        },
        /** 监听主进程的关闭确认请求（Alt+F4 / 窗口 X 按钮触发） */
        onRequestClose: (callback: () => void) => {
            const handler = () => callback()
            ipcRenderer.on('window:request-close', handler)
            return () => ipcRenderer.removeListener('window:request-close', handler)
        }
    },

    // 文件操作
    file: {
        read: (filePath: string): Promise<FileReadResult> =>
            ipcRenderer.invoke('file:read', filePath),
        save: (filePath: string, content: string): Promise<FileSaveResult> =>
            ipcRenderer.invoke('file:save', filePath, content),
        saveAs: (content: string, defaultPath?: string): Promise<FileSaveResult> =>
            ipcRenderer.invoke('file:saveAs', content, defaultPath),
        openDialog: (): Promise<FileOpenResult> =>
            ipcRenderer.invoke('file:openDialog'),
        insertImage: (mdFilePath: string, imagePath: string): Promise<ImageInsertResult> =>
            ipcRenderer.invoke('file:insertImage', mdFilePath, imagePath),
        showInFolder: (filePath: string): Promise<void> =>
            ipcRenderer.invoke('file:showInFolder', filePath),

        // 监听外部打开文件
        onOpenedExternal: (callback: (filePath: string) => void) => {
            const handler = (_event: Electron.IpcRendererEvent, filePath: string) => callback(filePath)
            ipcRenderer.on('file:opened-external', handler)
            return () => ipcRenderer.removeListener('file:opened-external', handler)
        }
    }
}

contextBridge.exposeInMainWorld('api', api)

// 类型导出，供渲染进程使用
export type ElectronAPI = typeof api
