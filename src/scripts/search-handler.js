import { runPagefindSearch } from "../lib/pagefind-client.js";

const LOADING_MESSAGE = "מזקק את המנגנון...";

function getSearchQueryLabel() {
  const params = new URLSearchParams(window.location.search);
  const fromUrl = params.get("q")?.trim() ?? "";
  if (fromUrl) return fromUrl;
  const input = document.querySelector("[data-pagefind-input]");
  const fromInput = input instanceof HTMLInputElement ? input.value.trim() : "";
  if (fromInput) return fromInput;
  return "משהו מסוים";
}

function buildWhatsAppMessage(queryLabel) {
  return `היי, חיפשתי באתר על ${queryLabel} ולא מצאתי. אני רוצה לקבוע פגישה מצולמת ולפרק את זה יחד.`;
}

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
  const waDigits = String(resultsContainer.dataset.waDigits ?? "").replace(/\D/g, "");
  const queryLabel = getSearchQueryLabel();
  const waHref = waDigits
    ? `https://wa.me/${waDigits}?text=${encodeURIComponent(buildWhatsAppMessage(queryLabel))}`
    : "";
  const waLinkBlock = waHref
    ? `<a
        href="${waHref}"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[color-mix(in_srgb,#1A1A1A_22%,transparent)] bg-transparent px-5 py-3 text-center text-[clamp(0.9rem,0.85rem+0.2vw,1rem)] font-semibold text-[#1A1A1A] transition hover:bg-[color-mix(in_srgb,#1A1A1A_6%,transparent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D42B2B]"
        aria-label="פתיחת וואטסאפ עם הודעה מוכנה על החיפוש שלא הניב תוצאות"
      >שליחה בוואטסאפ עם טקסט מוכן</a>`
    : "";

  resultsContainer.innerHTML = `
    <div class="nm-search-empty space-y-6 rounded-2xl border border-[color-mix(in_srgb,#1A1A1A_12%,transparent)] bg-[#FAFAF8] p-6 text-right text-[#1A1A1A] [font-family:'Assistant_Variable','Heebo',system-ui,sans-serif] leading-[1.6]">
      <div class="space-y-3 text-[clamp(0.95rem,0.9rem+0.2vw,1.05rem)]">
        <p>החיפוש עדיין לא פגש את המחשבה הנכונה כאן.</p>
        <p>אולי ננסה לשאול את ההפך?</p>
        <p>אפשר להמשיך למאמרים שכבר מחכים לך.</p>
        <p>אפשר גם שנשב לפרק את זה יחד באולפן.</p>
        <p>אנחנו מצלמים שיחות עומק כאלו כדי להעלות תכנים חדשים שמעניינים אותך.</p>
      </div>
      <nav aria-label="קישורים מהירים" class="space-y-2">
        <ul class="m-0 list-none space-y-2 p-0">
          <li>
            <a
              href="/tags/hidden-assumption"
              class="flex w-full items-center gap-2 rounded-xl py-2 ps-1 pe-1 text-[clamp(0.9rem,0.85rem+0.2vw,1rem)] font-medium text-[#1A1A1A] underline-offset-4 transition hover:bg-[color-mix(in_srgb,#1A1A1A_5%,transparent)] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D42B2B]"
            >
              <span>הנחה סמויה</span>
              <span class="ms-auto shrink-0 text-[#D42B2B]" aria-hidden="true">←</span>
            </a>
          </li>
          <li>
            <a
              href="/articles/why-bad-things-happen/"
              class="flex w-full items-center gap-2 rounded-xl py-2 ps-1 pe-1 text-[clamp(0.9rem,0.85rem+0.2vw,1rem)] font-medium text-[#1A1A1A] underline-offset-4 transition hover:bg-[color-mix(in_srgb,#1A1A1A_5%,transparent)] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D42B2B]"
            >
              <span class="shrink-0 text-[#D42B2B]" aria-hidden="true">←</span>
              <span>למה דברים רעים קורים</span>
            </a>
          </li>
          <li>
            <a
              href="/library/"
              class="flex w-full items-center gap-2 rounded-xl py-2 ps-1 pe-1 text-[clamp(0.9rem,0.85rem+0.2vw,1rem)] font-medium text-[#1A1A1A] underline-offset-4 transition hover:bg-[color-mix(in_srgb,#1A1A1A_5%,transparent)] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D42B2B]"
            >
              <span>כל המאמרים</span>
              <span class="ms-auto shrink-0 text-[#D42B2B]" aria-hidden="true">←</span>
            </a>
          </li>
        </ul>
      </nav>
      <div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
        <a
          href="/services#balcony-experience"
          class="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[#D42B2B] px-6 py-3 text-center text-[clamp(0.95rem,0.9rem+0.2vw,1.05rem)] font-bold text-white transition hover:bg-[color-mix(in_srgb,#D42B2B_92%,#1A1A1A)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1A1A1A]"
          aria-label="מעבר לפרטי האולפן לפריקת נושא בפודקאסט"
        >אני רוצה לפרק את זה באולפן</a>
        ${waLinkBlock}
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