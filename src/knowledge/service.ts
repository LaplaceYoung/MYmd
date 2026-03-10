import { invoke } from "@tauri-apps/api/core";
import { readDir } from "@tauri-apps/plugin-fs";
import { extractHeadings, extractTags, extractWikilinks } from "./parser";
import type {
  KnowledgeBacklinkItem,
  KnowledgeGraphResponse,
  KnowledgeUnlinkedMentionItem,
  KnowledgeSearchResponse,
  KnowledgeUpsertPayload
} from "./types";
import { readTextFileWithFallback } from "@/utils/fileRead";

const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

interface RebuildWorkspaceIndexHooks {
  onStart?: (payload: { total: number }) => void;
  onProgress?: (payload: { processed: number; total: number; filePath: string }) => void;
  onComplete?: (payload: { processed: number; total: number }) => void;
  onError?: (payload: { processed: number; total: number; message: string }) => void;
}

function titleFromPath(path: string): string {
  const normalized = path.replace(/\\/g, "/");
  const name = normalized.split("/").pop() ?? "Untitled.md";
  return name.toLowerCase().endsWith(".md") ? name.slice(0, -3) : name;
}

async function collectMarkdownFiles(root: string): Promise<string[]> {
  const files: string[] = [];
  const queue: string[] = [root];
  const maxFiles = 1200;

  while (queue.length > 0 && files.length < maxFiles) {
    const dir = queue.shift()!;
    let entries;
    try {
      entries = await readDir(dir);
    } catch {
      continue;
    }

    for (const entry of entries) {
      if (!entry.name) continue;
      const path = `${dir.replace(/[\\/]+$/, "")}/${entry.name}`;
      if (entry.isDirectory) {
        queue.push(path);
        continue;
      }
      if (entry.name.toLowerCase().endsWith(".md")) {
        files.push(path);
        if (files.length >= maxFiles) break;
      }
    }
  }

  return files;
}

export async function indexKnowledgeDocument(
  filePath: string,
  content: string,
  workspacePath: string | null
): Promise<void> {
  if (!isTauri || !filePath) return;

  const payload: KnowledgeUpsertPayload = {
    file_path: filePath,
    title: titleFromPath(filePath),
    content,
    mtime: Date.now(),
    headings: extractHeadings(content),
    wikilinks: extractWikilinks(content, filePath, workspacePath),
    tags: extractTags(content)
  };

  await invoke("knowledge_upsert_document", { payload });
  window.dispatchEvent(new CustomEvent("mymd:knowledge-indexed", { detail: { filePath } }));
}

export async function rebuildWorkspaceIndex(
  workspacePath: string,
  hooks?: RebuildWorkspaceIndexHooks
): Promise<void> {
  if (!isTauri || !workspacePath) return;

  let processed = 0;
  let total = 0;
  try {
    const files = await collectMarkdownFiles(workspacePath);
    total = files.length;
    hooks?.onStart?.({ total });

    for (const filePath of files) {
      try {
        const content = await readTextFileWithFallback(filePath);
        await indexKnowledgeDocument(filePath, content, workspacePath);
      } catch (error) {
        console.warn("knowledge index skip file:", filePath, error);
      } finally {
        processed += 1;
        hooks?.onProgress?.({ processed, total, filePath });
      }
    }

    hooks?.onComplete?.({ processed, total });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to rebuild workspace index";
    hooks?.onError?.({ processed, total, message });
    throw error;
  }
}

export async function queryKnowledge(
  searchText: string,
  limit = 30,
  offset = 0
): Promise<KnowledgeSearchResponse> {
  if (!isTauri || !searchText.trim()) {
    return { documents: [], headings: [], tags: [] };
  }

  return invoke<KnowledgeSearchResponse>("knowledge_query", {
    search_text: searchText,
    limit,
    offset
  });
}

export async function getBacklinks(filePath: string): Promise<KnowledgeBacklinkItem[]> {
  if (!isTauri || !filePath) return [];
  return invoke<KnowledgeBacklinkItem[]>("knowledge_get_backlinks", {
    file_path: filePath
  });
}

export async function getUnlinkedMentions(
  filePath: string
): Promise<KnowledgeUnlinkedMentionItem[]> {
  if (!isTauri || !filePath) return [];
  return invoke<KnowledgeUnlinkedMentionItem[]>("knowledge_get_unlinked_mentions", {
    file_path: filePath
  });
}

export async function linkUnlinkedMention(payload: {
  from_file_path: string;
  target_file_path: string;
  mention_text: string;
}): Promise<boolean> {
  if (!isTauri) return false;
  return invoke<boolean>("knowledge_link_unlinked_mention", payload);
}

export async function getKnowledgeGraph(
  filterText = "",
  limit = 300
): Promise<KnowledgeGraphResponse> {
  if (!isTauri) return { nodes: [], edges: [] };
  return invoke<KnowledgeGraphResponse>("knowledge_graph", {
    filter_text: filterText,
    limit
  });
}
