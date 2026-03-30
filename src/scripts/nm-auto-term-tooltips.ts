/**
 * עוטף במסמך מילות מפתח מכניות (רצון, מציאות, הפוך, הבנה מושלמת) בטולטיפים.
 * רץ אחרי טעינת עמוד; מדלג על קוד, טפסים, קישורים קיימים.
 */
const TERM_DEFS: readonly { term: string; preview: string }[] = [
  {
    term: "הבנה מושלמת",
    preview: "ראייה ברורה של עובדה מול פירוש, בלי ערבוב שכבות.",
  },
  { term: "מציאות", preview: "מה שנשאר אחרי שמורידים את הסיפור מעל העובדה." },
  { term: "הפוך", preview: "אותו אירוע מזווית נגדית לפרשנות הקודמת." },
  { term: "רצון", preview: "כיוון תנועה שהמוח בוחר אחרי פרשנות, לא לפני." },
];

const SKIP_PARENT =
  "a[href],button,textarea,input,select,option,code,pre,svg,.nm-term-autotip,script,style,noscript";

function nextMatch(remaining: string): { term: string; preview: string; idx: number } | null {
  let best: { term: string; preview: string; idx: number } | null = null;
  for (const { term, preview } of TERM_DEFS) {
    const idx = remaining.indexOf(term);
    if (idx < 0) continue;
    if (!best || idx < best.idx || (idx === best.idx && term.length > best.term.length)) {
      best = { term, preview, idx };
    }
  }
  return best;
}

function fragmentFromRemaining(remaining: string): DocumentFragment {
  const frag = document.createDocumentFragment();
  let rest = remaining;
  while (rest.length) {
    const m = nextMatch(rest);
    if (!m) {
      frag.append(document.createTextNode(rest));
      break;
    }
    if (m.idx > 0) frag.append(document.createTextNode(rest.slice(0, m.idx)));
    const span = document.createElement("span");
    span.className =
      "nm-glossary-tip nm-term-autotip cursor-help border-b border-dotted border-[color-mix(in_srgb,var(--nm-fg)_40%,transparent)] text-inherit";
    span.setAttribute("data-glossary-preview", m.preview);
    span.setAttribute("tabindex", "0");
    span.setAttribute("role", "term");
    span.textContent = m.term;
    frag.append(span);
    rest = rest.slice(m.idx + m.term.length);
  }
  return frag;
}

function processTextNode(node: Text) {
  const parent = node.parentElement;
  if (!parent) return;
  if (parent.classList.contains("nm-term-autotip")) return;
  if (parent.closest(SKIP_PARENT)) return;
  const text = node.nodeValue ?? "";
  if (!text.trim()) return;
  if (!TERM_DEFS.some(({ term }) => text.includes(term))) return;
  const frag = fragmentFromRemaining(text);
  node.parentNode?.replaceChild(frag, node);
}

function walk(root: HTMLElement) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(n) {
      const p = n.parentElement;
      if (!p) return NodeFilter.FILTER_REJECT;
      if (p.classList.contains("nm-term-autotip")) return NodeFilter.FILTER_REJECT;
      if (p.closest(SKIP_PARENT)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  const batch: Text[] = [];
  let cur: Node | null = walker.nextNode();
  while (cur) {
    if (cur instanceof Text) batch.push(cur);
    cur = walker.nextNode();
  }
  batch.forEach(processTextNode);
}

function init() {
  const main = document.getElementById("main-content");
  if (!(main instanceof HTMLElement)) return;
  walk(main);
}

document.addEventListener("astro:page-load", init);
