import { readFile, writeFile, mkdir, exists } from '@tauri-apps/plugin-fs'

/**
 * 确保目录存在，如果不存在则创建
 * 注意：由于 plugin-fs 不支持递归创建（未配置 recursive 参数时），
 * 这里做简单包装。实际项目中可能需要级联创建。
 */
async function ensureDir(dirPath: string) {
    if (!await exists(dirPath)) {
        await mkdir(dirPath)
    }
}

/**
 * 将外部图片复制到当前 Markdown 文件同级目录的 assets 文件夹中
 * @param sourceImgPath 源图片绝对路径
 * @param activeTabFilePath 当前正打开编辑的 Markdown 文件的绝对路径
 * @returns 复制后的图片相对路径（如：assets/image-123.png），失败返回 null
 */
export async function copyImageToLocalAssets(sourceImgPath: string, activeTabFilePath: string): Promise<string | null> {
    if (!activeTabFilePath) {
        console.warn('Current document has not been saved yet. Cannot determine relative path.')
        return null
    }

    try {
        // 1. 获取当前 md 文件的目录路径
        const lastSlashIndex = Math.max(activeTabFilePath.lastIndexOf('/'), activeTabFilePath.lastIndexOf('\\'))
        if (lastSlashIndex === -1) return null

        const docDir = activeTabFilePath.substring(0, lastSlashIndex)
        const assetsDir = `${docDir}/assets`

        // 2. 确保 assets 目录存在
        await ensureDir(assetsDir)

        // 3. 构建新的目标文件路径并保证文件名唯一以防覆盖
        const ext = sourceImgPath.split('.').pop() || 'png'
        const randomName = `${Date.now()}-${Math.floor(Math.random() * 1000)}.${ext}`
        const targetPath = `${assetsDir}/${randomName}`

        // 4. 读取原始文件并写入到新目标路径 (使用二进制复制)
        const fileData = await readFile(sourceImgPath)
        await writeFile(targetPath, fileData)

        // 5. 返回相对于 md 文件的路径
        return `assets/${randomName}`
    } catch (e) {
        console.error('Failed to copy image:', e)
        return null
    }
}
