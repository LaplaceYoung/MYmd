import { slugifyHeading } from "./parser";

export function scrollToHeadingSlug(slug: string): void {
  const targetSlug = slug.trim();
  if (!targetSlug) return;

  const containerSelectors = [
    ".editor-wysiwyg .editor",
    ".editor-split__preview .editor"
  ];

  for (const selector of containerSelectors) {
    const container = document.querySelector(selector);
    if (!container) continue;

    const headings = Array.from(container.querySelectorAll("h1, h2, h3, h4, h5, h6"));
    const target = headings.find((node) => slugifyHeading(node.textContent ?? "") === targetSlug);
    if (!target) continue;

    target.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
}
