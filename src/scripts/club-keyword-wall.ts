const STORAGE_DISMISS = "nm-club-kw-wall-dismissed";

function readPhrases(root: HTMLElement): string[] {
  try {
    const raw = root.getAttribute("data-phrases") || "[]";
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.map((p) => String(p).trim()).filter(Boolean) : [];
  } catch {
    return [];
  }
}

function hasClubSession(): boolean {
  const fn = (window as unknown as { __nmReadClubSession?: () => unknown }).__nmReadClubSession;
  if (typeof fn !== "function") return false;
  try {
    return Boolean(fn());
  } catch {
    return false;
  }
}

function textMatches(haystack: string, needles: string[]): boolean {
  const h = haystack.replace(/\s+/g, " ").trim();
  return needles.some((n) => n.length > 0 && h.includes(n));
}

function findArticleShell(): HTMLElement | null {
  return document.querySelector(".nm-article-shell");
}

function showBar(root: HTMLElement, show: boolean) {
  root.classList.toggle("hidden", !show);
  root.classList.toggle("pointer-events-none", !show);
  root.classList.toggle("translate-y-full", !show);
  root.classList.toggle("opacity-0", !show);
  if (show) root.classList.remove("opacity-0");
}

function sync() {
  const root = document.getElementById("nm-club-keyword-wall");
  if (!(root instanceof HTMLElement) || !root.hasAttribute("data-nm-club-keyword-wall")) return;

  if (sessionStorage.getItem(STORAGE_DISMISS) === "1") {
    showBar(root, false);
    return;
  }

  if (hasClubSession()) {
    showBar(root, false);
    return;
  }

  const phrases = readPhrases(root);
  if (!phrases.length) {
    showBar(root, false);
    return;
  }

  const shell = findArticleShell();
  if (!shell) {
    showBar(root, false);
    return;
  }

  const blob = shell.textContent || "";
  const hit = textMatches(blob, phrases);
  showBar(root, hit);
}

function bindDismissOnce(root: HTMLElement) {
  if (root.dataset.nmKwBound === "1") return;
  root.dataset.nmKwBound = "1";
  const btn = root.querySelector("#nm-club-keyword-wall-dismiss");
  if (!(btn instanceof HTMLButtonElement)) return;
  btn.addEventListener("click", () => {
    try {
      sessionStorage.setItem(STORAGE_DISMISS, "1");
    } catch {
      /* ignore */
    }
    showBar(root, false);
  });
}

function setup() {
  const root = document.getElementById("nm-club-keyword-wall");
  if (!(root instanceof HTMLElement) || !root.hasAttribute("data-nm-club-keyword-wall")) return;
  bindDismissOnce(root);
  sync();
}

document.addEventListener("astro:page-load", () => {
  setup();
});
window.addEventListener("nm-club-session-changed", () => sync());
setup();
