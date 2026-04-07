const EDITABLE_SELECTOR = [
    '[contenteditable="true"]',
    '.cm-content',
    '.ProseMirror',
    'textarea',
    'input:not([type="button"]):not([type="checkbox"]):not([type="radio"])',
].join(', ')

let lastEditableTarget: HTMLElement | null = null
let trackingInitialized = false

function extensionFromImageMime(mimeType: string): string {
    switch (mimeType.toLowerCase()) {
        case 'image/jpeg':
            return 'jpg'
        case 'image/gif':
            return 'gif'
        case 'image/webp':
            return 'webp'
        case 'image/svg+xml':
            return 'svg'
        case 'image/bmp':
            return 'bmp'
        default:
            return 'png'
    }
}

export function extractImageFileFromDataTransfer(dataTransfer: DataTransfer | null): File | null {
    if (!dataTransfer) return null

    const imageItem = Array.from(dataTransfer.items).find(item => item.type.startsWith('image/'))
    const fromItems = imageItem?.getAsFile()
    if (fromItems) return fromItems

    const fromFiles = Array.from(dataTransfer.files).find(file => file.type.startsWith('image/'))
    return fromFiles ?? null
}

export async function readImageFromClipboardApi(): Promise<File | null> {
    if (typeof navigator === 'undefined' || !navigator.clipboard?.read) {
        return null
    }

    try {
        const items = await navigator.clipboard.read()
        for (const item of items) {
            const imageType = item.types.find(type => type.startsWith('image/'))
            if (!imageType) continue

            const blob = await item.getType(imageType)
            if (!blob) continue

            const ext = extensionFromImageMime(blob.type || imageType)
            return new File([blob], `pasted-image.${ext}`, {
                type: blob.type || imageType,
            })
        }
    } catch {
        // Browser or OS clipboard permissions can reject; caller should fallback.
    }

    return null
}

function isEditableElement(el: HTMLElement | null): boolean {
    if (!el) return false

    if (el instanceof HTMLTextAreaElement) {
        return !el.readOnly && !el.disabled
    }

    if (el instanceof HTMLInputElement) {
        return !el.readOnly && !el.disabled
    }

    if (el.classList.contains('cm-content')) {
        return true
    }

    if (el.classList.contains('ProseMirror')) {
        return el.getAttribute('contenteditable') !== 'false'
    }

    if (el.isContentEditable) {
        return el.getAttribute('contenteditable') !== 'false'
    }

    return false
}

function resolveEditableFromTarget(target: EventTarget | null): HTMLElement | null {
    if (!(target instanceof HTMLElement)) return null
    if (isEditableElement(target)) return target

    const found = target.closest(EDITABLE_SELECTOR)
    return found instanceof HTMLElement && isEditableElement(found) ? found : null
}

function initEditableTracking() {
    if (trackingInitialized || typeof document === 'undefined') return
    trackingInitialized = true

    const remember = (target: EventTarget | null) => {
        const editable = resolveEditableFromTarget(target)
        if (editable) {
            lastEditableTarget = editable
        }
    }

    document.addEventListener('focusin', event => remember(event.target), true)
    document.addEventListener('mousedown', event => remember(event.target), true)
}

function focusEditable(el: HTMLElement) {
    try {
        if (document.activeElement !== el) {
            el.focus({ preventScroll: true })
        }
    } catch {
        // Ignore focus failures and let caller fallback.
    }
}

function getEditableTarget(): HTMLElement | null {
    initEditableTracking()

    const active = document.activeElement instanceof HTMLElement ? document.activeElement : null
    if (isEditableElement(active)) {
        lastEditableTarget = active
        return active
    }

    if (isEditableElement(lastEditableTarget)) {
        return lastEditableTarget
    }

    const focused = document.querySelector<HTMLElement>(
        '.cm-editor.cm-focused .cm-content, .ProseMirror-focused'
    )
    if (isEditableElement(focused)) {
        lastEditableTarget = focused
        return focused
    }

    const fallback = document.querySelector<HTMLElement>(`.editor-container ${EDITABLE_SELECTOR}`)
    if (isEditableElement(fallback)) {
        lastEditableTarget = fallback
        return fallback
    }

    return null
}

function insertTextIntoEditable(target: HTMLElement, text: string): boolean {
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
        const start = target.selectionStart ?? target.value.length
        const end = target.selectionEnd ?? target.value.length
        target.setRangeText(text, start, end, 'end')
        target.dispatchEvent(new Event('input', { bubbles: true }))
        return true
    }

    if (document.execCommand('insertText', false, text)) {
        return true
    }

    const selection = window.getSelection()
    if (!selection) return false

    let range: Range
    if (selection.rangeCount > 0) {
        range = selection.getRangeAt(0)
        if (!target.contains(range.commonAncestorContainer)) {
            range = document.createRange()
            range.selectNodeContents(target)
            range.collapse(false)
        }
    } else {
        range = document.createRange()
        range.selectNodeContents(target)
        range.collapse(false)
    }

    range.deleteContents()
    const textNode = document.createTextNode(text)
    range.insertNode(textNode)
    range.setStartAfter(textNode)
    range.collapse(true)

    selection.removeAllRanges()
    selection.addRange(range)
    target.dispatchEvent(new Event('input', { bubbles: true }))
    return true
}

function runExecCommand(command: 'copy' | 'cut' | 'paste'): boolean {
    const target = getEditableTarget()
    if (!target) return false
    focusEditable(target)
    return document.execCommand(command)
}

export function rememberEditableTarget(target: EventTarget | null) {
    initEditableTracking()
    const editable = resolveEditableFromTarget(target)
    if (editable) {
        lastEditableTarget = editable
    }
}

export function copyFromEditor(): boolean {
    return runExecCommand('copy')
}

export function cutFromEditor(): boolean {
    return runExecCommand('cut')
}

export async function pasteToEditor(): Promise<boolean> {
    const target = getEditableTarget()
    if (!target) return false
    focusEditable(target)

    try {
        const text = await navigator.clipboard?.readText()
        if (typeof text === 'string' && text.length > 0) {
            return insertTextIntoEditable(target, text)
        }
    } catch {
        // Fallback to browser/Tauri paste command below.
    }

    const imageFile = await readImageFromClipboardApi()
    if (imageFile && typeof DataTransfer !== 'undefined') {
        try {
            const dataTransfer = new DataTransfer()
            dataTransfer.items.add(imageFile)
            const pasteEvent = new ClipboardEvent('paste', {
                clipboardData: dataTransfer,
                bubbles: true,
                cancelable: true,
            })
            target.dispatchEvent(pasteEvent)
            return true
        } catch {
            // Fall through to execCommand paste.
        }
    }

    return document.execCommand('paste')
}
