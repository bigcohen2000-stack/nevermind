import {
  bindAdminDraftPersistence,
  buildAdminApiUrl,
  buildAdminAuthHeaders,
  clearAdminSession,
  isClubAdminViaProxy,
  readAdminSession,
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

const renderItems = (root, items, renderItem, emptyMessage) => {
  if (!(root instanceof HTMLElement)) return;
  root.innerHTML = "";
  if (!items.length) {
    const empty = document.createElement("li");
    empty.className = "rounded-[1.2rem] border border-[color-mix(in_srgb,var(--nm-fg)_10%,transparent)] bg-[var(--nm-surface-muted)] px-4 py-3 text-sm leading-7 text-[color-mix(in_srgb,var(--nm-fg)_62%,var(--nm-bg))]";
    empty.textContent = emptyMessage;
    root.appendChild(empty);
    return;
  }
  items.forEach((item) => root.appendChild(renderItem(item)));
};

const initAdminDashboard = () => {
  window.__nmAdminDashboardCleanup?.();

  const root = document.querySelector("[data-club-admin-root]");
  if (!(root instanceof HTMLElement)) return;

  const overviewEndpoint = buildAdminApiUrl("/admin/overview");
  const resetEndpoint = buildAdminApiUrl("/admin/reset-password");
  const addMemberEndpoint = buildAdminApiUrl("/admin/add-member");
  const loadingEl = root.querySelector("[data-admin-loading]");
  const errorEl = root.querySelector("[data-admin-error]");
  const contentEl = root.querySelector("[data-admin-content]");
  const recentLoginsEl = root.querySelector("[data-admin-recent-logins]");
  const fraudFlagsEl = root.querySelector("[data-admin-fraud-flags]");
  const pageBeaconsEl = root.querySelector("[data-admin-page-beacons]");
  const summaryMembers = root.querySelector('[data-admin-stat="members"]');
  const summaryRecent = root.querySelector('[data-admin-stat="recent"]');
  const summaryFlags = root.querySelector('[data-admin-stat="flags"]');
  const summaryDeep = root.querySelector('[data-admin-stat="deep"]');
  const summaryLastFlag = root.querySelector('[data-admin-stat="last-flag"]');
  const resetForm = root.querySelector("[data-admin-reset-form]");
  const resetStatus = root.querySelector("[data-admin-reset-status]");
  const resetSubmit = resetForm?.querySelector('button[type="submit"]');
  const addMemberForm = root.querySelector("[data-admin-add-member-form]");
  const addMemberStatus = root.querySelector("[data-admin-add-member-status]");
  const confirmDialog = root.querySelector("[data-admin-reset-dialog]");
  const confirmText = confirmDialog?.querySelector("[data-admin-reset-confirm-text]");
  const confirmApprove = confirmDialog?.querySelector("[data-admin-reset-approve]");
  const confirmCancelButtons = Array.from(root.querySelectorAll("[data-admin-reset-cancel]"));

  const viaProxy = isClubAdminViaProxy();
  if (!viaProxy && !readAdminSession()) {
    if (errorEl instanceof HTMLElement) {
      errorEl.textContent =
        "אין אסימון ניהול בדפדפן. בפרודקשן מומלץ: PUBLIC_CLUB_ADMIN_VIA_PROXY=true ו-Cloudflare Access על /dashboard/ ועל /api/club-admin/.";
      errorEl.classList.remove("hidden");
    }
    if (loadingEl instanceof HTMLElement) loadingEl.classList.add("hidden");
    return;
  }
  if (!overviewEndpoint || !resetEndpoint || !addMemberEndpoint) {
    if (errorEl instanceof HTMLElement) {
      errorEl.textContent = "חסר PUBLIC_NM_CLUB_WEBHOOK_URL או פרוקסי ניהול. לא ניתן לבנות כתובת API.";
      errorEl.classList.remove("hidden");
    }
    if (loadingEl instanceof HTMLElement) loadingEl.classList.add("hidden");
    return;
  }

  let pendingReset = null;
  const cleanups = [];

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
    if (viaProxy) {
      showError("השרת לא אישר את הבקשה. בדוק Cloudflare Access על /dashboard/ ועל /api/club-admin/ ואת סודות הפרוקסי.");
      setLoading(false);
      return;
    }
    clearAdminSession();
    showError("האסימון לא תקף או שפג. רענן את הדף אחרי התחברות מקומית ל-JWT אם עדיין משתמשים בזה.");
    setLoading(false);
  };

  const closeDialog = () => {
    if (confirmDialog instanceof HTMLDialogElement && confirmDialog.open) {
      confirmDialog.close();
    }
    pendingReset = null;
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
    const recentLogins = Array.isArray(payload?.recentLogins) ? payload.recentLogins : [];
    const fraudFlags = Array.isArray(payload?.fraudFlags) ? payload.fraudFlags : [];
    const pageViewBeacons = Array.isArray(payload?.pageViewBeacons) ? payload.pageViewBeacons : [];

    if (summaryMembers instanceof HTMLElement) summaryMembers.textContent = String(stats.members ?? 0);
    if (summaryRecent instanceof HTMLElement) summaryRecent.textContent = String(stats.recentLogins ?? recentLogins.length);
    if (summaryFlags instanceof HTMLElement) summaryFlags.textContent = String(stats.flaggedMembers ?? fraudFlags.length);
    if (summaryDeep instanceof HTMLElement) {
      summaryDeep.textContent = String(stats.pageViewBeacons ?? pageViewBeacons.length ?? 0);
    }
    if (summaryLastFlag instanceof HTMLElement) summaryLastFlag.textContent = stats.lastFlaggedAt ? formatDateTime(stats.lastFlaggedAt) : "לא זמין";

    renderItems(
      recentLoginsEl,
      recentLogins,
      (item) => {
        const row = document.createElement("li");
        row.className = "rounded-[1.2rem] border border-[color-mix(in_srgb,var(--nm-fg)_10%,transparent)] bg-white/90 px-4 py-3";
        row.innerHTML = `
          <p class="text-sm font-semibold text-[var(--nm-fg)]">${item.phone || "ללא טלפון"}</p>
          <p class="mt-1 text-xs leading-6 text-[color-mix(in_srgb,var(--nm-fg)_65%,var(--nm-bg))]">${formatDateTime(item.seenAt)} · ${item.path || "/"}</p>
          <p class="mt-1 text-xs leading-6 text-[color-mix(in_srgb,var(--nm-fg)_52%,var(--nm-bg))]">${item.ipFingerprint || "ללא מזהה"} · ${item.userAgent || "ללא דפדפן"}</p>
        `;
        return row;
      },
      "עדיין אין כניסות מתועדות בחלון האחרון."
    );

    renderItems(
      fraudFlagsEl,
      fraudFlags,
      (item) => {
        const row = document.createElement("li");
        row.className = "rounded-[1.2rem] border border-[color-mix(in_srgb,#D42B2B_22%,transparent)] bg-[var(--nm-tint)] px-4 py-3";
        row.innerHTML = `
          <p class="text-sm font-semibold text-[var(--nm-fg)]">${item.phone || "ללא טלפון"}</p>
          <p class="mt-1 text-xs leading-6 text-[color-mix(in_srgb,var(--nm-fg)_65%,var(--nm-bg))]">סומן ב-${formatDateTime(item.flaggedAt)}</p>
          <p class="mt-1 text-xs leading-6 text-[color-mix(in_srgb,var(--nm-fg)_52%,var(--nm-bg))]">${item.memberIpCount || 0} מזהי IP לחבר · ${item.passwordIpCount || 0} מזהי IP לסיסמה</p>
        `;
        return row;
      },
      "כרגע אין flags פתוחים."
    );

    renderItems(
      pageBeaconsEl,
      pageViewBeacons,
      (item) => {
        const row = document.createElement("li");
        row.className = "rounded-[1.2rem] border border-[color-mix(in_srgb,var(--nm-fg)_10%,transparent)] bg-white/90 px-4 py-3";
        row.innerHTML = `
          <p class="text-sm font-semibold text-[var(--nm-fg)]">${item.path || "/"}</p>
          <p class="mt-1 text-xs leading-6 text-[color-mix(in_srgb,var(--nm-fg)_65%,var(--nm-bg))]">${formatDateTime(item.seenAt)}</p>
          <p class="mt-1 text-xs leading-6 text-[color-mix(in_srgb,var(--nm-fg)_52%,var(--nm-bg))]">${item.ipFingerprint || "ללא מזהה"}</p>
        `;
        return row;
      },
      "עדיין אין ביקוני צפייה במאמרים. אחרי כניסה של חבר, פתח מאמר מתחת ל-/articles/."
    );
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
          const message = payload?.error ? String(payload.error) : "השרת לא אישר את הבקשה.";
          setStatus(message);
          return;
        }

        setStatus(`נוסף חבר: ${payload.phone}`);
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
    cleanups.forEach((cleanup) => cleanup());
  };
};

document.addEventListener("astro:page-load", initAdminDashboard);
initAdminDashboard();
