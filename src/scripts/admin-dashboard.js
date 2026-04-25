import {
  bindAdminDraftPersistence,
  buildAdminApiUrl,
  buildAdminAuthHeaders,
  isClubAdminViaProxy,
} from "./admin-session.js";

const formatDateTime = (value) => {
  const date = new Date(value || "");
  if (Number.isNaN(date.getTime())) return "לא זמין";
  return date.toLocaleString("he-IL", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const normalizeMemberSearch = (value) => String(value ?? "").replace(/\D/g, "");

const publishOverview = (payload) => {
  if (typeof window === "undefined") return;
  window.__NM_ADMIN_OVERVIEW__ = payload ?? null;
  window.dispatchEvent(new CustomEvent("nm-admin-overview", { detail: payload ?? null }));
};

const formatMemberStatus = (member) => {
  if (!member) return "לא ידוע";
  if (member.isActive) return "פעיל";
  if (member.status === "blocked") return "חסום";
  if (member.status === "paused") return "מושהה";
  return "לא פעיל";
};

const formatAccessSource = (item) => {
  if (String(item?.source || "").toUpperCase() === "SHARED") return "Shared Code";
  return "Password Member";
};

const formatAccessStatus = (item) => {
  if (String(item?.activeNow || "").toLowerCase() === "true") return "מחובר עכשיו";
  return "נראה לאחרונה";
};

const renderItems = (root, items, renderItem, emptyMessage) => {
  if (!(root instanceof HTMLElement)) return;
  root.innerHTML = "";
  if (!items.length) {
    const empty = document.createElement("li");
    empty.className =
      "rounded-[1.2rem] border border-[color-mix(in_srgb,var(--nm-fg)_10%,transparent)] bg-[var(--nm-surface-muted)] px-4 py-3 text-sm leading-7 text-[color-mix(in_srgb,var(--nm-fg)_62%,var(--nm-bg))]";
    empty.textContent = emptyMessage;
    root.appendChild(empty);
    return;
  }
  items.forEach((item) => root.appendChild(renderItem(item)));
};

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

const createRow = (html, tone = "white") => {
  const row = document.createElement("li");
  row.className =
    tone === "tint"
      ? "rounded-[1.2rem] border border-[color-mix(in_srgb,#0F172A_22%,transparent)] bg-[var(--nm-tint)] px-4 py-3"
      : "rounded-[1.2rem] border border-[color-mix(in_srgb,var(--nm-fg)_10%,transparent)] bg-white/90 px-4 py-3";
  row.innerHTML = html;
  return row;
};

const pruneAdminPanels = (root) => {
  if (!(root instanceof HTMLElement)) return;

  ['deep', 'last-integrity'].forEach((key) => {
    const stat = root.querySelector(`[data-admin-stat="${key}"]`);
    const card = stat instanceof HTMLElement ? stat.closest("article") : null;
    if (card instanceof HTMLElement) {
      card.remove();
    }
  });

  root.querySelectorAll("h4").forEach((heading) => {
    if (!(heading instanceof HTMLElement)) return;
    if (!String(heading.textContent || "").includes("איך זה עובד")) return;
    const section = heading.closest("section");
    if (section instanceof HTMLElement) {
      section.remove();
    }
  });
};

const initAdminDashboard = () => {
  window.__nmAdminDashboardCleanup?.();

  const root = document.querySelector("[data-club-admin-root]");
  if (!(root instanceof HTMLElement)) return;

  const overviewEndpoint = buildAdminApiUrl("/admin/overview");
  const resetEndpoint = buildAdminApiUrl("/admin/reset-password");
  const addMemberEndpoint = buildAdminApiUrl("/admin/add-member");
  const memberEndpoint = buildAdminApiUrl("/admin/member");

  const loadingEl = root.querySelector("[data-admin-loading]");
  const errorEl = root.querySelector("[data-admin-error]");
  const contentEl = root.querySelector("[data-admin-content]");
  const accessRowsEl = root.querySelector("[data-admin-access-rows]");
  const accessEmptyEl = root.querySelector("[data-admin-access-empty]");
  const accessCountEl = root.querySelector("[data-admin-access-count]");
  const recentLoginsEl = root.querySelector("[data-admin-recent-logins]");
  const fraudFlagsEl = root.querySelector("[data-admin-fraud-flags]");
  const pageBeaconsEl = root.querySelector("[data-admin-page-beacons]");
  const integrityReportsEl = root.querySelector("[data-admin-integrity-reports]");
  const summaryMembers = root.querySelector('[data-admin-stat="members"]');
  const summaryRecent = root.querySelector('[data-admin-stat="recent"]');
  const summaryFlags = root.querySelector('[data-admin-stat="flags"]');
  const summaryDeep = root.querySelector('[data-admin-stat="deep"]');
  const summaryIntegrity = root.querySelector('[data-admin-stat="integrity"]');
  const summaryLastIntegrity = root.querySelector('[data-admin-stat="last-integrity"]');
  const resetForm = root.querySelector("[data-admin-reset-form]");
  const resetStatus = root.querySelector("[data-admin-reset-status]");
  const addMemberForm = root.querySelector("[data-admin-add-member-form]");
  const addMemberStatus = root.querySelector("[data-admin-add-member-status]");
  const memberSearchInput = root.querySelector("[data-admin-member-search]");
  const memberResultsEl = root.querySelector("[data-admin-member-results]");
  const memberEmptyEl = root.querySelector("[data-admin-member-empty]");
  const memberCardEl = root.querySelector("[data-admin-member-card]");
  const memberTimelineEl = root.querySelector("[data-admin-member-timeline]");
  const fillResetButton = root.querySelector("[data-admin-fill-reset]");
  const memberViewLink = root.querySelector("[data-admin-view-member]");
  const unlockViewLink = root.querySelector("[data-admin-view-unlock]");
  const shareMessageField = root.querySelector("[data-admin-share-message]");
  const shareStatus = root.querySelector("[data-admin-share-status]");
  const copyShareButton = root.querySelector("[data-admin-copy-share]");
  const copyLoginLinkButton = root.querySelector("[data-admin-copy-login-link]");
  const confirmDialog = root.querySelector("[data-admin-reset-dialog]");
  const confirmText = confirmDialog?.querySelector("[data-admin-reset-confirm-text]");
  const confirmApprove = confirmDialog?.querySelector("[data-admin-reset-approve]");
  const confirmCancelButtons = Array.from(root.querySelectorAll("[data-admin-reset-cancel]"));

  const viaProxy = isClubAdminViaProxy();
  if (!viaProxy) {
    if (errorEl instanceof HTMLElement) {
      errorEl.textContent =
        "הניהול הזה עובד רק דרך Cloudflare Access ופרוקסי השרת.";
      errorEl.classList.remove("hidden");
    }
    if (loadingEl instanceof HTMLElement) loadingEl.classList.add("hidden");
    return;
  }

  if (!overviewEndpoint || !memberEndpoint || !resetEndpoint || !addMemberEndpoint) {
    if (errorEl instanceof HTMLElement) {
      errorEl.textContent = "חסרה כתובת API לניהול המועדון. בדוק את הגדרות הפרוקסי והחיבור ל-worker.";
      errorEl.classList.remove("hidden");
    }
    if (loadingEl instanceof HTMLElement) loadingEl.classList.add("hidden");
    return;
  }

  let pendingReset = null;
  let memberSummaries = [];
  let selectedMemberPhone = normalizeMemberSearch(new URL(window.location.href).searchParams.get("phone") || "");
  const cleanups = [];
  const loginUrl = new URL("/me/unlock/", window.location.origin).toString();

  pruneAdminPanels(root);

  const setShareStatus = (message) => {
    if (!(shareStatus instanceof HTMLElement)) return;
    shareStatus.textContent = message;
  };

  const setShareMessage = (message, statusMessage = "") => {
    if (shareMessageField instanceof HTMLTextAreaElement) {
      shareMessageField.value = message;
    }
    if (statusMessage) {
      setShareStatus(statusMessage);
    }
  };

  const buildMemberShareMessage = ({ phone, password, fullName, mode = "created" }) => {
    const nameLine = fullName ? `היי ${fullName},\n` : "היי,\n";
    const intro = mode === "reset" ? "עדכנתי לך עכשיו את הגישה ל-NeverMind." : "פתחתי לך עכשיו גישה ל-NeverMind.";
    return `${nameLine}${intro}\nשם משתמש: ${phone}\nסיסמה: ${password}\nכניסה: ${loginUrl}\nאחרי הכניסה ייפתחו כל התכנים והמאמרים של חברי המועדון.`;
  };

  const showError = (message) => {
    if (!(errorEl instanceof HTMLElement)) return;
    errorEl.textContent = message;
    errorEl.classList.remove("hidden");
  };

  const clearError = () => {
    if (!(errorEl instanceof HTMLElement)) return;
    errorEl.textContent = "";
    errorEl.classList.add("hidden");
  };

  const setLoading = (active, message) => {
    if (loadingEl instanceof HTMLElement) {
      loadingEl.textContent = message || "טוען נתוני מועדון...";
      loadingEl.classList.toggle("hidden", !active);
    }
    if (contentEl instanceof HTMLElement) {
      contentEl.classList.toggle("hidden", active);
    }
  };

const handleUnauthorized = () => {
    showError(
      "השרת חסם את בקשת הניהול. בדוק ש-Cloudflare Access מגן גם על /dashboard/*, גם על /dashboard/api/*, וגם על /api/club-admin/*. אם הוגדרו מיילים מורשים ב-NM_ADMIN_ACCESS_EMAILS או ADMIN_ACCESS_EMAILS, ודא שגם bigcohen2000@gmail.com נמצא שם."
    );
    setLoading(false);
  };

  const closeDialog = () => {
    if (confirmDialog instanceof HTMLDialogElement && confirmDialog.open) {
      confirmDialog.close();
    }
    pendingReset = null;
  };

  const renderMemberSearchResults = (query = "") => {
    const rawQuery = String(query ?? "").trim();
    const normalizedDigits = normalizeMemberSearch(rawQuery);
    const matches = memberSummaries
      .filter((member) => {
        if (!rawQuery) return true;
        const haystack = `${member.phone} ${member.memberName}`.toLowerCase();
        return haystack.includes(rawQuery.toLowerCase()) || (normalizedDigits && member.phone.includes(normalizedDigits));
      })
      .slice(0, rawQuery ? 8 : 6);

    if (memberEmptyEl instanceof HTMLElement) {
      memberEmptyEl.classList.toggle("hidden", matches.length > 0);
      memberEmptyEl.textContent = rawQuery
        ? "לא מצאנו חבר שמתאים לחיפוש הזה."
        : "אפשר להתחיל לכתוב טלפון או שם, או לבחור מהרשימה האחרונה.";
    }

    renderItems(
      memberResultsEl,
      matches,
      (member) => {
        const row = createRow(`
          <div class="flex items-start justify-between gap-3">
            <div class="space-y-1 text-right">
              <p class="text-sm font-semibold text-[var(--nm-fg)]">${escapeHtml(member.memberName || "חבר")}</p>
              <p class="text-xs leading-6 text-[color-mix(in_srgb,var(--nm-fg)_58%,var(--nm-bg))]">${escapeHtml(member.phone)}</p>
            </div>
            <span class="rounded-full border border-[color-mix(in_srgb,var(--nm-fg)_10%,transparent)] px-3 py-1 text-xs font-semibold text-[var(--nm-fg)]">${escapeHtml(formatMemberStatus(member))}</span>
          </div>
        `);
        row.classList.add("cursor-pointer");
        row.addEventListener("click", () => {
          void loadMemberDetail(member.phone);
        });
        return row;
      },
      rawQuery ? "לא מצאנו חבר מתאים." : "רשימת החברים תופיע כאן."
    );
  };

  const renderMemberCard = (payload) => {
    const member = payload?.member;
    if (!(memberCardEl instanceof HTMLElement) || !member) return;

    memberCardEl.innerHTML = `
      <div class="space-y-2 text-right">
        <p class="text-lg font-semibold text-[var(--nm-fg)]">${escapeHtml(member.memberName || "חבר")}</p>
        <p class="text-sm leading-7 text-[color-mix(in_srgb,var(--nm-fg)_64%,var(--nm-bg))]">${escapeHtml(member.phone)} · ${escapeHtml(formatMemberStatus(member))}</p>
        <p class="text-xs leading-6 text-[color-mix(in_srgb,var(--nm-fg)_54%,var(--nm-bg))]">גישה עד ${escapeHtml(member.expiresAt ? formatDateTime(member.expiresAt) : "לא ידוע")}</p>
        <p class="text-xs leading-6 text-[color-mix(in_srgb,var(--nm-fg)_54%,var(--nm-bg))]">כניסה אחרונה ${escapeHtml(member.lastLoginAt ? formatDateTime(member.lastLoginAt) : "לא ידוע")}</p>
      </div>
    `;

    if (memberViewLink instanceof HTMLAnchorElement) {
      memberViewLink.href = `/me/?previewPhone=${encodeURIComponent(member.phone || "")}`;
    }
    if (unlockViewLink instanceof HTMLAnchorElement) {
      unlockViewLink.href = `/me/unlock/?previewPhone=${encodeURIComponent(member.phone || "")}`;
    }
  };

  const loadMemberDetail = async (phone) => {
    const normalizedPhone = String(phone || "").trim();
    if (!normalizedPhone) return;
    selectedMemberPhone = normalizedPhone;
    if (memberCardEl instanceof HTMLElement) {
      memberCardEl.textContent = "טוען כרטיס חבר...";
    }

    try {
      const response = await fetch(`${memberEndpoint}?phone=${encodeURIComponent(normalizedPhone)}`, {
        headers: buildAdminAuthHeaders({ Accept: "application/json" }),
      });
      const payload = await response.json().catch(() => null);

      if (response.status === 401 || response.status === 403) {
        handleUnauthorized();
        return;
      }
      if (!response.ok || !payload || payload.ok !== true) {
        showError(payload?.error ? String(payload.error) : "לא הצלחנו לטעון את פרטי החבר.");
        return;
      }

      renderMemberCard(payload);
      renderItems(
        memberTimelineEl,
        Array.isArray(payload.timeline) ? payload.timeline : [],
        (item) =>
          createRow(`
            <p class="text-sm font-semibold text-[var(--nm-fg)]">${escapeHtml(item.title || "פעילות")}</p>
            <p class="mt-1 text-xs leading-6 text-[color-mix(in_srgb,var(--nm-fg)_65%,var(--nm-bg))]">${escapeHtml(formatDateTime(item.at))}</p>
            <p class="mt-1 text-xs leading-6 text-[color-mix(in_srgb,var(--nm-fg)_56%,var(--nm-bg))]">${escapeHtml(item.detail || "")}</p>
          `, item.kind === "flag" ? "tint" : "white"),
        "עדיין אין פעילות מתועדת לחבר הזה."
      );

      if (memberSearchInput instanceof HTMLInputElement) {
        memberSearchInput.value = normalizedPhone;
      }
    } catch {
      showError("לא הצלחנו לטעון את ציר הפעילות של החבר.");
    }
  };

  const openDialog = () => {
    if (!(confirmDialog instanceof HTMLDialogElement)) return;
    confirmDialog.showModal();
    window.setTimeout(() => {
      navigator.vibrate?.(10);
    }, 140);
  };

  const renderOverview = (payload) => {
    publishOverview(payload);

    const stats = payload?.stats || {};
    memberSummaries = Array.isArray(payload?.members) ? payload.members : [];
    const recentLogins = Array.isArray(payload?.recentLogins) ? payload.recentLogins : [];
    const fraudFlags = Array.isArray(payload?.fraudFlags) ? payload.fraudFlags : [];
    const pageViewBeacons = Array.isArray(payload?.pageViewBeacons) ? payload.pageViewBeacons : [];
    const integrityReports = Array.isArray(payload?.integrityReports) ? payload.integrityReports : [];

    if (summaryMembers instanceof HTMLElement) summaryMembers.textContent = String(stats.members ?? 0);
    if (summaryRecent instanceof HTMLElement) summaryRecent.textContent = String(stats.recentLogins ?? recentLogins.length);
    if (summaryFlags instanceof HTMLElement) summaryFlags.textContent = String(stats.flaggedMembers ?? fraudFlags.length);
    if (summaryDeep instanceof HTMLElement) summaryDeep.textContent = String(stats.pageViewBeacons ?? pageViewBeacons.length ?? 0);
    if (summaryIntegrity instanceof HTMLElement) summaryIntegrity.textContent = String(stats.integrityReports ?? integrityReports.length ?? 0);
    if (summaryLastIntegrity instanceof HTMLElement) {
      summaryLastIntegrity.textContent = stats.lastIntegrityAt ? formatDateTime(stats.lastIntegrityAt) : "לא זמין";
    }

    if (accessCountEl instanceof HTMLElement) {
      accessCountEl.textContent = `${recentLogins.length} רשומות`;
    }
    if (accessRowsEl instanceof HTMLElement) {
      accessRowsEl.innerHTML = "";
      recentLogins.forEach((item) => {
        const row = document.createElement("tr");
        row.className = "align-top";
        row.innerHTML = `
          <td class="px-4 py-3 font-semibold text-[var(--nm-fg)]">${escapeHtml(item.memberName || "ללא שם")}</td>
          <td class="px-4 py-3 text-[color-mix(in_srgb,var(--nm-fg)_72%,var(--nm-bg))]">${escapeHtml(item.phone || "ללא טלפון")}</td>
          <td class="px-4 py-3">
            <span class="inline-flex rounded-full border border-[color-mix(in_srgb,var(--nm-fg)_10%,transparent)] bg-[var(--nm-surface-muted)] px-2.5 py-1 text-[11px] font-semibold text-[var(--nm-fg)]">${escapeHtml(formatAccessSource(item))}</span>
          </td>
          <td class="px-4 py-3">
            <span class="inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              String(item?.activeNow || "").toLowerCase() === "true"
                ? "bg-[color-mix(in_srgb,var(--nm-accent)_12%,transparent)] text-[var(--nm-accent)]"
                : "bg-[var(--nm-surface-muted)] text-[var(--nm-fg)]"
            }">${escapeHtml(formatAccessStatus(item))}</span>
          </td>
          <td class="px-4 py-3 text-[color-mix(in_srgb,var(--nm-fg)_72%,var(--nm-bg))]">${escapeHtml(formatDateTime(item.seenAt))}</td>
          <td class="px-4 py-3 text-[color-mix(in_srgb,var(--nm-fg)_72%,var(--nm-bg))]">${escapeHtml(item.path || "/")}</td>
        `;
        accessRowsEl.appendChild(row);
      });
    }
    if (accessEmptyEl instanceof HTMLElement) {
      accessEmptyEl.classList.toggle("hidden", recentLogins.length > 0);
    }

    renderItems(
      integrityReportsEl,
      integrityReports,
      (item) =>
        createRow(`
          <p class="text-sm font-semibold text-[var(--nm-fg)]">${escapeHtml(item.pageTitle || item.pagePath || item.pageUrl || "עמוד ללא כותרת")}</p>
          <p class="mt-1 text-xs leading-6 text-[color-mix(in_srgb,var(--nm-fg)_65%,var(--nm-bg))]">${escapeHtml(formatDateTime(item.reportedAt))} &middot; ${escapeHtml(item.pagePath || item.pageUrl || "/")}</p>
          <p class="mt-2 text-xs leading-6 text-[color-mix(in_srgb,var(--nm-fg)_58%,var(--nm-bg))]">${escapeHtml(item.selectedText || item.note || item.message || "הערה כללית ללא טקסט מסומן")}</p>
          <p class="mt-1 text-[11px] leading-6 text-[color-mix(in_srgb,var(--nm-fg)_48%,var(--nm-bg))]">${escapeHtml(item.reporterFingerprint || "ללא מזהה")}</p>
        `),
      "עדיין אין הערות מהאתר. ברגע שמבקר ישלח תיקון מתוך עמוד, הוא יופיע כאן."
    );

    renderItems(
      recentLoginsEl,
      recentLogins,
      (item) =>
        createRow(`
          <p class="text-sm font-semibold text-[var(--nm-fg)]">${escapeHtml(item.memberName ? `${item.memberName} · ${item.phone || "ללא טלפון"}` : item.phone || "ללא טלפון")}</p>
          <p class="mt-1 text-xs leading-6 text-[color-mix(in_srgb,var(--nm-fg)_65%,var(--nm-bg))]">${escapeHtml(formatDateTime(item.seenAt))} · ${escapeHtml(item.path || "/")}</p>
          <p class="mt-1 text-xs leading-6 text-[color-mix(in_srgb,var(--nm-fg)_52%,var(--nm-bg))]">${escapeHtml(item.ipFingerprint || "ללא מזהה")} &middot; ${escapeHtml(item.userAgent || "ללא דפדפן")}</p>
        `),
      "עדיין אין כניסות מתועדות בחלון האחרון."
    );

    renderItems(
      fraudFlagsEl,
      fraudFlags,
      (item) =>
        createRow(
          `
            <p class="text-sm font-semibold text-[var(--nm-fg)]">${escapeHtml(item.memberName ? `${item.memberName} · ${item.phone || "ללא טלפון"}` : item.phone || "ללא טלפון")}</p>
            <p class="mt-1 text-xs leading-6 text-[color-mix(in_srgb,var(--nm-fg)_65%,var(--nm-bg))]">סומן ב-${escapeHtml(formatDateTime(item.flaggedAt))}</p>
            <p class="mt-1 text-xs leading-6 text-[color-mix(in_srgb,var(--nm-fg)_52%,var(--nm-bg))]">${escapeHtml(item.memberIpCount || 0)} מזהי IP לחבר &middot; ${escapeHtml(item.passwordIpCount || 0)} מזהי IP לסיסמה</p>
          `,
          "tint"
        ),
      "כרגע אין התראות חריגות פתוחות."
    );

    renderItems(
      pageBeaconsEl,
      pageViewBeacons,
      (item) =>
        createRow(`
          <p class="text-sm font-semibold text-[var(--nm-fg)]">${escapeHtml(item.path || "/")}</p>
          <p class="mt-1 text-xs leading-6 text-[color-mix(in_srgb,var(--nm-fg)_65%,var(--nm-bg))]">${escapeHtml(formatDateTime(item.seenAt))}</p>
          <p class="mt-1 text-xs leading-6 text-[color-mix(in_srgb,var(--nm-fg)_52%,var(--nm-bg))]">${escapeHtml(item.ipFingerprint || "ללא מזהה")}</p>
        `),
      "עדיין אין תצפיות תוכן. אחרי כניסה של חבר ופתיחת מאמר תחת /articles/ יופיעו כאן שורות חדשות."
    );

    if (memberSearchInput instanceof HTMLInputElement && selectedMemberPhone && !memberSearchInput.value) {
      memberSearchInput.value = selectedMemberPhone;
    }

    renderMemberSearchResults(memberSearchInput instanceof HTMLInputElement ? memberSearchInput.value : "");
    if (selectedMemberPhone) {
      void loadMemberDetail(selectedMemberPhone);
    } else if (memberSummaries[0]?.phone) {
      void loadMemberDetail(memberSummaries[0].phone);
    }
  };

  const loadOverview = async () => {
    clearError();
    setLoading(true, "מזקק את נתוני המועדון...");
    try {
      const response = await fetch(overviewEndpoint, {
        headers: buildAdminAuthHeaders({ Accept: "application/json" }),
      });
      const payload = await response.json().catch(() => null);

      if (response.status === 401 || response.status === 403) {
        handleUnauthorized();
        return;
      }
      if (response.status === 429) {
        showError(payload?.error ? String(payload.error) : "יותר מדי בקשות. נסה שוב בעוד רגע.");
        setLoading(false);
        return;
      }
      if (!response.ok || !payload || payload.ok !== true) {
        showError(payload?.error ? String(payload.error) : "השרת לא החזיר נתוני ניהול.");
        setLoading(false);
        return;
      }

      renderOverview(payload);
      setLoading(false);
    } catch {
      showError("השרת לא ענה. אפשר לרענן ולנסות שוב.");
      setLoading(false);
    }
  };

  if (resetForm instanceof HTMLFormElement) {
    cleanups.push(
      bindAdminDraftPersistence(resetForm, {
        storageKey: "nm-admin-reset-draft",
        fields: ["phone"],
      })
    );

    const onSubmit = (event) => {
      event.preventDefault();
      clearError();
      const formData = new FormData(resetForm);
      const phone = String(formData.get("phone") ?? "").trim();
      const newPassword = String(formData.get("newPassword") ?? "").trim();
      if (!phone || !newPassword) {
        showError("צריך טלפון וסיסמה חדשה.");
        return;
      }
      pendingReset = { phone, newPassword };
      if (confirmText instanceof HTMLElement) {
        confirmText.textContent = `האם לאפס עכשיו את הסיסמה של ${phone}`;
      }
      openDialog();
    };

    resetForm.addEventListener("submit", onSubmit);
    cleanups.push(() => resetForm.removeEventListener("submit", onSubmit));
  }

  if (memberSearchInput instanceof HTMLInputElement) {
    const onMemberSearchInput = () => {
      renderMemberSearchResults(memberSearchInput.value);
    };
    memberSearchInput.addEventListener("input", onMemberSearchInput);
    cleanups.push(() => memberSearchInput.removeEventListener("input", onMemberSearchInput));
  }

  if (fillResetButton instanceof HTMLButtonElement) {
    const onFillReset = () => {
      if (!(resetForm instanceof HTMLFormElement) || !selectedMemberPhone) return;
      const phoneField = resetForm.elements.namedItem("phone");
      if (phoneField instanceof HTMLInputElement) {
        phoneField.value = selectedMemberPhone;
        phoneField.focus();
        phoneField.select();
      }
      if (resetStatus instanceof HTMLElement) {
        resetStatus.textContent = `הטלפון ${selectedMemberPhone} הועבר לטופס האיפוס.`;
      }
    };
    fillResetButton.addEventListener("click", onFillReset);
    cleanups.push(() => fillResetButton.removeEventListener("click", onFillReset));
  }

  if (addMemberForm instanceof HTMLFormElement) {
    const submitBtn = addMemberForm.querySelector('button[type="submit"]');
    const getStatusEl = () => (addMemberStatus instanceof HTMLElement ? addMemberStatus : null);

    const setStatus = (message) => {
      const el = getStatusEl();
      if (!el) return;
      el.textContent = message;
    };

    const onSubmit = async (event) => {
      event.preventDefault();
      clearError();

      const fd = new FormData(addMemberForm);
      const phone = String(fd.get("phone") ?? "").trim();
      const password = String(fd.get("password") ?? "").trim();
      const fullName = String(fd.get("fullName") ?? "").trim();
      const statusEl = getStatusEl();
      if (!statusEl) return;

      if (!phone || !password) {
        setStatus("צריך טלפון וסיסמה.");
        return;
      }

      const loadingText = "מוסיף חבר...";
      setStatus(loadingText);

      if (submitBtn instanceof HTMLButtonElement) {
        submitBtn.disabled = true;
        window.__nmSetButtonLoading?.(submitBtn, loadingText);
      }

      try {
        const response = await fetch(addMemberEndpoint, {
          method: "POST",
          headers: buildAdminAuthHeaders({
            "Content-Type": "application/json",
            Accept: "application/json",
          }),
          body: JSON.stringify({ phone, password, fullName }),
        });

        const payload = await response.json().catch(() => null);

        if (response.status === 401 || response.status === 403) {
          handleUnauthorized();
          return;
        }
        if (response.status === 429) {
          setStatus(payload?.error ? String(payload.error) : "יותר מדי בקשות. נסה שוב בעוד רגע.");
          return;
        }
        if (!response.ok || !payload || payload.ok !== true) {
          setStatus(payload?.error ? String(payload.error) : "השרת לא אישר את הבקשה.");
          return;
        }

        setStatus(`נוסף חבר: ${payload.phone}`);
        setShareMessage(
          buildMemberShareMessage({
            phone: payload.phone || phone,
            password,
            fullName,
            mode: "created",
          }),
          "נוצרה הודעה מוכנה להעתקה."
        );
        addMemberForm.reset();
        await loadOverview();
      } catch {
        setStatus("השרת לא ענה. נסה שוב.");
      } finally {
        if (submitBtn instanceof HTMLButtonElement) {
          submitBtn.disabled = false;
          window.__nmClearButtonLoading?.(submitBtn);
        }
      }
    };

    addMemberForm.addEventListener("submit", onSubmit);
    cleanups.push(() => addMemberForm.removeEventListener("submit", onSubmit));
  }

  if (copyShareButton instanceof HTMLButtonElement) {
    const onCopyShare = async () => {
      if (!(shareMessageField instanceof HTMLTextAreaElement) || !shareMessageField.value.trim()) {
        setShareStatus("עוד אין הודעה מוכנה להעתקה.");
        return;
      }
      try {
        await navigator.clipboard.writeText(shareMessageField.value);
        setShareStatus("ההודעה הועתקה.");
      } catch {
        shareMessageField.focus();
        shareMessageField.select();
        setShareStatus("לא הצלחנו להעתיק אוטומטית. סימנו את הטקסט כדי שתוכל להעתיק.");
      }
    };
    copyShareButton.addEventListener("click", onCopyShare);
    cleanups.push(() => copyShareButton.removeEventListener("click", onCopyShare));
  }

  if (copyLoginLinkButton instanceof HTMLButtonElement) {
    const onCopyLoginLink = async () => {
      try {
        await navigator.clipboard.writeText(loginUrl);
        setShareStatus("קישור הכניסה הועתק.");
      } catch {
        setShareStatus("לא הצלחנו להעתיק את הקישור אוטומטית.");
      }
    };
    copyLoginLinkButton.addEventListener("click", onCopyLoginLink);
    cleanups.push(() => copyLoginLinkButton.removeEventListener("click", onCopyLoginLink));
  }

  confirmCancelButtons.forEach((button) => {
    const onCancel = () => closeDialog();
    button.addEventListener("click", onCancel);
    cleanups.push(() => button.removeEventListener("click", onCancel));
  });

  if (confirmApprove instanceof HTMLButtonElement) {
    const onApprove = async () => {
      if (!pendingReset) return;
      confirmApprove.disabled = true;
      window.__nmSetButtonLoading?.(confirmApprove, "מעדכן סיסמה...");
      try {
        const response = await fetch(resetEndpoint, {
          method: "POST",
          headers: buildAdminAuthHeaders({
            "Content-Type": "application/json",
            Accept: "application/json",
          }),
          body: JSON.stringify(pendingReset),
        });
        const payload = await response.json().catch(() => null);
        if (response.status === 401 || response.status === 403) {
          handleUnauthorized();
          return;
        }
        if (response.status === 429) {
          showError(payload?.error ? String(payload.error) : "יותר מדי בקשות. נסה שוב בעוד רגע.");
          return;
        }
        if (!response.ok || !payload || payload.ok !== true) {
          showError(payload?.error ? String(payload.error) : "השרת לא עדכן את הסיסמה.");
          return;
        }
        if (resetStatus instanceof HTMLElement) {
          resetStatus.textContent = `הסיסמה של ${pendingReset.phone} עודכנה ב-${formatDateTime(payload.updatedAt)}`;
        }
        setShareMessage(
          buildMemberShareMessage({
            phone: pendingReset.phone,
            password: pendingReset.newPassword,
            fullName: "",
            mode: "reset",
          }),
          "הודעת האיפוס מוכנה להעתקה."
        );
        if (resetForm instanceof HTMLFormElement) {
          const passwordField = resetForm.elements.namedItem("newPassword");
          if (passwordField instanceof HTMLInputElement) {
            passwordField.value = "";
          }
        }
        closeDialog();
        window.__nmHapticSuccess?.();
        await loadOverview();
      } catch {
        showError("השרת לא ענה. אפשר לנסות שוב.");
      } finally {
        confirmApprove.disabled = false;
        window.__nmClearButtonLoading?.(confirmApprove);
      }
    };

    confirmApprove.addEventListener("click", onApprove);
    cleanups.push(() => confirmApprove.removeEventListener("click", onApprove));
  }

  loadOverview();

  window.__nmAdminDashboardCleanup = () => {
    publishOverview(null);
    cleanups.forEach((cleanup) => cleanup());
  };
};

document.addEventListener("astro:page-load", initAdminDashboard);
initAdminDashboard();

