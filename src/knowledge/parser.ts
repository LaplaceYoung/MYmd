import type {
  KnowledgeHeadingInput,
  KnowledgeWikilinkInput
} from "./types";

interface ParsedWikiTarget {
  docPath: string;
  headingSlug: string;
}

function isAbsolutePath(path: string): boolean {
  return /^[a-zA-Z]:[\\/]/.test(path) || path.startsWith("\\\\");
}

function dirname(path: string): string {
  const normalized = path.replace(/\\/g, "/");
  const idx = normalized.lastIndexOf("/");
  if (idx <= 0) return "";
  return normalized.slice(0, idx);
}

function joinPath(base: string, next: string): string {
  const cleanedBase = base.replace(/\\/g, "/").replace(/\/+$/, "");
  const cleanedNext = next.replace(/\\/g, "/").replace(/^\/+/, "");
  return cleanedBase ? `${cleanedBase}/${cleanedNext}` : cleanedNext;
}

function normalizeDocPath(raw: string): string {
  const path = raw.replace(/\\/g, "/").trim();
  if (!path) return path;
  return path.toLowerCase().endsWith(".md") ? path : `${path}.md`;
}

export function slugifyHeading(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function extractHeadings(content: string): KnowledgeHeadingInput[] {
  if (!content) return [];

  const lines = content.split("\n");
  const headings: KnowledgeHeadingInput[] = [];
  let inCodeBlock = false;

  lines.forEach((line, index) => {
    if (line.trim().startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      return;
    }
    if (inCodeBlock) return;

    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (!match) return;

    const text = match[2].trim();
    headings.push({
      level: match[1].length,
      text,
      slug: slugifyHeading(text),
      line_no: index + 1
    });
  });

  return headings;
}

export function extractTags(content: string): string[] {
  if (!content) return [];

  const tags = new Set<string>();
  const lines = content.split("\n");

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("#")) return;
    const matches = trimmed.match(/(^|\s)#([\p{L}\p{N}_-]+)/gu);
    if (!matches) return;
    matches.forEach((token) => {
      const tag = token.replace(/(^|\s)#/u, "").trim().toLowerCase();
      if (tag) tags.add(tag);
    });
  });

  return Array.from(tags).slice(0, 80);
}

function parseWikiTarget(
  rawTarget: string,
  currentFilePath: string,
  workspacePath: string | null
): ParsedWikiTarget | null {
  const source = rawTarget.trim();
  if (!source) return null;

  const [docPartRaw, headingRaw = ""] = source.split("#");
  const docPart = normalizeDocPath(docPartRaw.trim());
  if (!docPart) return null;

  let resolvedDocPath = docPart;
  if (!isAbsolutePath(docPart)) {
    const currentDir = dirname(currentFilePath);
    if (docPart.includes("/")) {
      resolvedDocPath = workspacePath
        ? joinPath(workspacePath, docPart)
        : joinPath(currentDir, docPart);
    } else {
      resolvedDocPath = joinPath(currentDir, docPart);
    }
  }

  return {
    docPath: resolvedDocPath,
    headingSlug: slugifyHeading(headingRaw)
  };
}

export function extractWikilinks(
  content: string,
  currentFilePath: string,
  workspacePath: string | null
): KnowledgeWikilinkInput[] {
  if (!content) return [];

  const links: KnowledgeWikilinkInput[] = [];
  const pattern = /\[\[([^\]]+)\]\]/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(content)) !== null) {
    const rawText = match[1].trim();
    const target = parseWikiTarget(rawText, currentFilePath, workspacePath);
    if (!target) continue;

    links.push({
      raw_text: rawText,
      to_doc_path: target.docPath,
      to_heading_slug: target.headingSlug
    });
  }

  return links.slice(0, 1500);
}
