/// <reference types="vite/client" />
// 全局类型声明：将 preload 中暴露的 API 类型注入到 window 对象
import type { ElectronAPI } from '../electron/preload'

declare global {
    interface Window {
        api: ElectronAPI
    }
}

declare module '*.jpeg' {
    const src: string
    export default src
}

declare module '*.svg' {
    const src: string
    export default src
}
