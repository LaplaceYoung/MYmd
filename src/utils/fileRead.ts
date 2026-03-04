import { readTextFile } from "@tauri-apps/plugin-fs";
import { invoke } from "@tauri-apps/api/core";

const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

export async function readTextFileWithFallback(path: string): Promise<string> {
  if (!isTauri) return "";

  try {
    return await readTextFile(path);
  } catch (fsError) {
    console.warn("plugin-fs read failed, fallback to backend command:", path, fsError);
    return await invoke<string>("read_text_file_from_path", { path });
  }
}
