import { buildAdminApiUrl, readAdminSession, saveAdminSession } from "./admin-session.js";

const initAdminLogin = () => {
  window.__nmAdminLoginCleanup?.();

  const form = document.querySelector("[data-admin-login-form]");
  const passwordField = form?.querySelector('input[name="password"]');
  const errorEl = document.querySelector("[data-admin-login-error]");
  const statusEl = document.querySelector("[data-admin-login-status]");
  const submitBtn = form?.querySelector('button[type="submit"]');
  const context = document.getElementById("nm-admin-login-context");
  const nextPath = context?.getAttribute("data-next") || "/dashboard/";
  const endpoint = buildAdminApiUrl("/admin/login");

  if (!(form instanceof HTMLFormElement) || !(passwordField instanceof HTMLInputElement) || !(submitBtn instanceof HTMLButtonElement)) {
    return;
  }

  const existing = readAdminSession();
  if (existing) {
    window.location.replace(nextPath);
    return;
  }

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

  const setStatus = (message) => {
    if (!(statusEl instanceof HTMLElement)) return;
    statusEl.textContent = message;
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    clearError();

    if (!endpoint) {
      showError("אין כתובת אימות לניהול.");
      return;
    }

    const password = passwordField.value.trim();
    if (!password) {
      showError("צריך סיסמת ניהול.");
      passwordField.focus();
      return;
    }

    submitBtn.disabled = true;
    setStatus("בודק גישת ניהול...");
    window.__nmSetButtonLoading?.(submitBtn, "בודק גישת ניהול...");

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ password }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload || payload.ok !== true) {
        showError(payload?.error ? String(payload.error) : "השרת לא אישר את הכניסה.");
        setStatus("");
        return;
      }

      saveAdminSession({
        role: "admin",
        token: payload.token,
        expiresAt: payload.expiresAt,
        loggedInAt: payload.loggedInAt,
        label: typeof payload.label === "string" ? payload.label : "Admin",
      });
      window.__nmHapticSuccess?.();
      window.location.replace(nextPath);
    } catch {
      showError("השרת לא ענה. אפשר לנסות שוב.");
      setStatus("");
    } finally {
      submitBtn.disabled = false;
      window.__nmClearButtonLoading?.(submitBtn);
    }
  };

  const onInput = () => {
    clearError();
    setStatus("");
  };

  form.addEventListener("submit", onSubmit);
  passwordField.addEventListener("input", onInput);
  passwordField.focus({ preventScroll: true });

  window.__nmAdminLoginCleanup = () => {
    form.removeEventListener("submit", onSubmit);
    passwordField.removeEventListener("input", onInput);
  };
};

document.addEventListener("astro:page-load", initAdminLogin);
initAdminLogin();


