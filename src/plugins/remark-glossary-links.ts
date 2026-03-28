/**
 * קישור אוטומטי למושגי glossary בתוך טקסט MDX (remark).
 * כללים: ללא כותרות/קוד/לינקים/MDX; פעם אחת לכל slug בכל פסקה; ביטוי ארוך לפני קצר;
 * גבולות מילה; הטיות ה־/ל־
 * מצב WeakMap נפרד לכל קובץ (עץ MDX).
 */
import type { Link, Parent, Root, Text } from "mdast";
import { visitParents } from "unist-util-visit-parents";
import { glossaryConcepts } from "../data/glossary";

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

const NO_PARA_BUCKET = Object.freeze({ kind: "no-paragraph-text" });

function isWordChar(ch: string): boolean {
  return /[\u0590-\u05FF\w\d]/.test(ch);
}

function boundaryOk(value: string, start: number, len: number): boolean {
  const before = start > 0 ? value[start - 1]! : "\n";
  const after = start + len < value.length ? value[start + len]! : "\n";
  return !isWordChar(before) && !isWordChar(after);
}

function expandPhraseVariants(phrase: string): string[] {
  const t = phrase.trim();
  if (!t) return [];
  const s = new Set<string>();
  s.add(t);
  if (!t.startsWith("ה")) s.add(`ה${t}`);
  if (!t.startsWith("ל")) s.add(`ל${t}`);
  return [...s];
}

function buildMatchers(): Matcher[] {
  const out: Matcher[] = [];
  for (const c of glossaryConcepts) {
    const phrases = new Set<string>();
    const bases = [c.title, ...c.keywords.map((k) => String(k).trim()).filter(Boolean)];
    for (const base of bases) {
      for (const v of expandPhraseVariants(base)) phrases.add(v);
    }
    for (const p of phrases) {
      out.push({ phrase: p, slug: c.slug, summary: c.summary });
    }
  }
  return out.sort((a, b) => b.phrase.length - a.phrase.length);
}

const matchers = buildMatchers();

function getParagraphBucket(ancestors: Parent[]): object {
  for (let i = ancestors.length - 1; i >= 0; i--) {
    const a = ancestors[i];
    if (a?.type === "paragraph") return a as object;
  }
  return NO_PARA_BUCKET;
}

export default function remarkGlossaryLinks() {
  return (tree: Root) => {
    const linkedSlugsByParagraph = new WeakMap<object, Set<string>>();

    const hasLinkedSlug = (para: object, slug: string) => linkedSlugsByParagraph.get(para)?.has(slug) ?? false;

    const markLinkedSlug = (para: object, slug: string) => {
      let set = linkedSlugsByParagraph.get(para);
      if (!set) {
        set = new Set();
        linkedSlugsByParagraph.set(para, set);
      }
      set.add(slug);
    };

    const splitTextToNodes = (value: string, paragraphBucket: object): (Text | Link)[] => {
      const nodes: (Text | Link)[] = [];
      let i = 0;
      const len = value.length;

      const pushChar = (ch: string) => {
        const last = nodes[nodes.length - 1];
        if (last && last.type === "text") last.value += ch;
        else nodes.push({ type: "text", value: ch });
      };

      while (i < len) {
        const candidates: Matcher[] = [];
        for (const m of matchers) {
          if (value.startsWith(m.phrase, i) && boundaryOk(value, i, m.phrase.length)) {
            candidates.push(m);
          }
        }
        candidates.sort((a, b) => b.phrase.length - a.phrase.length);

        let chosen: Matcher | null = null;
        for (const m of candidates) {
          if (!hasLinkedSlug(paragraphBucket, m.slug)) {
            chosen = m;
            markLinkedSlug(paragraphBucket, m.slug);
            break;
          }
        }

        if (!chosen) {
          pushChar(value[i]!);
          i += 1;
          continue;
        }

        nodes.push({
          type: "link",
          url: `/glossary/${chosen.slug}/`,
          title: chosen.summary,
          children: [{ type: "text", value: chosen.phrase }],
        });
        i += chosen.phrase.length;
      }

      return nodes;
    };

    visitParents(tree, "text", (node, ancestors) => {
      if (ancestors.some((a) => PROTECTED_TYPES.has(a.type))) return;
      const parent = ancestors[ancestors.length - 1] as { children?: unknown[] };
      if (!parent || !Array.isArray(parent.children)) return;

      const textNode = node as Text;
      const idx = parent.children.indexOf(textNode as never);
      if (idx === -1) return;

      const paragraphBucket = getParagraphBucket(ancestors as Parent[]);
      const newNodes = splitTextToNodes(textNode.value, paragraphBucket);
      if (newNodes.length === 1 && newNodes[0].type === "text" && newNodes[0].value === textNode.value) {
        return;
      }

      parent.children.splice(idx, 1, ...(newNodes as never[]));
    });
  };
}
