function setupArticlePage() {
  if (typeof window.__nmArticleCleanup === "function") {
    window.__nmArticleCleanup();
  }

  const progressBar = document.getElementById("reading-progress");
  const focusToggle = document.querySelector("[data-focus-toggle]");
  const copyButton = document.querySelector("[data-copy-link]");
  const toast = document.querySelector("[data-copy-toast]");
  const premiumBody = document.querySelector("[data-premium-body]");
  const cleanups = [];
  let ticking = false;
  let toastTimeout;

  const updateProgress = () => {
    const doc = document.documentElement;
    const scrollTop = doc.scrollTop || document.body.scrollTop;
    const scrollHeight = doc.scrollHeight - doc.clientHeight;
    const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
    if (progressBar instanceof HTMLElement) {
      progressBar.style.width = `${progress}%`;
    }
    ticking = false;
  };

  const onScroll = () => {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(updateProgress);
    }
  };

  const setFocusMode = (enabled) => {
    document.body.classList.toggle("is-focus-mode", enabled);
    if (focusToggle instanceof HTMLButtonElement) {
      focusToggle.setAttribute("aria-pressed", String(enabled));
      focusToggle.textContent = enabled ? "יציאה ממצב פוקוס" : "מצב פוקוס";
    }
  };

  const showToast = (message = "הועתק") => {
    if (!(toast instanceof HTMLElement)) {
      return;
    }

    const previous = toast.textContent || "הועתק";
    toast.textContent = message;
    toast.classList.add("opacity-100");
    window.clearTimeout(toastTimeout);
    toastTimeout = window.setTimeout(() => {
      toast.classList.remove("opacity-100");
      toast.textContent = previous;
    }, 1400);
  };

  const applyPremiumVault = async () => {
    if (!(premiumBody instanceof HTMLElement)) {
      return;
    }
    if (premiumBody.dataset.premiumInitialized === "true") {
      return;
    }

    const SETTINGS_STORAGE_KEY = "nm-site-settings-overrides";
    const readOverrides = () => {
      try {
        return JSON.parse(window.localStorage.getItem(SETTINGS_STORAGE_KEY) || "null");
      } catch {
        return null;
      }
    };

    const overrides = readOverrides()?.premiumVault || {};
    const premiumEnabled = overrides.enabled ?? (premiumBody.dataset.premiumActive === "true");
    if (!premiumEnabled) {
      premiumBody.dataset.premiumInitialized = "true";
      return;
    }

    const skeleton = document.getElementById("nm-premium-skeleton");
    const paywallRoot = document.getElementById("nm-premium-paywall-root");

    const finishSkeleton = () => {
      if (skeleton instanceof HTMLElement) {
        skeleton.classList.add("is-premium-skeleton--done");
        skeleton.setAttribute("aria-busy", "false");
      }
    };

    const hasDashboardAccess = () => {
      try {
        const raw = window.localStorage.getItem("nm_access_code");
        return typeof raw === "string" && raw.trim().length > 0;
      } catch {
        return false;
      }
    };

    const hasPremiumLocalSession = () => {
      try {
        const raw = window.localStorage.getItem("nm-premium-access");
        if (!raw) {
          return false;
        }
        const parsed = JSON.parse(raw);
        const expiresAt = Date.parse(String(parsed?.expiresAt || ""));
        return Number.isFinite(expiresAt) && expiresAt > Date.now();
      } catch {
        return false;
      }
    };

    const hasClubSession = () => {
      try {
        const raw = window.localStorage.getItem("nm_club_session");
        if (!raw) {
          return false;
        }
        const parsed = JSON.parse(raw);
        const expiresAt = Date.parse(String(parsed?.expiresAt || ""));
        return Number.isFinite(expiresAt) && expiresAt > Date.now();
      } catch {
        return false;
      }
    };

    const hasPremiumAccess = () => hasDashboardAccess() || hasPremiumLocalSession() || hasClubSession();

    const buildPremiumVaultShell = () => {
      if (!(paywallRoot instanceof HTMLElement)) {
        return;
      }

      paywallRoot.innerHTML = "";

      const accessEnabled = premiumBody.dataset.premiumAccessEnabled === "true";
      const alreadyUnlocked = hasPremiumAccess();
      const articleTitle = premiumBody.dataset.premiumArticleTitle || document.title || "המאמר";
      const vaultTitle = alreadyUnlocked
        ? "הגישה שלך פעילה"
        : overrides.title || premiumBody.dataset.premiumTitle || "מכאן הלאה - נכנסים לפרטים";
      const description = alreadyUnlocked
        ? `הגישה למאמר "${articleTitle}" פתוחה עכשיו. בגלל שהאתר נפרס סטטית ב-GitHub Pages, המשך הכניסה לתוכן הפרימיום עובר דרך אזור הגישה האישי.`
        : overrides.description ||
          premiumBody.dataset.premiumDescription ||
          "הבסיס תמיד פתוח לכולם. ההמשך של המאמר הזה מיועד למי שרוצה להעמיק עוד צעד, עם גישה דרך אזור אישי או מסלול מלא.";
      const fallbackCtaLabel = overrides.ctaLabel || premiumBody.dataset.premiumCtaLabel || "איך מצטרפים?";
      const fallbackCtaHref = overrides.ctaHref || premiumBody.dataset.premiumCtaHref || "/services/";
      const accessRoute = premiumBody.dataset.premiumAccessRoute || "/me/unlock/";
      const helperText =
        premiumBody.dataset.premiumAccessHelper || "גישה לתוכן פרימיום נפתחת כרגע דרך קוד גישה מתחלף.";
      const returnTo = encodeURIComponent(window.location.pathname);
      const primaryHref = accessEnabled ? `${accessRoute}?returnTo=${returnTo}` : fallbackCtaHref;
      const primaryLabel = "כניסה לאזור האישי";

      const ctasHtml = accessEnabled
        ? `<div class="nm-premium-vault-cta-row"><a href="${primaryHref}" class="nm-premium-vault-cta nm-premium-vault-cta--primary">${primaryLabel}</a><a href="${fallbackCtaHref}" class="nm-premium-vault-cta nm-premium-vault-cta--secondary">${fallbackCtaLabel}</a></div>`
        : `<div class="nm-premium-vault-cta-row"><a href="${primaryHref}" class="nm-premium-vault-cta nm-premium-vault-cta--primary">${fallbackCtaLabel}</a></div>`;

      const shell = document.createElement("div");
      shell.className = "nm-premium-shell";

      const calloutSource = premiumBody.querySelector("[data-premium-callout-anchor]");
      if (calloutSource) {
        const callout = calloutSource.querySelector(".nm-subscription-callout");
        if (callout) {
          shell.appendChild(callout.cloneNode(true));
        }
      }

      const fogWrap = document.createElement("div");
      fogWrap.className = "nm-premium-fog-wrap";
      fogWrap.setAttribute("aria-hidden", "true");
      const fog = document.createElement("div");
      fog.className = "nm-premium-fog";
      fogWrap.appendChild(fog);
      shell.appendChild(fogWrap);

      const card = document.createElement("section");
      card.className = "nm-premium-card";
      card.innerHTML = `
        <p class="nm-premium-vault-kicker">Premium Vault</p>
        <h2 class="nm-premium-vault-title">${vaultTitle}</h2>
        <p class="nm-premium-vault-body">${description}</p>
        <p class="nm-premium-vault-helper">${helperText}</p>
        ${ctasHtml}
      `;

      shell.appendChild(card);
      paywallRoot.appendChild(shell);
      paywallRoot.removeAttribute("hidden");
    };

    if (!(skeleton instanceof HTMLElement) || !(paywallRoot instanceof HTMLElement)) {
      premiumBody.dataset.premiumInitialized = "true";
      return;
    }

    finishSkeleton();
    buildPremiumVaultShell();
    premiumBody.dataset.premiumInitialized = "true";
  };

  if (copyButton instanceof HTMLElement) {
    const onCopyClick = async () => {
      const value = copyButton.getAttribute("data-copy-value") ?? "";
      try {
        await navigator.clipboard.writeText(value);
        showToast();
      } catch {
        window.prompt("העתק קישור", value);
      }
    };

    copyButton.addEventListener("click", onCopyClick);
    cleanups.push(() => copyButton.removeEventListener("click", onCopyClick));
  }

  const stripInsightPlain = (raw) => {
    const value = String(raw || "").trim();
    if (!value) {
      return "";
    }

    const div = document.createElement("div");
    div.innerHTML = value;
    const fromDom = div.textContent?.replace(/\s+/g, " ").trim();
    if (fromDom) {
      return fromDom;
    }
    return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  };

  document.querySelectorAll("[data-copy-insight]").forEach((node) => {
    const onInsightCopy = async () => {
      if (!(node instanceof HTMLElement)) {
        return;
      }

      const insightRaw = (node.getAttribute("data-insight") || "").trim();
      if (!insightRaw) {
        return;
      }

      const usePlain = node.getAttribute("data-copy-plain") === "true";
      const articleTitle = (node.getAttribute("data-article-title") || "").trim();
      const insight = usePlain ? stripInsightPlain(insightRaw) : insightRaw;
      if (!insight) {
        return;
      }

      const payload = usePlain
        ? insight
        : `"${insight}" - מתוך המאמר: ${articleTitle}. לקריאה המלאה ב-NeverMind: ${window.location.href}`;

      try {
        await navigator.clipboard.writeText(payload);
        showToast(usePlain ? "הועתק" : "התובנה הועתקה, אפשר להדביק בוואטסאפ");
      } catch {
        window.prompt("העתק תובנה", payload);
      }
    };

    node.addEventListener("click", onInsightCopy);
    cleanups.push(() => node.removeEventListener("click", onInsightCopy));
  });

  const truthBlock = document.querySelector("[data-truth-block]");
  const insightSticky = document.querySelector("[data-insight-sticky]");
  if (truthBlock instanceof HTMLElement && insightSticky instanceof HTMLElement) {
    const syncTruthSticky = (entry) => {
      const rect = entry.boundingClientRect;
      const fullyAboveViewport = !entry.isIntersecting && rect.bottom <= 0;
      truthBlock.classList.toggle("nm-truth-collapsed", fullyAboveViewport);
      insightSticky.classList.toggle("nm-insight-sticky--visible", fullyAboveViewport);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) {
          syncTruthSticky(entry);
        }
      },
      { threshold: 0, root: null, rootMargin: "0px" }
    );
    observer.observe(truthBlock);
    cleanups.push(() => observer.disconnect());

    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const rect = truthBlock.getBoundingClientRect();
    const initiallyIntersecting = rect.bottom > 0 && rect.top < viewportHeight;
    syncTruthSticky({ isIntersecting: initiallyIntersecting, boundingClientRect: rect });
  }

  if (focusToggle instanceof HTMLButtonElement) {
    const onFocusClick = () => {
      const isPressed = focusToggle.getAttribute("aria-pressed") === "true";
      setFocusMode(!isPressed);
    };

    focusToggle.addEventListener("click", onFocusClick);
    cleanups.push(() => focusToggle.removeEventListener("click", onFocusClick));
  }

  document.addEventListener("scroll", onScroll, { passive: true });
  cleanups.push(() => document.removeEventListener("scroll", onScroll));

  updateProgress();
  setFocusMode(false);
  void applyPremiumVault().catch(() => {
    if (premiumBody instanceof HTMLElement) {
      premiumBody.dataset.premiumInitialized = "true";
    }
  });

  const initPremiumBonus = async () => {
    const root = document.querySelector("[data-premium-bonus-root]");
    if (!(root instanceof HTMLElement)) {
      return;
    }

    const locked = root.querySelector("[data-premium-bonus-locked]");
    const unlocked = root.querySelector("[data-premium-bonus-unlocked]");
    if (!(locked instanceof HTMLElement) || !(unlocked instanceof HTMLElement)) {
      return;
    }

    try {
      const hasCode = (() => {
        try {
          return Boolean((window.localStorage.getItem("nm_access_code") || "").trim());
        } catch {
          return false;
        }
      })();

      const hasClubSession = (() => {
        try {
          const raw = window.localStorage.getItem("nm_club_session");
          if (!raw) {
            return false;
          }
          const parsed = JSON.parse(raw);
          const expiresAt = Date.parse(String(parsed?.expiresAt || ""));
          return Number.isFinite(expiresAt) && expiresAt > Date.now();
        } catch {
          return false;
        }
      })();

      if (!hasCode && !hasClubSession) {
        return;
      }

      locked.hidden = true;
      unlocked.hidden = false;
    } catch {
      /* נשאר נעול */
    }
  };

  void initPremiumBonus();

  window.__nmArticleCleanup = () => {
    cleanups.forEach((cleanup) => cleanup());
    window.clearTimeout(toastTimeout);
    window.__nmArticleCleanup = undefined;
  };
}

if (!window.__nmArticlePageLoadBound) {
  window.__nmArticlePageLoadBound = true;
  document.addEventListener("astro:page-load", () => {
    setupArticlePage();
  });
}

window.requestAnimationFrame(() => {
  setupArticlePage();
});
