import { invoke } from "@tauri-apps/api/core";
import { extractHeadings, extractTags, extractWikilinks } from "./parser";
import type {
  KnowledgeBacklinkItem,
  KnowledgeGraphResponse,
  KnowledgeUnlinkedMentionItem,
  KnowledgeSearchResponse,
  KnowledgeUpsertPayload
} from "./types";
import { readTextFileWithFallback } from "@/utils/fileRead";
import { collectMarkdownFiles } from "@/utils/workspacePaths";

const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

export interface KnowledgeIndexSkippedFile {
  filePath: string;
  message: string;
}

interface RebuildWorkspaceIndexHooks {
  onStart?: (payload: { total: number }) => void;
  onProgress?: (payload: { processed: number; total: number; filePath: string; skipped: number }) => void;
  onComplete?: (payload: { processed: number; total: number; skipped: number; skippedFiles: KnowledgeIndexSkippedFile[] }) => void;
  onError?: (payload: { processed: number; total: number; message: string; skipped: number; skippedFiles: KnowledgeIndexSkippedFile[] }) => void;
  signal?: AbortSignal;
  progressStep?: number;
  maxFiles?: number;
}

function titleFromPath(path: string): string {
  const normalized = path.replace(/\\/g, "/");
  const name = normalized.split("/").pop() ?? "Untitled.md";
  return name.toLowerCase().endsWith(".md") ? name.slice(0, -3) : name;
}

function createAbortError() {
  const error = new Error("Knowledge indexing aborted");
  error.name = "AbortError";
  return error;
}

function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) {
    throw createAbortError();
  }
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
  const skippedFiles: KnowledgeIndexSkippedFile[] = [];
  const progressStep = Math.max(1, hooks?.progressStep ?? 20);
  try {
    throwIfAborted(hooks?.signal);
    const files = await collectMarkdownFiles(workspacePath, hooks?.maxFiles ?? 1800, hooks?.signal);
    total = files.length;
    hooks?.onStart?.({ total });

    for (const filePath of files) {
      throwIfAborted(hooks?.signal);
      try {
        const content = await readTextFileWithFallback(filePath);
        await indexKnowledgeDocument(filePath, content, workspacePath);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to read or index file";
        skippedFiles.push({ filePath, message });
        console.warn("knowledge index skip file:", filePath, error);
      } finally {
        processed += 1;
        const shouldReport =
          processed === total ||
          processed % progressStep === 0 ||
          processed === 1;

        if (shouldReport) {
          hooks?.onProgress?.({ processed, total, filePath, skipped: skippedFiles.length });
        }
      }
    }

    hooks?.onComplete?.({ processed, total, skipped: skippedFiles.length, skippedFiles });
  } catch (error) {
    if (hooks?.signal?.aborted) {
      hooks?.onError?.({
        processed,
        total,
        message: "Knowledge indexing cancelled",
        skipped: skippedFiles.length,
        skippedFiles,
      });
      return;
    }
    const message = error instanceof Error ? error.message : "Failed to rebuild workspace index";
    hooks?.onError?.({ processed, total, message, skipped: skippedFiles.length, skippedFiles });
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
