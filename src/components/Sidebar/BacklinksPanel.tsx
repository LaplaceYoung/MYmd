import { useCallback, useEffect, useState } from "react";
import { Link2, X } from "lucide-react";
import { useEditorStore } from "@/stores/editorStore";
import { getBacklinks, getUnlinkedMentions, indexKnowledgeDocument, linkUnlinkedMention } from "@/knowledge/service";
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
  const updateContent = useEditorStore((s) => s.updateContent);
  const activeWorkspace = useEditorStore((s) => s.activeWorkspace);

  const activeTab = tabs.find((t) => t.id === activeTabId) ?? null;
  const activePath = activeTab?.filePath ?? "";
  const [loading, setLoading] = useState(false);
  const [linkingKey, setLinkingKey] = useState<string | null>(null);
  const [items, setItems] = useState<
    {
      from_file_path: string;
      from_title: string;
      raw_text: string;
      to_heading_slug: string;
      snippet: string;
      matched_heading_text: string;
      updated_at: number;
    }[]
  >([]);
  const [mentions, setMentions] = useState<
    {
      from_file_path: string;
      from_title: string;
      mention_text: string;
      snippet: string;
      updated_at: number;
    }[]
  >([]);

  const refresh = useCallback(async () => {
    if (!backlinksVisible || !activePath) {
      setItems([]);
      setMentions([]);
      return;
    }
    setLoading(true);
    try {
      const [backlinks, unlinkedMentions] = await Promise.all([
        getBacklinks(activePath),
        getUnlinkedMentions(activePath),
      ]);
      setItems(backlinks);
      setMentions(unlinkedMentions);
    } catch (error) {
      console.warn("load backlinks failed:", error);
      setItems([]);
      setMentions([]);
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

  const handleLinkMention = useCallback(
    async (item: { from_file_path: string; mention_text: string }) => {
      if (!activePath) return;
      const key = `${item.from_file_path}:${item.mention_text}`;
      setLinkingKey(key);
      try {
        const linked = await linkUnlinkedMention({
          from_file_path: item.from_file_path,
          target_file_path: activePath,
          mention_text: item.mention_text,
        });
        if (!linked) return;

        const content = await readTextFileWithFallback(item.from_file_path);
        await indexKnowledgeDocument(item.from_file_path, content, activeWorkspace);

        const existingTab = useEditorStore
          .getState()
          .tabs.find((tab) => tab.filePath === item.from_file_path);
        if (existingTab) {
          updateContent(existingTab.id, content);
          markSaved(existingTab.id, item.from_file_path);
        }

        await refresh();
      } catch (error) {
        console.warn("link unlinked mention failed:", error);
      } finally {
        setLinkingKey(null);
      }
    },
    [activePath, activeWorkspace, markSaved, refresh, updateContent]
  );

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
        {!activePath && <div className="backlinks-panel__empty">先保存当前文档，反向链接和未链接提及就会出现在这里。</div>}
        {loading && <div className="backlinks-panel__empty">正在加载反向链接...</div>}
        {!loading && activePath && items.length === 0 && (
          <div className="backlinks-panel__empty">还没有反向链接。试试在别的文档里用 [[当前文档名]] 引用它。</div>
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
              {item.matched_heading_text && (
                <div className="backlinks-panel__item-meta">鈫?{item.matched_heading_text}</div>
              )}
              {item.snippet && <div className="backlinks-panel__item-snippet">{item.snippet}</div>}
            </button>
          ))}
        {!loading && activePath && mentions.length > 0 && (
          <div className="backlinks-panel__mention-group">
            <div className="backlinks-panel__mention-title">未链接提及</div>
            {mentions.map((item) => {
              const key = `${item.from_file_path}:${item.mention_text}`;
              const isLinking = linkingKey === key;
              return (
                <div key={key} className="backlinks-panel__mention-item">
                  <button
                    className="backlinks-panel__item backlinks-panel__item--mention"
                    onClick={() => void openBacklink(item.from_file_path, "")}
                    title={item.from_file_path}
                  >
                    <div className="backlinks-panel__item-title">
                      {item.from_title || item.from_file_path}
                    </div>
                    <div className="backlinks-panel__item-meta">{item.mention_text}</div>
                    {item.snippet && <div className="backlinks-panel__item-snippet">{item.snippet}</div>}
                  </button>
                  <button
                    className="backlinks-panel__link-btn"
                    onClick={() => void handleLinkMention(item)}
                    disabled={isLinking}
                  >
                    {isLinking ? "链接中..." : "转为链接"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

