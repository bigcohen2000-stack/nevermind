import {
  bindAdminDraftPersistence,
  buildAdminApiUrl,
  buildAdminAuthHeaders,
  isClubAdminViaProxy,
} from "./admin-session.js";

const formatDateTime = (value) => {
  const date = new Date(value || "");
  if (Number.isNaN(date.getTime())) return "׳׳ ׳–׳׳™׳";
  return date.toLocaleString("he-IL", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const normalizeMemberSearch = (value) => String(value ?? "").replace(/\D/g, "");

const formatMemberStatus = (member) => {
  if (!member) return "׳׳ ׳™׳“׳•׳¢";
  if (member.isActive) return "׳₪׳¢׳™׳";
  if (member.status === "blocked") return "׳—׳¡׳•׳";
  if (member.status === "paused") return "׳׳•׳©׳”׳”";
  return "׳׳ ׳₪׳¢׳™׳";
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
        "׳”׳ ׳™׳”׳•׳ ׳”׳–׳” ׳¢׳•׳‘׳“ ׳¨׳§ ׳“׳¨׳ Cloudflare Access ׳•׳₪׳¨׳•׳§׳¡׳™ ׳”׳©׳¨׳×.";
      errorEl.classList.remove("hidden");
    }
    if (loadingEl instanceof HTMLElement) loadingEl.classList.add("hidden");
    return;
  }

  if (!overviewEndpoint || !memberEndpoint || !resetEndpoint || !addMemberEndpoint) {
    if (errorEl instanceof HTMLElement) {
      errorEl.textContent = "׳—׳¡׳¨׳” ׳›׳×׳•׳‘׳× API ׳׳ ׳™׳”׳•׳ ׳”׳׳•׳¢׳“׳•׳. ׳‘׳“׳•׳§ ׳׳× ׳”׳’׳“׳¨׳•׳× ׳”׳₪׳¨׳•׳§׳¡׳™ ׳•׳”׳—׳™׳‘׳•׳¨ ׳-worker.";
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
    const nameLine = fullName ? `׳”׳™׳™ ${fullName},\n` : "׳”׳™׳™,\n";
    const intro = mode === "reset" ? "׳¢׳“׳›׳ ׳×׳™ ׳׳ ׳¢׳›׳©׳™׳• ׳׳× ׳”׳’׳™׳©׳” ׳-NeverMind." : "׳₪׳×׳—׳×׳™ ׳׳ ׳¢׳›׳©׳™׳• ׳’׳™׳©׳” ׳-NeverMind.";
    return `${nameLine}${intro}\n׳©׳ ׳׳©׳×׳׳©: ${phone}\n׳¡׳™׳¡׳׳”: ${password}\n׳›׳ ׳™׳¡׳”: ${loginUrl}\n׳׳—׳¨׳™ ׳”׳›׳ ׳™׳¡׳” ׳™׳™׳₪׳×׳—׳• ׳›׳ ׳”׳×׳›׳ ׳™׳ ׳•׳”׳׳׳׳¨׳™׳ ׳©׳ ׳—׳‘׳¨׳™ ׳”׳׳•׳¢׳“׳•׳.`;
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
      loadingEl.textContent = message || "׳˜׳•׳¢׳ ׳ ׳×׳•׳ ׳™ ׳׳•׳¢׳“׳•׳...";
      loadingEl.classList.toggle("hidden", !active);
    }
    if (contentEl instanceof HTMLElement) {
      contentEl.classList.toggle("hidden", active);
    }
  };

  const handleUnauthorized = () => {
    showError("׳”׳©׳¨׳× ׳׳ ׳׳™׳©׳¨ ׳׳× ׳”׳‘׳§׳©׳”. ׳‘׳“׳•׳§ ׳׳× Cloudflare Access ׳¢׳ /dashboard/, /api/dashboard/ ׳•ײ¾/api/club-admin/.");
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
        ? "׳׳ ׳׳¦׳׳ ׳• ׳—׳‘׳¨ ׳©׳׳×׳׳™׳ ׳׳—׳™׳₪׳•׳© ׳”׳–׳”."
        : "׳׳₪׳©׳¨ ׳׳”׳×׳—׳™׳ ׳׳›׳×׳•׳‘ ׳˜׳׳₪׳•׳ ׳׳• ׳©׳, ׳׳• ׳׳‘׳—׳•׳¨ ׳׳”׳¨׳©׳™׳׳” ׳”׳׳—׳¨׳•׳ ׳”.";
    }

    renderItems(
      memberResultsEl,
      matches,
      (member) => {
        const row = createRow(`
          <div class="flex items-start justify-between gap-3">
            <div class="space-y-1 text-right">
              <p class="text-sm font-semibold text-[var(--nm-fg)]">${escapeHtml(member.memberName || "׳—׳‘׳¨")}</p>
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
      rawQuery ? "׳׳ ׳׳¦׳׳ ׳• ׳—׳‘׳¨ ׳׳×׳׳™׳." : "׳¨׳©׳™׳׳× ׳”׳—׳‘׳¨׳™׳ ׳×׳•׳₪׳™׳¢ ׳›׳׳."
    );
  };

  const renderMemberCard = (payload) => {
    const member = payload?.member;
    if (!(memberCardEl instanceof HTMLElement) || !member) return;

    memberCardEl.innerHTML = `
      <div class="space-y-2 text-right">
        <p class="text-lg font-semibold text-[var(--nm-fg)]">${escapeHtml(member.memberName || "׳—׳‘׳¨")}</p>
        <p class="text-sm leading-7 text-[color-mix(in_srgb,var(--nm-fg)_64%,var(--nm-bg))]">${escapeHtml(member.phone)} ֲ· ${escapeHtml(formatMemberStatus(member))}</p>
        <p class="text-xs leading-6 text-[color-mix(in_srgb,var(--nm-fg)_54%,var(--nm-bg))]">׳’׳™׳©׳” ׳¢׳“ ${escapeHtml(member.expiresAt ? formatDateTime(member.expiresAt) : "׳׳ ׳™׳“׳•׳¢")}</p>
        <p class="text-xs leading-6 text-[color-mix(in_srgb,var(--nm-fg)_54%,var(--nm-bg))]">׳›׳ ׳™׳¡׳” ׳׳—׳¨׳•׳ ׳” ${escapeHtml(member.lastLoginAt ? formatDateTime(member.lastLoginAt) : "׳׳ ׳™׳“׳•׳¢")}</p>
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
      memberCardEl.textContent = "׳˜׳•׳¢׳ ׳›׳¨׳˜׳™׳¡ ׳—׳‘׳¨...";
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
        showError(payload?.error ? String(payload.error) : "׳׳ ׳”׳¦׳׳—׳ ׳• ׳׳˜׳¢׳•׳ ׳׳× ׳₪׳¨׳˜׳™ ׳”׳—׳‘׳¨.");
        return;
      }

      renderMemberCard(payload);
      renderItems(
        memberTimelineEl,
        Array.isArray(payload.timeline) ? payload.timeline : [],
        (item) =>
          createRow(`
            <p class="text-sm font-semibold text-[var(--nm-fg)]">${escapeHtml(item.title || "׳₪׳¢׳™׳׳•׳×")}</p>
            <p class="mt-1 text-xs leading-6 text-[color-mix(in_srgb,var(--nm-fg)_65%,var(--nm-bg))]">${escapeHtml(formatDateTime(item.at))}</p>
            <p class="mt-1 text-xs leading-6 text-[color-mix(in_srgb,var(--nm-fg)_56%,var(--nm-bg))]">${escapeHtml(item.detail || "")}</p>
          `, item.kind === "flag" ? "tint" : "white"),
        "׳¢׳“׳™׳™׳ ׳׳™׳ ׳₪׳¢׳™׳׳•׳× ׳׳×׳•׳¢׳“׳× ׳׳—׳‘׳¨ ׳”׳–׳”."
      );

      if (memberSearchInput instanceof HTMLInputElement) {
        memberSearchInput.value = normalizedPhone;
      }
    } catch {
      showError("׳׳ ׳”׳¦׳׳—׳ ׳• ׳׳˜׳¢׳•׳ ׳׳× ׳¦׳™׳¨ ׳”׳₪׳¢׳™׳׳•׳× ׳©׳ ׳”׳—׳‘׳¨.");
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
      summaryLastIntegrity.textContent = stats.lastIntegrityAt ? formatDateTime(stats.lastIntegrityAt) : "׳׳ ׳–׳׳™׳";
    }

    renderItems(
      integrityReportsEl,
      integrityReports,
      (item) =>
        createRow(`
          <p class="text-sm font-semibold text-[var(--nm-fg)]">${escapeHtml(item.pageTitle || item.pagePath || item.pageUrl || "׳¢׳׳•׳“ ׳׳׳ ׳›׳•׳×׳¨׳×")}</p>
          <p class="mt-1 text-xs leading-6 text-[color-mix(in_srgb,var(--nm-fg)_65%,var(--nm-bg))]">${escapeHtml(formatDateTime(item.reportedAt))} &middot; ${escapeHtml(item.pagePath || item.pageUrl || "/")}</p>
          <p class="mt-2 text-xs leading-6 text-[color-mix(in_srgb,var(--nm-fg)_58%,var(--nm-bg))]">${escapeHtml(item.selectedText || item.note || item.message || "׳”׳¢׳¨׳” ׳›׳׳׳™׳× ׳׳׳ ׳˜׳§׳¡׳˜ ׳׳¡׳•׳׳")}</p>
          <p class="mt-1 text-[11px] leading-6 text-[color-mix(in_srgb,var(--nm-fg)_48%,var(--nm-bg))]">${escapeHtml(item.reporterFingerprint || "׳׳׳ ׳׳–׳”׳”")}</p>
        `),
      "׳¢׳“׳™׳™׳ ׳׳™׳ ׳”׳¢׳¨׳•׳× ׳׳”׳׳×׳¨. ׳‘׳¨׳’׳¢ ׳©׳׳‘׳§׳¨ ׳™׳©׳׳— ׳×׳™׳§׳•׳ ׳׳×׳•׳ ׳¢׳׳•׳“, ׳”׳•׳ ׳™׳•׳₪׳™׳¢ ׳›׳׳."
    );

    renderItems(
      recentLoginsEl,
      recentLogins,
      (item) =>
        createRow(`
          <p class="text-sm font-semibold text-[var(--nm-fg)]">${escapeHtml(item.memberName ? `${item.memberName} · ${item.phone || "׳׳׳ ׳˜׳׳₪׳•׳"}` : item.phone || "׳׳׳ ׳˜׳׳₪׳•׳")}</p>
          <p class="mt-1 text-xs leading-6 text-[color-mix(in_srgb,var(--nm-fg)_65%,var(--nm-bg))]">${escapeHtml(formatDateTime(item.seenAt))} ֲ· ${escapeHtml(item.path || "/")}</p>
          <p class="mt-1 text-xs leading-6 text-[color-mix(in_srgb,var(--nm-fg)_52%,var(--nm-bg))]">${escapeHtml(item.ipFingerprint || "׳׳׳ ׳׳–׳”׳”")} &middot; ${escapeHtml(item.userAgent || "׳׳׳ ׳“׳₪׳“׳₪׳")}</p>
        `),
      "׳¢׳“׳™׳™׳ ׳׳™׳ ׳›׳ ׳™׳¡׳•׳× ׳׳×׳•׳¢׳“׳•׳× ׳‘׳—׳׳•׳ ׳”׳׳—׳¨׳•׳."
    );

    renderItems(
      fraudFlagsEl,
      fraudFlags,
      (item) =>
        createRow(
          `
            <p class="text-sm font-semibold text-[var(--nm-fg)]">${escapeHtml(item.memberName ? `${item.memberName} · ${item.phone || "׳׳׳ ׳˜׳׳₪׳•׳"}` : item.phone || "׳׳׳ ׳˜׳׳₪׳•׳")}</p>
            <p class="mt-1 text-xs leading-6 text-[color-mix(in_srgb,var(--nm-fg)_65%,var(--nm-bg))]">׳¡׳•׳׳ ׳‘-${escapeHtml(formatDateTime(item.flaggedAt))}</p>
            <p class="mt-1 text-xs leading-6 text-[color-mix(in_srgb,var(--nm-fg)_52%,var(--nm-bg))]">${escapeHtml(item.memberIpCount || 0)} ׳׳–׳”׳™ IP ׳׳—׳‘׳¨ &middot; ${escapeHtml(item.passwordIpCount || 0)} ׳׳–׳”׳™ IP ׳׳¡׳™׳¡׳׳”</p>
          `,
          "tint"
        ),
      "׳›׳¨׳’׳¢ ׳׳™׳ ׳”׳×׳¨׳׳•׳× ׳—׳¨׳™׳’׳•׳× ׳₪׳×׳•׳—׳•׳×."
    );

    renderItems(
      pageBeaconsEl,
      pageViewBeacons,
      (item) =>
        createRow(`
          <p class="text-sm font-semibold text-[var(--nm-fg)]">${escapeHtml(item.path || "/")}</p>
          <p class="mt-1 text-xs leading-6 text-[color-mix(in_srgb,var(--nm-fg)_65%,var(--nm-bg))]">${escapeHtml(formatDateTime(item.seenAt))}</p>
          <p class="mt-1 text-xs leading-6 text-[color-mix(in_srgb,var(--nm-fg)_52%,var(--nm-bg))]">${escapeHtml(item.ipFingerprint || "׳׳׳ ׳׳–׳”׳”")}</p>
        `),
      "׳¢׳“׳™׳™׳ ׳׳™׳ ׳×׳¦׳₪׳™׳•׳× ׳×׳•׳›׳. ׳׳—׳¨׳™ ׳›׳ ׳™׳¡׳” ׳©׳ ׳—׳‘׳¨ ׳•׳₪׳×׳™׳—׳× ׳׳׳׳¨ ׳×׳—׳× /articles/ ׳™׳•׳₪׳™׳¢׳• ׳›׳׳ ׳©׳•׳¨׳•׳× ׳—׳“׳©׳•׳×."
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
    setLoading(true, "׳׳–׳§׳§ ׳׳× ׳ ׳×׳•׳ ׳™ ׳”׳׳•׳¢׳“׳•׳...");
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
        showError(payload?.error ? String(payload.error) : "׳™׳•׳×׳¨ ׳׳“׳™ ׳‘׳§׳©׳•׳×. ׳ ׳¡׳” ׳©׳•׳‘ ׳‘׳¢׳•׳“ ׳¨׳’׳¢.");
        setLoading(false);
        return;
      }
      if (!response.ok || !payload || payload.ok !== true) {
        showError(payload?.error ? String(payload.error) : "׳”׳©׳¨׳× ׳׳ ׳”׳—׳–׳™׳¨ ׳ ׳×׳•׳ ׳™ ׳ ׳™׳”׳•׳.");
        setLoading(false);
        return;
      }

      renderOverview(payload);
      setLoading(false);
    } catch {
      showError("׳”׳©׳¨׳× ׳׳ ׳¢׳ ׳”. ׳׳₪׳©׳¨ ׳׳¨׳¢׳ ׳ ׳•׳׳ ׳¡׳•׳× ׳©׳•׳‘.");
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
        showError("׳¦׳¨׳™׳ ׳˜׳׳₪׳•׳ ׳•׳¡׳™׳¡׳׳” ׳—׳“׳©׳”.");
        return;
      }
      pendingReset = { phone, newPassword };
      if (confirmText instanceof HTMLElement) {
        confirmText.textContent = `׳”׳׳ ׳׳׳₪׳¡ ׳¢׳›׳©׳™׳• ׳׳× ׳”׳¡׳™׳¡׳׳” ׳©׳ ${phone}`;
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
        resetStatus.textContent = `׳”׳˜׳׳₪׳•׳ ${selectedMemberPhone} ׳”׳•׳¢׳‘׳¨ ׳׳˜׳•׳₪׳¡ ׳”׳׳™׳₪׳•׳¡.`;
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
        setStatus("׳¦׳¨׳™׳ ׳˜׳׳₪׳•׳ ׳•׳¡׳™׳¡׳׳”.");
        return;
      }

      const loadingText = "׳׳•׳¡׳™׳£ ׳—׳‘׳¨...";
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
          setStatus(payload?.error ? String(payload.error) : "׳™׳•׳×׳¨ ׳׳“׳™ ׳‘׳§׳©׳•׳×. ׳ ׳¡׳” ׳©׳•׳‘ ׳‘׳¢׳•׳“ ׳¨׳’׳¢.");
          return;
        }
        if (!response.ok || !payload || payload.ok !== true) {
          setStatus(payload?.error ? String(payload.error) : "׳”׳©׳¨׳× ׳׳ ׳׳™׳©׳¨ ׳׳× ׳”׳‘׳§׳©׳”.");
          return;
        }

        setStatus(`׳ ׳•׳¡׳£ ׳—׳‘׳¨: ${payload.phone}`);
        setShareMessage(
          buildMemberShareMessage({
            phone: payload.phone || phone,
            password,
            fullName,
            mode: "created",
          }),
          "׳ ׳•׳¦׳¨׳” ׳”׳•׳“׳¢׳” ׳׳•׳›׳ ׳” ׳׳”׳¢׳×׳§׳”."
        );
        addMemberForm.reset();
        await loadOverview();
      } catch {
        setStatus("׳”׳©׳¨׳× ׳׳ ׳¢׳ ׳”. ׳ ׳¡׳” ׳©׳•׳‘.");
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
        setShareStatus("׳¢׳•׳“ ׳׳™׳ ׳”׳•׳“׳¢׳” ׳׳•׳›׳ ׳” ׳׳”׳¢׳×׳§׳”.");
        return;
      }
      try {
        await navigator.clipboard.writeText(shareMessageField.value);
        setShareStatus("׳”׳”׳•׳“׳¢׳” ׳”׳•׳¢׳×׳§׳”.");
      } catch {
        shareMessageField.focus();
        shareMessageField.select();
        setShareStatus("׳׳ ׳”׳¦׳׳—׳ ׳• ׳׳”׳¢׳×׳™׳§ ׳׳•׳˜׳•׳׳˜׳™׳×. ׳¡׳™׳׳ ׳• ׳׳× ׳”׳˜׳§׳¡׳˜ ׳›׳“׳™ ׳©׳×׳•׳›׳ ׳׳”׳¢׳×׳™׳§.");
      }
    };
    copyShareButton.addEventListener("click", onCopyShare);
    cleanups.push(() => copyShareButton.removeEventListener("click", onCopyShare));
  }

  if (copyLoginLinkButton instanceof HTMLButtonElement) {
    const onCopyLoginLink = async () => {
      try {
        await navigator.clipboard.writeText(loginUrl);
        setShareStatus("׳§׳™׳©׳•׳¨ ׳”׳›׳ ׳™׳¡׳” ׳”׳•׳¢׳×׳§.");
      } catch {
        setShareStatus("׳׳ ׳”׳¦׳׳—׳ ׳• ׳׳”׳¢׳×׳™׳§ ׳׳× ׳”׳§׳™׳©׳•׳¨ ׳׳•׳˜׳•׳׳˜׳™׳×.");
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
      window.__nmSetButtonLoading?.(confirmApprove, "׳׳¢׳“׳›׳ ׳¡׳™׳¡׳׳”...");
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
          showError(payload?.error ? String(payload.error) : "׳™׳•׳×׳¨ ׳׳“׳™ ׳‘׳§׳©׳•׳×. ׳ ׳¡׳” ׳©׳•׳‘ ׳‘׳¢׳•׳“ ׳¨׳’׳¢.");
          return;
        }
        if (!response.ok || !payload || payload.ok !== true) {
          showError(payload?.error ? String(payload.error) : "׳”׳©׳¨׳× ׳׳ ׳¢׳“׳›׳ ׳׳× ׳”׳¡׳™׳¡׳׳”.");
          return;
        }
        if (resetStatus instanceof HTMLElement) {
          resetStatus.textContent = `׳”׳¡׳™׳¡׳׳” ׳©׳ ${pendingReset.phone} ׳¢׳•׳“׳›׳ ׳” ׳‘-${formatDateTime(payload.updatedAt)}`;
        }
        setShareMessage(
          buildMemberShareMessage({
            phone: pendingReset.phone,
            password: pendingReset.newPassword,
            fullName: "",
            mode: "reset",
          }),
          "׳”׳•׳“׳¢׳× ׳”׳׳™׳₪׳•׳¡ ׳׳•׳›׳ ׳” ׳׳”׳¢׳×׳§׳”."
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
        showError("׳”׳©׳¨׳× ׳׳ ׳¢׳ ׳”. ׳׳₪׳©׳¨ ׳׳ ׳¡׳•׳× ׳©׳•׳‘.");
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
    cleanups.forEach((cleanup) => cleanup());
  };
};

document.addEventListener("astro:page-load", initAdminDashboard);
initAdminDashboard();

