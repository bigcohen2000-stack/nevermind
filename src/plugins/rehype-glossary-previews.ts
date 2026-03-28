/**
 * מוסיף class + data-glossary-preview לקישורי גלוסר (אחרי remark).
 */
import { visit } from "unist-util-visit";
import { glossaryMap } from "../data/glossary";

function previewForSlug(slug: string): string {
  const c = glossaryMap[slug];
  if (!c) return "";
  const raw = (c.definition || c.summary || "").replace(/\s+/g, " ").trim();
  return raw.length > 180 ? `${raw.slice(0, 177)}…` : raw;
}

export default function rehypeGlossaryPreviews() {
  return (tree: unknown) => {
    visit(tree as Parameters<typeof visit>[0], "element", (node) => {
      if (node.tagName !== "a" || !node.properties) return;
      const href = node.properties.href;
      if (typeof href !== "string") return;
      const m = href.match(/^\/glossary\/([^/]+)\/?$/);
      if (!m) return;
      const slug = m[1];
      const preview = previewForSlug(slug);
      if (!preview) return;

      const existing = node.properties.className;
      const classes = Array.isArray(existing)
        ? [...existing.map(String)]
        : existing
          ? [String(existing)]
          : [];
      if (!classes.includes("nm-glossary-tip")) classes.push("nm-glossary-tip");
      node.properties.className = classes;

      node.properties["data-glossary-preview"] = preview;
    });
  };
}
