import { useCallback, useEffect, useState } from "react";
import { Link2, X } from "lucide-react";
import { useEditorStore } from "@/stores/editorStore";
import { getBacklinks } from "@/knowledge/service";
import { readTextFileWithFallback } from "@/utils/fileRead";
import { scrollToHeadingSlug } from "@/knowledge/navigation";
import "./BacklinksPanel.css";

export function BacklinksPanel() {
  const backlinksVisible = useEditorStore((s) => s.backlinksVisible);
  const setBacklinksVisible = useEditorStore((s) => s.setBacklinksVisible);
  const activeTabId = useEditorStore((s) => s.activeTabId);
  const tabs = useEditorStore((s) => s.tabs);
  const addTab = useEditorStore((s) => s.addTab);
  const markSaved = useEditorStore((s) => s.markSaved);

  const activeTab = tabs.find((t) => t.id === activeTabId) ?? null;
  const activePath = activeTab?.filePath ?? "";
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<
    {
      from_file_path: string;
      from_title: string;
      raw_text: string;
      to_heading_slug: string;
      updated_at: number;
    }[]
  >([]);

  const refresh = useCallback(async () => {
    if (!backlinksVisible || !activePath) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const next = await getBacklinks(activePath);
      setItems(next);
    } catch (error) {
      console.warn("load backlinks failed:", error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [activePath, backlinksVisible]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!backlinksVisible) return;

    const handler = () => {
      void refresh();
    };

    window.addEventListener("mymd:knowledge-indexed", handler as EventListener);
    return () => window.removeEventListener("mymd:knowledge-indexed", handler as EventListener);
  }, [backlinksVisible, refresh]);

  const openBacklink = async (filePath: string, headingSlug: string) => {
    try {
      const content = await readTextFileWithFallback(filePath);
      const tabId = addTab(filePath, content);
      markSaved(tabId, filePath);
      if (headingSlug) {
        window.setTimeout(() => {
          scrollToHeadingSlug(headingSlug);
        }, 80);
      }
    } catch (error) {
      console.warn("open backlink failed:", filePath, error);
    }
  };

  if (!backlinksVisible) return null;

  return (
    <div className="backlinks-panel">
      <div className="backlinks-panel__header">
        <div className="backlinks-panel__title">
          <Link2 size={16} />
          <span>Backlinks</span>
        </div>
        <button className="backlinks-panel__close" onClick={() => setBacklinksVisible(false)}>
          <X size={16} />
        </button>
      </div>
      <div className="backlinks-panel__content">
        {!activePath && <div className="backlinks-panel__empty">Save this note to view backlinks.</div>}
        {loading && <div className="backlinks-panel__empty">Loading backlinks...</div>}
        {!loading && activePath && items.length === 0 && (
          <div className="backlinks-panel__empty">No backlinks yet.</div>
        )}
        {!loading &&
          items.map((item) => (
            <button
              key={`${item.from_file_path}:${item.raw_text}`}
              className="backlinks-panel__item"
              onClick={() => void openBacklink(item.from_file_path, item.to_heading_slug)}
              title={item.from_file_path}
            >
              <div className="backlinks-panel__item-title">{item.from_title || item.from_file_path}</div>
              <div className="backlinks-panel__item-meta">[[{item.raw_text}]]</div>
            </button>
          ))}
      </div>
    </div>
  );
}

