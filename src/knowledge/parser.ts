import type {
  KnowledgeHeadingInput,
  KnowledgeWikilinkInput
} from "./types";

interface ParsedWikiTarget {
  docPath: string;
  headingSlug: string;
  aliasText: string;
}

interface RewriteWikilinksForPathChangeInput {
  content: string;
  currentFilePath: string;
  workspacePath: string | null;
  fromPath: string;
  toPath: string;
  isDirectory: boolean;
}

interface RewriteWikilinksForPathChangeResult {
  content: string;
  changed: boolean;
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

function basename(path: string): string {
  const normalized = path.replace(/\\/g, "/");
  const idx = normalized.lastIndexOf("/");
  return idx >= 0 ? normalized.slice(idx + 1) : normalized;
}

function joinPath(base: string, next: string): string {
  const cleanedBase = base.replace(/\\/g, "/").replace(/\/+$/, "");
  const cleanedNext = next.replace(/\\/g, "/").replace(/^\/+/, "");
  return cleanedBase ? `${cleanedBase}/${cleanedNext}` : cleanedNext;
}

function normalizeFsPath(raw: string): string {
  const normalized = raw.replace(/\\/g, "/").replace(/\/+$/, "");
  const prefixMatch = normalized.match(/^[a-zA-Z]:/);
  const prefix = prefixMatch ? prefixMatch[0] : normalized.startsWith("/") ? "/" : "";
  const pathBody = prefix ? normalized.slice(prefix.length) : normalized;
  const parts = pathBody.split("/").filter(Boolean);
  const resolved: string[] = [];

  for (const part of parts) {
    if (part === ".") continue;
    if (part === "..") {
      const last = resolved[resolved.length - 1];
      if (last && last !== "..") {
        resolved.pop();
      } else if (!prefix) {
        resolved.push(part);
      }
      continue;
    }
    resolved.push(part);
  }

  const joined = resolved.join("/");
  if (!prefix) return joined;
  if (prefix === "/") return joined ? `/${joined}` : "/";
  return joined ? `${prefix}/${joined}` : prefix;
}

function normalizeComparablePath(raw: string): string {
  return normalizeFsPath(raw).toLowerCase();
}

function hasMarkdownExtension(raw: string): boolean {
  return raw.trim().toLowerCase().endsWith(".md");
}

function stripMarkdownExtension(raw: string): string {
  return raw.replace(/\.md$/i, "");
}

function splitPathSegments(raw: string): string[] {
  return normalizeFsPath(raw)
    .split("/")
    .filter(Boolean);
}

function relativePath(fromPath: string, toPath: string): string {
  const fromSegments = splitPathSegments(fromPath);
  const toSegments = splitPathSegments(toPath);

  let common = 0;
  while (
    common < fromSegments.length &&
    common < toSegments.length &&
    fromSegments[common].toLowerCase() === toSegments[common].toLowerCase()
  ) {
    common += 1;
  }

  const upward = fromSegments.slice(common).map(() => "..");
  const downward = toSegments.slice(common);
  return [...upward, ...downward].join("/");
}

function matchesPathPrefix(basePath: string, candidatePath: string): boolean {
  const normalizedBase = normalizeComparablePath(basePath);
  const normalizedCandidate = normalizeComparablePath(candidatePath);
  return (
    normalizedCandidate === normalizedBase ||
    normalizedCandidate.startsWith(`${normalizedBase}/`)
  );
}

function normalizeDocPath(raw: string): string {
  const path = raw.replace(/\\/g, "/").trim();
  if (!path) return path;
  return path.toLowerCase().endsWith(".md") ? path : `${path}.md`;
}

function resolveWikiDocPath(
  rawDocPart: string,
  currentFilePath: string,
  workspacePath: string | null
): string | null {
  const docPart = normalizeDocPath(rawDocPart.trim());
  if (!docPart) return null;

  if (isAbsolutePath(docPart)) return normalizeFsPath(docPart);

  if (docPart.startsWith("/")) {
    if (!workspacePath) return null;
    return normalizeFsPath(joinPath(workspacePath, docPart));
  }

  return normalizeFsPath(joinPath(dirname(currentFilePath), docPart));
}

function remapResolvedTarget(
  resolvedDocPath: string,
  fromPath: string,
  toPath: string,
  isDirectory: boolean
): string | null {
  const normalizedFrom = normalizeFsPath(fromPath);
  const normalizedTo = normalizeFsPath(toPath);

  if (isDirectory) {
    if (!matchesPathPrefix(normalizedFrom, resolvedDocPath)) return null;
    const suffix = resolvedDocPath.slice(normalizedFrom.length);
    return `${normalizedTo}${suffix}`;
  }

  if (normalizeComparablePath(resolvedDocPath) !== normalizeComparablePath(normalizedFrom)) {
    return null;
  }

  return normalizedTo;
}

function renderDocPathLikeOriginal(
  rawDocPart: string,
  remappedDocPath: string,
  currentFilePath: string,
  workspacePath: string | null
): string | null {
  const trimmedOriginal = rawDocPart.trim();
  const keepExtension = hasMarkdownExtension(trimmedOriginal);

  if (isAbsolutePath(trimmedOriginal)) {
    return keepExtension ? remappedDocPath : stripMarkdownExtension(remappedDocPath);
  }

  if (trimmedOriginal.includes("/")) {
    const base = trimmedOriginal.startsWith("/")
      ? (workspacePath ? normalizeFsPath(workspacePath) : dirname(currentFilePath))
      : dirname(currentFilePath);
    const relative = relativePath(base, remappedDocPath);
    if (trimmedOriginal.startsWith("/")) {
      if (!relative || relative.startsWith("..")) return null;
      const workspaceRelative = relative.startsWith("/") ? relative : `/${relative}`;
      return keepExtension ? workspaceRelative : stripMarkdownExtension(workspaceRelative);
    }
    return keepExtension ? relative : stripMarkdownExtension(relative);
  }

  if (dirname(remappedDocPath).toLowerCase() !== dirname(currentFilePath).toLowerCase()) {
    return null;
  }

  const nextBaseName = basename(remappedDocPath);
  return keepExtension ? nextBaseName : stripMarkdownExtension(nextBaseName);
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
    if (/^#{1,6}\s+/.test(trimmed)) return;
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

  const [targetPartRaw, aliasPartRaw = ""] = source.split("|", 2);
  const targetPart = targetPartRaw.trim();
  const aliasText = aliasPartRaw.trim();

  const [docPartRaw, headingRaw = ""] = targetPart.split("#", 2);
  const docPart = normalizeDocPath(docPartRaw.trim());
  if (!docPart) return null;

  let resolvedDocPath = docPart;
  if (!isAbsolutePath(docPart)) {
    const currentDir = dirname(currentFilePath);
    if (docPart.startsWith("/")) {
      if (!workspacePath) {
        return null;
      }
      resolvedDocPath = joinPath(workspacePath, docPart);
    } else {
      resolvedDocPath = joinPath(currentDir, docPart);
    }
  }

  return {
    docPath: normalizeFsPath(resolvedDocPath),
    headingSlug: slugifyHeading(headingRaw),
    aliasText
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
      to_heading_slug: target.headingSlug,
      alias_text: target.aliasText
    });
  }

  return links.slice(0, 1500);
}

export function rewriteWikilinksForPathChange(
  input: RewriteWikilinksForPathChangeInput
): RewriteWikilinksForPathChangeResult {
  if (!input.content) {
    return { content: input.content, changed: false };
  }

  const pattern = /\[\[([^\]]+)\]\]/g;
  let changed = false;

  const nextContent = input.content.replace(pattern, (fullMatch, rawInner: string) => {
    const source = rawInner.trim();
    if (!source) return fullMatch;

    const pipeIndex = source.indexOf("|");
    const targetPart = pipeIndex >= 0 ? source.slice(0, pipeIndex).trim() : source;
    const aliasSuffix = pipeIndex >= 0 ? `|${source.slice(pipeIndex + 1).trim()}` : "";

    const hashIndex = targetPart.indexOf("#");
    const rawDocPart = hashIndex >= 0 ? targetPart.slice(0, hashIndex).trim() : targetPart.trim();
    const fragmentSuffix = hashIndex >= 0 ? targetPart.slice(hashIndex) : "";
    if (!rawDocPart) return fullMatch;

    const resolvedDocPath = resolveWikiDocPath(rawDocPart, input.currentFilePath, input.workspacePath);
    if (!resolvedDocPath) return fullMatch;

    const remappedDocPath = remapResolvedTarget(
      resolvedDocPath,
      input.fromPath,
      input.toPath,
      input.isDirectory
    );
    if (!remappedDocPath) return fullMatch;

    const rewrittenDocPart = renderDocPathLikeOriginal(
      rawDocPart,
      remappedDocPath,
      input.currentFilePath,
      input.workspacePath
    );
    if (!rewrittenDocPart) return fullMatch;

    const rewritten = `[[${rewrittenDocPart}${fragmentSuffix}${aliasSuffix}]]`;
    if (rewritten !== fullMatch) {
      changed = true;
    }
    return rewritten;
  });

  return {
    content: nextContent,
    changed,
  };
}
