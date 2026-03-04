import { useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { queryKnowledge } from "@/knowledge/service";
import { useEditorStore } from "@/stores/editorStore";
import { readTextFileWithFallback } from "@/utils/fileRead";
import { scrollToHeadingSlug } from "@/knowledge/navigation";
import type { KnowledgeSearchResponse } from "@/knowledge/types";
import "./GlobalSearchModal.css";

const EMPTY_RESULTS: KnowledgeSearchResponse = { documents: [], headings: [] };

export function GlobalSearchModal() {
  const addTab = useEditorStore((s) => s.addTab);
  const markSaved = useEditorStore((s) => s.markSaved);

  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<KnowledgeSearchResponse>(EMPTY_RESULTS);

  useEffect(() => {
    const onGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") {
        e.preventDefault();
        setVisible(true);
      } else if (e.key === "Escape") {
        setVisible(false);
      }
    };
    window.addEventListener("keydown", onGlobalKeyDown);
    return () => window.removeEventListener("keydown", onGlobalKeyDown);
  }, []);

  useEffect(() => {
    if (!visible) return;

    const normalized = query.trim();
    if (!normalized) {
      setResults(EMPTY_RESULTS);
      return;
    }

    setLoading(true);
    const timer = window.setTimeout(() => {
      queryKnowledge(normalized)
        .then((data) => setResults(data))
        .catch((error) => {
          console.warn("knowledge query failed:", error);
          setResults(EMPTY_RESULTS);
        })
        .finally(() => setLoading(false));
    }, 150);

    return () => window.clearTimeout(timer);
  }, [query, visible]);

  const totalCount = useMemo(
    () => results.documents.length + results.headings.length,
    [results.documents.length, results.headings.length]
  );

  const openResult = async (filePath: string, headingSlug = "") => {
    try {
      const content = await readTextFileWithFallback(filePath);
      const tabId = addTab(filePath, content);
      markSaved(tabId, filePath);
      setVisible(false);
      if (headingSlug) {
        window.setTimeout(() => {
          scrollToHeadingSlug(headingSlug);
        }, 80);
      }
    } catch (error) {
      console.warn("open search result failed:", filePath, error);
    }
  };

  if (!visible) return null;

  return (
    <div className="global-search" onClick={() => setVisible(false)}>
      <div className="global-search__panel" onClick={(e) => e.stopPropagation()}>
        <div className="global-search__head">
          <div className="global-search__input-wrap">
            <Search size={14} />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search notes, headings, tags..."
            />
          </div>
          <button className="global-search__close" onClick={() => setVisible(false)}>
            <X size={15} />
          </button>
        </div>
        <div className="global-search__meta">
          {loading ? "Searching..." : `${totalCount} result(s)`}
        </div>
        <div className="global-search__results">
          {results.documents.length > 0 && (
            <section>
              <div className="global-search__group-title">Documents</div>
              {results.documents.map((item) => (
                <button
                  key={`doc:${item.file_path}`}
                  className="global-search__item"
                  onClick={() => void openResult(item.file_path)}
                >
                  <div className="global-search__item-title">{item.title || item.file_path}</div>
                  <div className="global-search__item-meta">{item.file_path}</div>
                  <div className="global-search__item-preview">{item.preview}</div>
                </button>
              ))}
            </section>
          )}

          {results.headings.length > 0 && (
            <section>
              <div className="global-search__group-title">Headings</div>
              {results.headings.map((item) => (
                <button
                  key={`heading:${item.file_path}:${item.heading_slug}`}
                  className="global-search__item"
                  onClick={() => void openResult(item.file_path, item.heading_slug)}
                >
                  <div className="global-search__item-title">
                    {item.heading_text} <span className="global-search__item-level">H{item.level}</span>
                  </div>
                  <div className="global-search__item-meta">{item.document_title}</div>
                </button>
              ))}
            </section>
          )}

          {!loading && totalCount === 0 && (
            <div className="global-search__empty">No results. Try title, heading, or tags.</div>
          )}
        </div>
      </div>
    </div>
  );
}
