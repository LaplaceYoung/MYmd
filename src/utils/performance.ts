export const LARGE_DOC_CHAR_THRESHOLD = 120_000;
export const LARGE_DOC_LINE_THRESHOLD = 3_500;
export const LARGE_DOC_PREVIEW_DELAY_MS = 450;

export interface DocumentPerfInfo {
  isLarge: boolean;
  charCount: number;
  lineCount: number;
}

export function analyzeDocumentPerformance(content: string): DocumentPerfInfo {
  const normalized = content ?? "";
  const charCount = normalized.length;
  const lineCount = normalized.length === 0 ? 0 : normalized.split("\n").length;
  const isLarge =
    charCount >= LARGE_DOC_CHAR_THRESHOLD || lineCount >= LARGE_DOC_LINE_THRESHOLD;

  return {
    isLarge,
    charCount,
    lineCount,
  };
}
