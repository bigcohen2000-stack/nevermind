import { unlockTone } from "../config/brandVoice";

const PUBLIC_UNLOCK_MODE = "public";

function readConfig(): NmUnlockClientConfig | null {
  return window.__NM_UNLOCK_CONFIG__ ?? null;
}

function isExplicitPublicMode(rawMode: string): boolean {
  return String(rawMode || "").trim().toLowerCase() === PUBLIC_UNLOCK_MODE;
}

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function initUnlockPage() {
  window.__nmUnlockCleanup?.();

  const config = readConfig();
  if (!config) return;

  const shell = document.querySelector(".unlock-shell");
  const input = document.getElementById("unlock-code-input");
  const enterButton = document.getElementById("unlock-enter");
  const errorLine = document.getElementById("unlock-error");
  const successLine = document.getElementById("unlock-success");
  const identityPanel = document.getElementById("unlock-identity-panel");
  const identityNameInput = document.getElementById("unlock-fullname-input");
  const identityPhoneInput = document.getElementById("unlock-phone-input");
  const identitySubmitButton = document.getElementById("unlock-identity-submit");
  const identityStatus = document.getElementById("unlock-identity-status");
  const logoutButton = document.getElementById("unlock-logout");
  const liveCounterCount = document.querySelector('[data-live-counter-count]');
  const liveCounterCopy = document.querySelector('[data-live-counter-copy]');
  const liveCounterNote = document.querySelector('[data-live-counter-note]');
  const joinDot = document.querySelector('[data-join-dot]');
  const joinLabel = document.querySelector('[data-join-label]');
  const joinTitle = document.querySelector('[data-join-title]');
  const joinCopy = document.querySelector('[data-join-copy]');
  const joinOffer = document.getElementById("unlock-join-offer");
  const statStreak = document.querySelector('[data-stat="streak"]');
  const statSeconds = document.querySelector('[data-stat="seconds"]');
  const statSession = document.querySelector('[data-stat="session"]');
  const streakBar = document.querySelector('[data-progress="streak"]');
  const secondsBar = document.querySelector('[data-progress="seconds"]');
  const sessionBar = document.querySelector('[data-progress="session"]');
  const articlesCard = document.querySelector('[data-stat="articles"]');

  const explicitPublicMode = isExplicitPublicMode(config.unlockAccessModeRaw);

  const storageKey = "nm_access_code";
  const verifiedCodeStorageKey = "nm_access_code_verified";
  const clubSessionStorageKey = "nm_club_session";
  const premiumSessionStorageKey = "nm-premium-access";
  const LS_LOG = "nm_article_open_log";
  const LS_SECONDS = "nm_reading_seconds_local";
  const LS_STREAK = "nm_dashboard_streak";
  const cleanups: Array<() => void> = [];

  const readClubSession = () => {
    const club = readJson<Record<string, unknown>>(clubSessionStorageKey);
    const memberName = String(club?.memberName || "").trim();
    const expiresAt = String(club?.expiresAt || "").trim();
    const expiresTs = Date.parse(expiresAt);
    if (!memberName || !Number.isFinite(expiresTs) || expiresTs <= Date.now()) {
      try {
        localStorage.removeItem(clubSessionStorageKey);
      } catch {
        /* ignore */
      }
      return null;
    }
    return {
      memberName,
      phone: String(club?.phone || "").trim(),
      identityKey: String(club?.identityKey || "").trim(),
      expiresAt: new Date(expiresTs).toISOString(),
      lastLoginAt: String(club?.lastLoginAt || "").trim(),
      liveStatus: String(club?.liveStatus || "SHARED").trim() || "SHARED",
    };
  };

  const hasPremiumSession = () => {
    const premium = readJson<Record<string, unknown>>(premiumSessionStorageKey);
    const premiumExpiry = Date.parse(String(premium?.expiresAt || ""));
    return (Number.isFinite(premiumExpiry) && premiumExpiry > Date.now()) || Boolean(readClubSession());
  };

  const hasAcceptedCode = () => {
    if (explicitPublicMode) return true;
    const storedCode = String(localStorage.getItem(storageKey) || "").trim();
    if (!storedCode) return false;
    return String(localStorage.getItem(verifiedCodeStorageKey) || "").trim() === storedCode;
  };

  const verifyCodeWithServer = async (value: string) => {
    const clean = String(value || "").trim();
    if (!clean) return false;
    try {
      const response = await fetch(config.verifyCodeEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ code: clean }),
        cache: "no-store",
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.ok) {
        return null;
      }
      return payload.authorized === true;
    } catch {
      return null;
    }
  };

  const setIdentityMessage = (message: string, tone: "success" | "error" = "success") => {
    if (!(identityStatus instanceof HTMLElement)) return;
    if (!message) {
      identityStatus.textContent = "";
      identityStatus.classList.add("hidden");
      identityStatus.style.color = "";
      return;
    }
    identityStatus.textContent = message;
    identityStatus.classList.remove("hidden");
    identityStatus.style.color = tone === "error" ? "#8E4E4E" : "#4B6055";
  };

  const toggleIdentityPanel = (visible: boolean) => {
    if (!(identityPanel instanceof HTMLElement)) return;
    identityPanel.classList.toggle("hidden", !visible);
  };

  const saveSharedSession = (payload: Record<string, unknown>) => {
    const nowIso = new Date().toISOString();
    const fallbackExpiry = new Date(Date.now() + Number(config.premiumSessionHours || 168) * 60 * 60 * 1000).toISOString();
    const nextSession = {
      memberName: String(payload?.memberName || "").trim(),
      phone: String(payload?.phone || "").trim(),
      identityKey: String(payload?.identityKey || "").trim(),
      expiresAt: String(payload?.expiresAt || fallbackExpiry).trim() || fallbackExpiry,
      lastLoginAt: String(payload?.lastLoginAt || nowIso).trim() || nowIso,
      liveStatus: String(payload?.liveStatus || "SHARED").trim() || "SHARED",
    };
    if (!nextSession.memberName || !nextSession.expiresAt) {
      return null;
    }
    try {
      localStorage.setItem(clubSessionStorageKey, JSON.stringify(nextSession));
      window.dispatchEvent(new CustomEvent("nm-club-session-changed"));
      return nextSession;
    } catch {
      return null;
    }
  };

  const formatSeconds = (value: number) => {
    const total = Number(value) || 0;
    const minutes = Math.floor(total / 60);
    if (minutes <= 0) return unlockTone.stats.zeroMinutes;
    if (minutes < 60) return unlockTone.stats.minutesOnly(minutes);
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return rest > 0 ? unlockTone.stats.hourAndMinutes(hours, rest) : unlockTone.stats.hoursOnly(hours);
  };

  const readOpenLogCount = () => {
    const raw = readJson<Array<{ slug?: string }>>(LS_LOG) || [];
    if (!Array.isArray(raw)) return 0;
    return new Set(raw.map((item) => item?.slug).filter(Boolean)).size;
  };

  const readSeconds = () => {
    try {
      const value = Number.parseInt(localStorage.getItem(LS_SECONDS) || "0", 10);
      return Number.isFinite(value) && value > 0 ? value : 0;
    } catch {
      return 0;
    }
  };

  const readStreak = () => {
    const raw = readJson<{ count?: number }>(LS_STREAK);
    return Number(raw?.count) || 0;
  };

  const trackWaClick = (location: string) => {
    try {
      window.nmTrackEvent?.("unlock_whatsapp_click", { location, destination: "whatsapp" });
    } catch {
      /* ignore */
    }
  };

  const renderLiveCounter = (activeNow: number | null, mood: string, available = true) => {
    if (!available) {
      if (liveCounterCount instanceof HTMLElement) {
        liveCounterCount.textContent = unlockTone.liveCounter.unavailableCount;
      }
      if (liveCounterCopy instanceof HTMLElement) {
        liveCounterCopy.textContent = unlockTone.liveCounter.unavailableCopy;
      }
      if (liveCounterNote instanceof HTMLElement) {
        liveCounterNote.textContent = unlockTone.liveCounter.unavailableNote;
      }
      return;
    }

    const parsedCount = Number(activeNow);
    if (!Number.isFinite(parsedCount) || parsedCount < 0) {
      renderLiveCounter(null, mood, false);
      return;
    }

    const safeCount = Math.round(parsedCount);
    if (liveCounterCount instanceof HTMLElement) {
      liveCounterCount.textContent = String(safeCount);
    }
    if (liveCounterCopy instanceof HTMLElement) {
      liveCounterCopy.textContent =
        safeCount === 0
          ? unlockTone.liveCounter.zeroCopy
          : safeCount === 1
            ? unlockTone.liveCounter.oneCopy
            : `כרגע יש כאן ${safeCount} אנשים באתר. ${String(mood || unlockTone.liveCounter.manyFallbackMood)}`;
    }
    if (liveCounterNote instanceof HTMLElement) {
      liveCounterNote.textContent =
        safeCount === 0
          ? unlockTone.liveCounter.zeroNote
          : safeCount === 1
            ? unlockTone.liveCounter.oneNote
            : unlockTone.liveCounter.manyNote;
    }
  };

  const renderJoinState = (authorized: boolean) => {
    if (joinTitle instanceof HTMLElement) {
      joinTitle.textContent = authorized ? unlockTone.join.activeTitle : unlockTone.join.inactiveTitle;
    }
    if (joinLabel instanceof HTMLElement) {
      joinLabel.textContent = authorized ? unlockTone.join.activeLabel : unlockTone.join.inactiveLabel;
    }
    if (joinCopy instanceof HTMLElement) {
      joinCopy.textContent = authorized
        ? unlockTone.join.activeCopy
        : unlockTone.join.inactiveCopy();
    }
    if (joinDot instanceof HTMLElement) {
      joinDot.style.background = authorized ? "#4B6055" : "#D42B2B";
      joinDot.style.boxShadow = authorized
        ? "0 0 0 6px rgba(75,96,85,0.12)"
        : "0 0 0 6px rgba(212,43,43,0.12)";
    }
    if (joinOffer instanceof HTMLAnchorElement) {
      if (authorized) {
        joinOffer.href = "/me/";
        joinOffer.textContent = unlockTone.join.activeCta;
        joinOffer.removeAttribute("target");
        joinOffer.removeAttribute("rel");
      } else {
        joinOffer.href = config.joinOfferHref;
        joinOffer.textContent = unlockTone.join.inactiveCta();
        joinOffer.setAttribute("target", "_blank");
        joinOffer.setAttribute("rel", "noopener noreferrer");
      }
    }
  };

  const refreshPulse = async () => {
    try {
      const response = await fetch(config.pulseEndpoint, {
        headers: { accept: "application/json" },
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.ok) {
        renderLiveCounter(null, unlockTone.liveCounter.waiting, false);
        return;
      }
      if (payload.available === false) {
        renderLiveCounter(null, String(payload.mood || unlockTone.liveCounter.waiting), false);
        return;
      }
      renderLiveCounter(Number(payload.activeNow), String(payload.mood || ""), true);
    } catch {
      renderLiveCounter(null, unlockTone.liveCounter.waiting, false);
    }
  };

  const syncAuthorizedState = () => {
    const codeAccepted = hasAcceptedCode();
    const clubSession = readClubSession();
    const premiumSession = hasPremiumSession();
    const authorized = Boolean(clubSession) || premiumSession;
    const shouldCollectIdentity = codeAccepted && !authorized;

    shell?.setAttribute("data-authorized", authorized ? "true" : "false");
    logoutButton?.classList.toggle("hidden", !authorized);
    toggleIdentityPanel(shouldCollectIdentity);

    if (statSession instanceof HTMLElement) {
      statSession.textContent = authorized ? unlockTone.session.active : unlockTone.session.pending;
    }
    if (sessionBar instanceof HTMLElement) {
      sessionBar.style.width = authorized ? "88%" : "18%";
    }
    if (successLine instanceof HTMLElement) {
      if (authorized) {
        successLine.textContent = clubSession?.memberName
          ? unlockTone.session.activePersonalized(clubSession.memberName)
          : unlockTone.session.activeLine;
        successLine.classList.remove("hidden");
      } else if (shouldCollectIdentity) {
        successLine.textContent = unlockTone.session.codeAccepted;
        successLine.classList.remove("hidden");
      } else {
        successLine.classList.add("hidden");
      }
    }
    if (!shouldCollectIdentity && !authorized) {
      setIdentityMessage("");
    }

    renderJoinState(authorized);
    return authorized;
  };

  const syncStats = () => {
    const streak = readStreak();
    const seconds = readSeconds();
    const readCount = readOpenLogCount();

    if (statStreak instanceof HTMLElement) {
      statStreak.textContent = String(streak);
    }
    if (streakBar instanceof HTMLElement) {
      streakBar.style.width = `${Math.min(100, 8 + streak * 12)}%`;
    }
    if (statSeconds instanceof HTMLElement) {
      statSeconds.textContent = formatSeconds(seconds);
    }
    if (secondsBar instanceof HTMLElement) {
      secondsBar.style.width = `${Math.min(100, 8 + Math.round(seconds / 90))}%`;
    }
    if (articlesCard instanceof HTMLElement && readCount > 0) {
      articlesCard.textContent = String(readCount);
    }
  };

  document.querySelectorAll("[data-wa-link]").forEach((link, index) => {
    if (!(link instanceof HTMLAnchorElement)) return;
    if (!link.href || link.getAttribute("href") === "#") {
      link.href = config.whatsAppHref;
    }
    const onClick = () => trackWaClick(index === 0 ? "hero" : "page");
    link.addEventListener("click", onClick);
    cleanups.push(() => link.removeEventListener("click", onClick));
  });

  const onEnter = async () => {
    const code = String(input instanceof HTMLInputElement ? input.value : "").trim();
    if (!code) {
      errorLine?.classList.remove("hidden");
      successLine?.classList.add("hidden");
      setIdentityMessage("");
      return;
    }
    if (enterButton instanceof HTMLButtonElement) {
      enterButton.disabled = true;
    }
    const serverResult = await verifyCodeWithServer(code);
    const authorized = serverResult === true || (serverResult === null && explicitPublicMode);
    if (enterButton instanceof HTMLButtonElement) {
      enterButton.disabled = false;
    }
    if (authorized) {
      localStorage.setItem(storageKey, code);
      localStorage.setItem(verifiedCodeStorageKey, code);
      errorLine?.classList.add("hidden");
      if (input instanceof HTMLInputElement) {
        input.value = "";
      }
      setIdentityMessage("");
      syncAuthorizedState();
      return;
    }
    localStorage.removeItem(verifiedCodeStorageKey);
    errorLine?.classList.remove("hidden");
    successLine?.classList.add("hidden");
    toggleIdentityPanel(false);
    setIdentityMessage("");
  };

  if (enterButton instanceof HTMLButtonElement) {
    const onClick = () => {
      void onEnter();
    };
    enterButton.addEventListener("click", onClick);
    cleanups.push(() => enterButton.removeEventListener("click", onClick));
  }

  if (input instanceof HTMLInputElement) {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter") {
        event.preventDefault();
        void onEnter();
      }
    };
    input.addEventListener("keydown", onKeyDown);
    cleanups.push(() => input.removeEventListener("keydown", onKeyDown));
  }

  const submitIdentity = async () => {
    const code = String(localStorage.getItem(storageKey) || "").trim();
    const fullName = String(identityNameInput instanceof HTMLInputElement ? identityNameInput.value : "").trim();
    const phone = String(identityPhoneInput instanceof HTMLInputElement ? identityPhoneInput.value : "").replace(/\D/g, "");

    if (!code) {
      errorLine?.classList.remove("hidden");
      successLine?.classList.add("hidden");
      setIdentityMessage(unlockTone.session.missingPersonalCode, "error");
      return;
    }
    if (fullName.length < 2) {
      setIdentityMessage(unlockTone.session.missingName, "error");
      identityNameInput instanceof HTMLInputElement && identityNameInput.focus();
      return;
    }
    if (phone.length < 9) {
      setIdentityMessage(unlockTone.session.missingPhone, "error");
      identityPhoneInput instanceof HTMLInputElement && identityPhoneInput.focus();
      return;
    }

    if (identitySubmitButton instanceof HTMLButtonElement) {
      identitySubmitButton.disabled = true;
    }
    setIdentityMessage(unlockTone.session.saving);

    try {
      const response = await fetch(config.sharedAccessSessionEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          code,
          fullName,
          phone,
          path: window.location.pathname,
        }),
        cache: "no-store",
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || payload?.ok !== true) {
        throw new Error(String(payload?.error || "shared_access_failed"));
      }

      const saved = saveSharedSession(payload as Record<string, unknown>);
      if (!saved) {
        throw new Error("shared_access_save_failed");
      }

      localStorage.removeItem(premiumSessionStorageKey);
      setIdentityMessage(unlockTone.session.saved(saved.memberName), "success");
      errorLine?.classList.add("hidden");
      syncAuthorizedState();
    } catch {
      setIdentityMessage(unlockTone.session.saveFailed, "error");
    } finally {
      if (identitySubmitButton instanceof HTMLButtonElement) {
        identitySubmitButton.disabled = false;
      }
    }
  };

  if (identitySubmitButton instanceof HTMLButtonElement) {
    const onClick = () => {
      void submitIdentity();
    };
    identitySubmitButton.addEventListener("click", onClick);
    cleanups.push(() => identitySubmitButton.removeEventListener("click", onClick));
  }

  [identityNameInput, identityPhoneInput].forEach((field) => {
    if (!(field instanceof HTMLInputElement)) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter") {
        event.preventDefault();
        void submitIdentity();
      }
    };
    field.addEventListener("keydown", onKeyDown);
    cleanups.push(() => field.removeEventListener("keydown", onKeyDown));
  });

  if (logoutButton instanceof HTMLElement) {
    const onLogout = () => {
      localStorage.removeItem(storageKey);
      localStorage.removeItem(verifiedCodeStorageKey);
      localStorage.removeItem(premiumSessionStorageKey);
      localStorage.removeItem(clubSessionStorageKey);
      toggleIdentityPanel(false);
      setIdentityMessage("");
      syncAuthorizedState();
      window.dispatchEvent(new CustomEvent("nm-club-session-changed"));
    };
    logoutButton.addEventListener("click", onLogout);
    cleanups.push(() => logoutButton.removeEventListener("click", onLogout));
  }

  const intervalId = window.setInterval(() => {
    void refreshPulse();
  }, 45000);
  cleanups.push(() => window.clearInterval(intervalId));

  const onStorage = () => {
    syncStats();
    syncAuthorizedState();
    void refreshPulse();
  };
  window.addEventListener("storage", onStorage);
  cleanups.push(() => window.removeEventListener("storage", onStorage));

  const onClubSessionChanged = () => {
    syncStats();
    syncAuthorizedState();
    void refreshPulse();
  };
  window.addEventListener("nm-club-session-changed", onClubSessionChanged);
  cleanups.push(() => window.removeEventListener("nm-club-session-changed", onClubSessionChanged));

  syncStats();
  syncAuthorizedState();
  void refreshPulse();

  window.__nmUnlockCleanup = () => {
    cleanups.splice(0).forEach((cleanup) => cleanup());
  };
}

document.addEventListener("astro:page-load", initUnlockPage);
initUnlockPage();
