/**
 * ????? class + data-glossary-preview ??????? ????? (???? remark).
 */
import { visit } from "unist-util-visit";
import { glossaryMap } from "../data/glossary";

type ElementNode = {
  tagName?: string;
  properties?: Record<string, unknown>;
};

function previewForSlug(slug: string): string {
  const c = glossaryMap[slug];
  if (!c) return "";
  const raw = (c.definition || c.summary || "").replace(/\s+/g, " ").trim();
  return raw.length > 180 ? `${raw.slice(0, 177)}...` : raw;
}

export default function rehypeGlossaryPreviews() {
  return (tree: unknown) => {
    visit(tree as Parameters<typeof visit>[0], "element", (node) => {
      const element = node as ElementNode;
      if (element.tagName !== "a" || !element.properties) return;
      const href = element.properties.href;
      if (typeof href !== "string") return;
      const match = href.match(/^\/glossary\/([^/]+)\/?$/);
      if (!match) return;
      const slug = match[1];
      const preview = previewForSlug(slug);
      if (!preview) return;

      const existing = element.properties.className;
      const classes = Array.isArray(existing)
        ? [...existing.map(String)]
        : existing
          ? [String(existing)]
          : [];
      if (!classes.includes("nm-glossary-tip")) classes.push("nm-glossary-tip");
      element.properties.className = classes;
      element.properties["data-glossary-preview"] = preview;
    });
  };
}
