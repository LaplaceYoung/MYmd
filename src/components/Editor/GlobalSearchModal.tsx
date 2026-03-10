import { useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { queryKnowledge } from "@/knowledge/service";
import { useEditorStore } from "@/stores/editorStore";
import { readTextFileWithFallback } from "@/utils/fileRead";
import { scrollToHeadingSlug } from "@/knowledge/navigation";
import type { KnowledgeSearchResponse } from "@/knowledge/types";
import "./GlobalSearchModal.css";

const EMPTY_RESULTS: KnowledgeSearchResponse = { documents: [], headings: [], tags: [] };

export function GlobalSearchModal() {
  const addTab = useEditorStore((s) => s.addTab);
  const markSaved = useEditorStore((s) => s.markSaved);
  const visible = useEditorStore((s) => s.globalSearchVisible);
  const query = useEditorStore((s) => s.globalSearchQuery);
  const openGlobalSearch = useEditorStore((s) => s.openGlobalSearch);
  const closeGlobalSearch = useEditorStore((s) => s.closeGlobalSearch);
  const setGlobalSearchQuery = useEditorStore((s) => s.setGlobalSearchQuery);
  const queryPluginSearch = useEditorStore((s) => s.queryPluginSearch);

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<KnowledgeSearchResponse>(EMPTY_RESULTS);
  const [pluginResults, setPluginResults] = useState<
    { id: string; title: string; subtitle?: string; onSelect: () => void }[]
  >([]);

  useEffect(() => {
    const onGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") {
        e.preventDefault();
        openGlobalSearch();
      } else if (e.key === "Escape") {
        closeGlobalSearch();
      }
    };
    window.addEventListener("keydown", onGlobalKeyDown);
    return () => window.removeEventListener("keydown", onGlobalKeyDown);
  }, [closeGlobalSearch, openGlobalSearch]);

  useEffect(() => {
    if (!visible) return;

    const normalized = query.trim();
    if (!normalized) {
      setResults(EMPTY_RESULTS);
      setPluginResults([]);
      return;
    }

    setLoading(true);
    const timer = window.setTimeout(() => {
      Promise.all([queryKnowledge(normalized), queryPluginSearch(normalized)])
        .then(([data, plugins]) => {
          setResults(data);
          setPluginResults(plugins);
        })
        .catch((error) => {
          console.warn("knowledge query failed:", error);
          setResults(EMPTY_RESULTS);
          setPluginResults([]);
        })
        .finally(() => setLoading(false));
    }, 150);

    return () => window.clearTimeout(timer);
  }, [query, queryPluginSearch, visible]);

  const totalCount = useMemo(
    () => results.documents.length + results.headings.length + results.tags.length,
    [results.documents.length, results.headings.length, results.tags.length]
  );
  const aggregateCount = totalCount + pluginResults.length;

  const openResult = async (filePath: string, headingSlug = "") => {
    try {
      const content = await readTextFileWithFallback(filePath);
      const tabId = addTab(filePath, content);
      markSaved(tabId, filePath);
      closeGlobalSearch();
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
    <div className="global-search" onClick={closeGlobalSearch}>
      <div className="global-search__panel" onClick={(e) => e.stopPropagation()}>
        <div className="global-search__head">
          <div className="global-search__input-wrap">
            <Search size={14} />
            <input
              autoFocus
              value={query}
              onChange={(e) => setGlobalSearchQuery(e.target.value)}
              placeholder="Search notes, headings, tags..."
            />
          </div>
          <button className="global-search__close" onClick={closeGlobalSearch}>
            <X size={15} />
          </button>
        </div>
        <div className="global-search__meta">
          {loading ? "Searching..." : `${aggregateCount} result(s)`}
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

          {results.tags.length > 0 && (
            <section>
              <div className="global-search__group-title">Tags</div>
              {results.tags.map((item) => (
                <button
                  key={`tag:${item.file_path}:${item.tag}`}
                  className="global-search__item"
                  onClick={() => void openResult(item.file_path)}
                >
                  <div className="global-search__item-title">#{item.tag}</div>
                  <div className="global-search__item-meta">{item.document_title}</div>
                </button>
              ))}
            </section>
          )}

          {pluginResults.length > 0 && (
            <section>
              <div className="global-search__group-title">Plugin Results</div>
              {pluginResults.map((item) => (
                <button
                  key={`plugin:${item.id}`}
                  className="global-search__item"
                  onClick={() => {
                    item.onSelect();
                    closeGlobalSearch();
                  }}
                >
                  <div className="global-search__item-title">{item.title}</div>
                  {item.subtitle && <div className="global-search__item-meta">{item.subtitle}</div>}
                </button>
              ))}
            </section>
          )}

          {!loading && aggregateCount === 0 && (
            <div className="global-search__empty">No results. Try title, heading, or tags.</div>
          )}
        </div>
      </div>
    </div>
  );
}
