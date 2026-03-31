import { runPagefindSearch } from "../lib/pagefind-client.js";

const MIN_LEN = 2;
const DEBOUNCE_MS = 320;
const LIMIT = 6;
const EMPTY_MESSAGE = "לא מצאנו את מה שחיפשת, אולי ננסה לשאול את ההפך?";
const LOADING_MESSAGE = "בודק את שורש הרצון...";

function escapeHtml(text) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function syncDiscoveryInputValue(input, value) {
  const nextValue = String(value ?? "");
  input.value = nextValue;
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

async function runDiscoverySetup() {
  if (typeof window.__nmServicesDiscoveryCleanup === "function") {
    window.__nmServicesDiscoveryCleanup();
  }

  const configEl = document.getElementById("services-discovery-config");
  const input = document.getElementById("discovery-search");
  const gapEl = document.getElementById("discovery-gap");
  const gapText = document.getElementById("discovery-gap-text");
  const gapWa = document.getElementById("discovery-gap-wa");
  const listEl = document.getElementById("discovery-archive-list");
  const statusEl = document.getElementById("discovery-archive-status");
  const idleEl = document.getElementById("discovery-idle");

  if (
    !(configEl instanceof HTMLElement) ||
    !(input instanceof HTMLInputElement) ||
    !(gapEl instanceof HTMLElement) ||
    !(gapText instanceof HTMLElement) ||
    !(gapWa instanceof HTMLAnchorElement) ||
    !(listEl instanceof HTMLElement) ||
    !(statusEl instanceof HTMLElement) ||
    !(idleEl instanceof HTMLElement)
  ) {
    return;
  }

  const waNumber = configEl.dataset.waNumber || "";
  const waHrefForTopic = (topic) => {
    const resolvedTopic = String(topic || "").trim() || "הנושא שחיפשתי";
    const body = `היי, חיפשתי באתר על ${resolvedTopic} ולא מצאתי. אפשר לבדוק את זה יחד?`;
    return `https://wa.me/${waNumber}?text=${encodeURIComponent(body)}`;
  };

  let debounceTimer = 0;
  let requestId = 0;

  const showIdle = () => {
    idleEl.classList.remove("hidden");
    gapEl.classList.add("hidden");
    listEl.innerHTML = "";
    statusEl.classList.add("hidden");
    statusEl.removeAttribute("aria-busy");
    statusEl.innerHTML = "";
  };

  const showLoading = () => {
    idleEl.classList.add("hidden");
    gapEl.classList.add("hidden");
    statusEl.classList.remove("hidden");
    statusEl.setAttribute("aria-busy", "true");
    statusEl.innerHTML = `
      <div class="nm-feedback-loading space-y-3 rounded-2xl border border-[color-mix(in_srgb,var(--nm-fg)_8%,transparent)] bg-[color-mix(in_srgb,var(--nm-bg-canvas)_94%,transparent)] px-4 py-4 text-right">
        <p class="text-sm font-semibold text-[var(--nm-fg)]">${LOADING_MESSAGE}</p>
        <span class="nm-skeleton-line nm-skeleton-line--88 block rounded-lg" aria-hidden="true"></span>
        <span class="nm-skeleton-line nm-skeleton-line--60 block rounded-lg" aria-hidden="true"></span>
      </div>`;
    listEl.innerHTML = "";
  };

  const showGap = (query) => {
    statusEl.classList.add("hidden");
    statusEl.removeAttribute("aria-busy");
    statusEl.innerHTML = "";
    gapEl.classList.remove("hidden");
    gapText.textContent = EMPTY_MESSAGE;
    gapWa.href = waHrefForTopic(query);
    listEl.innerHTML = "";
  };

  const showResults = (rows) => {
    statusEl.classList.add("hidden");
    statusEl.removeAttribute("aria-busy");
    statusEl.innerHTML = "";
    gapEl.classList.add("hidden");
    listEl.innerHTML = rows
      .map(
        (row) =>
          `<a href="${escapeHtml(row.url)}" data-nm-loading-label="בודק את שורש הרצון..." class="block rounded-2xl border border-[color-mix(in_srgb,var(--nm-fg)_10%,transparent)] bg-[color-mix(in_srgb,var(--nm-bg-canvas)_88%,transparent)] px-4 py-4 text-right transition hover:border-[color-mix(in_srgb,var(--nm-accent)_22%,transparent)] hover:bg-[var(--nm-surface-muted)]"><p class="font-semibold text-[var(--nm-fg)]">${escapeHtml(row.title)}</p><div class="mt-1 text-sm leading-6 text-[color-mix(in_srgb,var(--nm-fg)_62%,var(--nm-bg))]">${row.excerpt}</div></a>`
      )
      .join("");
  };

  const runQuery = async (raw, { announce = false } = {}) => {
    const query = String(raw || "").trim();
    if (query.length < MIN_LEN) {
      showIdle();
      return;
    }

    const myId = ++requestId;
    if (announce) {
      window.__nmHapticLight?.();
    }
    showLoading();

    let rows = [];
    try {
      rows = await runPagefindSearch(query, LIMIT);
    } catch {
      rows = [];
    }

    if (myId !== requestId) {
      return;
    }

    if (!rows.length) {
      showGap(query);
      return;
    }

    showResults(rows);
  };

  const scheduleRun = () => {
    window.clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(() => {
      void runQuery(input.value, { announce: input.value.trim().length >= MIN_LEN });
    }, DEBOUNCE_MS);
  };

  const onInput = () => {
    scheduleRun();
  };

  input.addEventListener("input", onInput);
  input.addEventListener("search", () => {
    void runQuery(input.value, { announce: true });
  });

  const tagButtons = Array.from(document.querySelectorAll("[data-discovery-tag]"));
  const onTagClick = (event) => {
    const button = event.currentTarget;
    if (!(button instanceof HTMLElement)) {
      return;
    }

    const tag = button.dataset.discoveryTag || "";
    syncDiscoveryInputValue(input, tag);
    window.clearTimeout(debounceTimer);
    void runQuery(tag, { announce: true });
  };

  tagButtons.forEach((button) => button.addEventListener("click", onTagClick));

  const params = new URLSearchParams(window.location.search);
  const fromUrl = (params.get("topic") || params.get("q") || "").trim();
  if (fromUrl.length >= MIN_LEN) {
    syncDiscoveryInputValue(input, fromUrl);
    window.clearTimeout(debounceTimer);
    void runQuery(fromUrl);
  } else {
    showIdle();
  }

  window.__nmServicesDiscoveryCleanup = () => {
    window.clearTimeout(debounceTimer);
    input.removeEventListener("input", onInput);
    tagButtons.forEach((button) => button.removeEventListener("click", onTagClick));
    window.__nmServicesDiscoveryCleanup = undefined;
  };
}

if (!window.__nmDiscoveryPageLoadBound) {
  window.__nmDiscoveryPageLoadBound = true;
  document.addEventListener("astro:page-load", () => {
    void runDiscoverySetup();
  });
}

window.requestAnimationFrame(() => {
  void runDiscoverySetup();
});