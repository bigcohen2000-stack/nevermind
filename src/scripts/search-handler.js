import { runPagefindSearch } from "../lib/pagefind-client.js";

const EMPTY_MESSAGE = "לא מצאנו את מה שחיפשת, אולי ננסה לשאול את ההפך?";
const LOADING_MESSAGE = "מזקק את המנגנון...";

function renderLoadingState(resultsContainer) {
  resultsContainer.setAttribute("aria-busy", "true");
  resultsContainer.innerHTML = `
    <div class="nm-feedback-loading space-y-4 rounded-2xl border border-[color-mix(in_srgb,var(--nm-fg)_8%,transparent)] bg-[color-mix(in_srgb,var(--nm-surface-muted)_55%,white)] p-5 text-right">
      <p class="text-[clamp(0.95rem,0.9rem+0.2vw,1.05rem)] font-medium text-[var(--nm-fg)]">${LOADING_MESSAGE}</p>
      <div class="space-y-3" aria-hidden="true">
        <span class="nm-skeleton-line nm-skeleton-line--88 block rounded-lg"></span>
        <span class="nm-skeleton-line nm-skeleton-line--60 block rounded-lg"></span>
        <span class="nm-skeleton-line nm-skeleton-line--88 block rounded-lg"></span>
      </div>
    </div>`;
}

function renderEmptyState(resultsContainer) {
  resultsContainer.removeAttribute("aria-busy");
  resultsContainer.innerHTML = `
    <div class="space-y-4 rounded-2xl border border-[color-mix(in_srgb,var(--nm-fg)_8%,transparent)] bg-[color-mix(in_srgb,var(--nm-surface-muted)_55%,white)] p-5 text-right">
      <p class="text-[clamp(0.95rem,0.9rem+0.2vw,1.05rem)] font-medium text-[var(--nm-fg)]">${EMPTY_MESSAGE}</p>
      <p class="text-[clamp(0.85rem,0.8rem+0.2vw,1rem)] text-[color-mix(in_srgb,var(--nm-fg)_58%,var(--nm-bg))]">אפשר לפתוח כיוון אחר או להיכנס ישר למאמרים שכבר מחכים לך.</p>
      <div class="flex flex-wrap justify-end gap-2">
        <a href="/articles/hidden-assumptions-mechanics/" class="inline-flex min-h-[44px] items-center rounded-full border border-[color-mix(in_srgb,var(--nm-fg)_10%,transparent)] bg-white/90 px-4 py-2 text-sm text-[var(--nm-fg)] transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--nm-accent)]">הנחה סמויה</a>
        <a href="/articles/why-bad-things-happen/" class="inline-flex min-h-[44px] items-center rounded-full border border-[color-mix(in_srgb,var(--nm-fg)_10%,transparent)] bg-white/90 px-4 py-2 text-sm text-[var(--nm-fg)] transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--nm-accent)]">למה דברים רעים קורים</a>
        <a href="/articles/" class="inline-flex min-h-[44px] items-center rounded-full border border-[color-mix(in_srgb,var(--nm-fg)_10%,transparent)] bg-white/90 px-4 py-2 text-sm text-[var(--nm-fg)] transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--nm-accent)]">כל המאמרים</a>
      </div>
    </div>`;
}

function renderResults(resultsContainer, items) {
  resultsContainer.removeAttribute("aria-busy");
  resultsContainer.innerHTML = "";
  if (!items.length) {
    renderEmptyState(resultsContainer);
    return;
  }

  items.forEach((item) => {
    const wrapper = document.createElement("a");
    wrapper.href = item.url;
    wrapper.className =
      "block rounded-2xl border border-[color-mix(in_srgb,var(--nm-fg)_10%,transparent)] bg-white/70 px-4 py-3 transition-colors duration-300 hover:bg-white";
    wrapper.setAttribute("data-nm-loading-label", "בודק את שורש הרצון...");

    const title = document.createElement("p");
    title.className = "text-[clamp(0.95rem,0.9rem+0.25vw,1.1rem)] font-semibold text-[var(--nm-fg)]";
    title.textContent = item.title;

    const excerpt = document.createElement("p");
    excerpt.className =
      "mt-1 text-[clamp(0.85rem,0.8rem+0.2vw,1rem)] text-[color-mix(in_srgb,var(--nm-fg)_60%,var(--nm-bg))]";
    excerpt.innerHTML = item.excerpt;

    wrapper.append(title, excerpt);
    resultsContainer.appendChild(wrapper);
  });
}

async function setupSearchPage() {
  if (typeof window.__nmSearchPageCleanup === "function") {
    window.__nmSearchPageCleanup();
  }

  const input = document.querySelector("[data-pagefind-input]");
  const resultsContainer = document.querySelector("[data-pagefind-results]");
  if (!(input instanceof HTMLInputElement) || !(resultsContainer instanceof HTMLElement)) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const initialQuery = (params.get("q") || "").trim();
  let timeoutId = 0;
  let requestId = 0;

  const runSearch = async (value, { announce = false } = {}) => {
    const query = String(value || "").trim();
    if (!query) {
      renderEmptyState(resultsContainer);
      return;
    }

    const myId = ++requestId;
    if (announce) {
      window.__nmHapticLight?.();
    }
    renderLoadingState(resultsContainer);

    let rows = [];
    try {
      rows = await runPagefindSearch(query, 12);
    } catch {
      rows = [];
    }

    if (myId !== requestId) {
      return;
    }

    renderResults(resultsContainer, rows);
  };

  const onInput = (event) => {
    const value = event.target instanceof HTMLInputElement ? event.target.value : "";
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => {
      void runSearch(value, { announce: value.trim().length > 1 });
    }, 200);
  };

  const onSearch = () => {
    void runSearch(input.value, { announce: true });
  };

  input.addEventListener("input", onInput);
  input.addEventListener("search", onSearch);

  window.__nmSearchPageCleanup = () => {
    window.clearTimeout(timeoutId);
    input.removeEventListener("input", onInput);
    input.removeEventListener("search", onSearch);
    window.__nmSearchPageCleanup = undefined;
  };

  if (initialQuery) {
    input.value = initialQuery;
    void runSearch(initialQuery);
    return;
  }

  renderEmptyState(resultsContainer);
}

if (!window.__nmSearchPageLoadBound) {
  window.__nmSearchPageLoadBound = true;
  document.addEventListener("astro:page-load", () => {
    void setupSearchPage();
  });
}

window.requestAnimationFrame(() => {
  void setupSearchPage();
});