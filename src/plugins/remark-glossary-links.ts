/**
 * קישור אוטומטי למושגי glossary בתוך טקסט MDX (remark).
 * כללים: ללא כותרות/קוד/לינקים; עד 2 הופעות לכל slug; ביטוי ארוך לפני קצר.
 */
import type { Link, Root, Text } from "mdast";
import { visitParents } from "unist-util-visit-parents";
import { glossaryConcepts } from "../data/glossary";

const MAX_PER_SLUG = 2;

const PROTECTED_TYPES = new Set([
  "link",
  "heading",
  "code",
  "inlineCode",
  "mdxJsxFlowElement",
  "mdxJsxTextElement",
  "linkReference",
  "image",
  "imageReference",
  "definition",
]);

type Matcher = { phrase: string; slug: string; summary: string };

function buildMatchers(): Matcher[] {
  const out: Matcher[] = [];
  for (const c of glossaryConcepts) {
    const phrases = new Set<string>();
    phrases.add(c.title);
    for (const k of c.keywords) {
      const t = String(k).trim();
      if (t) phrases.add(t);
    }
    for (const p of phrases) {
      out.push({ phrase: p, slug: c.slug, summary: c.summary });
    }
  }
  return out.sort((a, b) => b.phrase.length - a.phrase.length);
}

function splitTextToNodes(value: string, matchers: Matcher[], counts: Map<string, number>): (Text | Link)[] {
  const nodes: (Text | Link)[] = [];
  let i = 0;
  const len = value.length;

  const pushChar = (ch: string) => {
    const last = nodes[nodes.length - 1];
    if (last && last.type === "text") {
      last.value += ch;
    } else {
      nodes.push({ type: "text", value: ch });
    }
  };

  while (i < len) {
    let best: Matcher | null = null;
    for (const m of matchers) {
      if ((counts.get(m.slug) ?? 0) >= MAX_PER_SLUG) continue;
      if (value.startsWith(m.phrase, i) && (!best || m.phrase.length > best.phrase.length)) {
        best = m;
      }
    }
    if (!best) {
      pushChar(value[i]);
      i += 1;
      continue;
    }

    nodes.push({
      type: "link",
      url: `/glossary/${best.slug}/`,
      title: best.summary,
      children: [{ type: "text", value: best.phrase }],
    });
    counts.set(best.slug, (counts.get(best.slug) ?? 0) + 1);
    i += best.phrase.length;
  }

  return nodes;
}

const matchers = buildMatchers();

export default function remarkGlossaryLinks() {
  return (tree: Root) => {
    const counts = new Map<string, number>();

    visitParents(tree, "text", (node, ancestors) => {
      if (ancestors.some((a) => PROTECTED_TYPES.has(a.type))) {
        return;
      }
      const parent = ancestors[ancestors.length - 1] as { children?: unknown[] };
      if (!parent || !Array.isArray(parent.children)) return;

      const textNode = node as Text;
      const idx = parent.children.indexOf(textNode as never);
      if (idx === -1) return;

      const newNodes = splitTextToNodes(textNode.value, matchers, counts);
      if (newNodes.length === 1 && newNodes[0].type === "text" && newNodes[0].value === textNode.value) {
        return;
      }

      parent.children.splice(idx, 1, ...(newNodes as never[]));
    });
  };
}
