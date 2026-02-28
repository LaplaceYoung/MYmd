---
name: tauri_migration_patterns
description: Best practices for migrating from Electron to Tauri, focusing on custom window controls, lifecycle management, and performance optimization.
---

# Tauri Migration & Custom Window Patterns

This guide distills the experiences and lessons learned during the migration of MYmd from Electron to Tauri v2. It covers the most critical technical hurdles and proven solutions.

## 1. Custom TitleBar & Window Dragging

In Tauri (especially v2), the traditional Electron approach of using CSS `-webkit-app-region: drag` can often conflict with hit-testing for interactive elements like buttons.

### Recommended Approach
Instead of using `data-tauri-drag-region`, use the programmatic `startDragging()` API for more granular control.

**Frontend (React Example):**
```typescript
import { getCurrentWindow } from '@tauri-apps/api/window';

const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Only drag with left mouse button
    if (e.button === 0) {
        // This allows dragging without blocking button clicks
        getCurrentWindow().startDragging();
    }
}, []);
```

### Hit-Testing Pitfall
Buttons inside a drag region often fail to trigger or behave inconsistently.
- **Solution**: Avoid overlaying drag regions. Ensure buttons have `type="button"` and their `onClick` handlers call `e.preventDefault()` and `e.stopPropagation()`.
- **CSS Tip**: Use `pointer-events: none` on SVG icons inside buttons to ensure the button element itself captures the click.

## 2. Managed Window Close Lifecycle

One of the most complex parts of migrating from Electron is replicating "Unsaved Changes" confirmation prompts.

### The Problem
Simply calling `event.preventDefault()` in `onCloseRequested` can lead to infinite loops or "deferred" close actions (where the app stays open even after the user confirms).

### The "Managed Close" Architecture
1. **Frontend Store (Zustand)**: Centralize the application state, including a `dirty` flag for each tab/file.
2. **Intercept Native Close**: Unconditionally intercept the native close request and route it to your store.
3. **Rust Definitive Exit**: Use a custom Rust command for the final exit.

**Rust Backend (`src-tauri/src/lib.rs`):**
```rust
#[tauri::command]
fn exit_app() {
    // This is the most reliable way to quit all services and threads
    std::process::exit(0);
}
```

**Frontend Store Logic:**
```typescript
requestCloseWindow: () => {
    const hasDirty = get().tabs.some(t => t.isDirty);
    if (hasDirty) {
        // Trigger UI prompt for the first dirty tab
        set({ pendingCloseAction: 'window' }); 
    } else {
        // Definitive exit
        invoke('exit_app');
    }
}
```

## 3. Tauri v2 Configuration & Capabilities

Tauri v2 introduces a mandatory security layer called **Capabilities**. Custom window controls (Minimize, Maximize, Close) **will not work** unless explicitly permitted.

### Essential Permissions
Ensure your `src-tauri/capabilities/default.json` includes:
```json
{
  "permissions": [
    "core:window:allow-close",
    "core:window:allow-minimize",
    "core:window:allow-toggle-maximize",
    "core:window:allow-start-dragging",
    "core:window:default"
  ]
}
```

## 4. Build & Environment Optimization

### Windows Development Workaround
For Windows developers, Rust compilation can be slow and intensive on the C: drive.
- **Optimization**: Set `$env:CARGO_TARGET_DIR = "C:\rust_target"` (or any partition with space) during the build process to keep the project directory clean and avoid file path length issues.

### Icon Generation
Use the CLI to avoid manual asset creation:
```bash
npx tauri icon ./resources/icon.png
```

## 5. Lessons Learned / Checklist

- [ ] **Never** rely strictly on `window.close()` for custom frameless windows; use Tauri APIs.
- [ ] **Always** add `type="button"` to window control buttons to prevent accidental form submissions in React.
- [ ] **Prefer** `onCloseRequested` over trying to handle "Close" strictly in the click handler, as it covers OS-level shortcuts like `Alt+F4`.
- [ ] **Clean Builds**: If icons or resources aren't updating, delete the `target` directory and rebuild from scratch.
