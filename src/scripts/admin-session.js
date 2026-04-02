export const ADMIN_STORAGE_KEY = "nm_admin_session";

const webhookUrl = (import.meta.env.PUBLIC_NM_CLUB_WEBHOOK_URL ?? "").trim();

/** ניהול דרך פרוקסי Pages + Cloudflare Access - בלי JWT בדפדפן */
export function isClubAdminViaProxy() {
  return String(import.meta.env.PUBLIC_CLUB_ADMIN_VIA_PROXY ?? "").trim() === "true";
}

const safeLocalStorage = () => {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

export function buildAdminApiUrl(pathname) {
  if (isClubAdminViaProxy()) {
    const p = pathname.startsWith("/") ? pathname : `/${pathname}`;
    if (typeof window !== "undefined" && window.location?.origin) {
      return `${window.location.origin}/api/club-admin${p}`;
    }
    return `/api/club-admin${p}`;
  }
  if (!webhookUrl) return "";
  const url = new URL(webhookUrl);
  url.pathname = pathname.startsWith("/") ? pathname : `/${pathname}`;
  url.search = "";
  url.hash = "";
  return url.toString();
}

export function readAdminSession() {
  const storage = safeLocalStorage();
  if (!storage) return null;

  try {
    const raw = storage.getItem(ADMIN_STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || typeof data !== "object") return null;

    const role = typeof data.role === "string" ? data.role.trim() : "";
    const token = typeof data.token === "string" ? data.token.trim() : "";
    const expiresAt = typeof data.expiresAt === "string" ? data.expiresAt.trim() : "";
    const loggedInAt = typeof data.loggedInAt === "string" ? data.loggedInAt.trim() : "";
    const label = typeof data.label === "string" ? data.label.trim() : "Admin";

    if (role !== "admin" || !token || !expiresAt) {
      storage.removeItem(ADMIN_STORAGE_KEY);
      return null;
    }

    const expiresTs = Date.parse(expiresAt);
    if (Number.isNaN(expiresTs) || expiresTs < Date.now()) {
      storage.removeItem(ADMIN_STORAGE_KEY);
      return null;
    }

    return {
      role,
      token,
      expiresAt: new Date(expiresTs).toISOString(),
      loggedInAt,
      label: label || "Admin",
    };
  } catch {
    return null;
  }
}

export function saveAdminSession(session) {
  const storage = safeLocalStorage();
  if (!storage) return false;

  const next = {
    role: "admin",
    token: String(session?.token ?? "").trim(),
    expiresAt: String(session?.expiresAt ?? "").trim(),
    loggedInAt: String(session?.loggedInAt ?? new Date().toISOString()).trim(),
    label: String(session?.label ?? "Admin").trim() || "Admin",
  };

  if (!next.token || !next.expiresAt) return false;

  try {
    storage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("nm-admin-session-changed"));
    return true;
  } catch {
    return false;
  }
}

export function clearAdminSession() {
  const storage = safeLocalStorage();
  if (!storage) return;
  try {
    storage.removeItem(ADMIN_STORAGE_KEY);
  } catch {
  }
  window.dispatchEvent(new CustomEvent("nm-admin-session-changed"));
}

export function buildAdminAuthHeaders(headers = {}) {
  if (isClubAdminViaProxy()) {
    return { ...headers };
  }
  const session = readAdminSession();
  if (!session) return headers;
  return {
    ...headers,
    Authorization: `Bearer ${session.token}`,
  };
}

export function bindAdminDraftPersistence(form, options = {}) {
  if (!(form instanceof HTMLFormElement)) return () => {};
  const storage = safeLocalStorage();
  if (!storage) return () => {};

  const storageKey = String(options.storageKey || "nm-admin-draft");
  const fields = Array.isArray(options.fields) ? options.fields : [];
  const selectedFields = fields
    .map((name) => form.elements.namedItem(name))
    .filter((field) => field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement || field instanceof HTMLSelectElement);

  if (!selectedFields.length) return () => {};

  const restore = () => {
    try {
      const raw = storage.getItem(storageKey);
      if (!raw) return;
      const draft = JSON.parse(raw);
      selectedFields.forEach((field) => {
        const name = field.getAttribute("name") || field.id;
        if (!name || !(name in draft)) return;
        field.value = String(draft[name] ?? "");
      });
    } catch {
    }
  };

  const persist = () => {
    const snapshot = {};
    selectedFields.forEach((field) => {
      const name = field.getAttribute("name") || field.id;
      if (!name) return;
      snapshot[name] = field.value;
    });
    try {
      storage.setItem(storageKey, JSON.stringify(snapshot));
    } catch {
    }
  };

  const clear = () => {
    try {
      storage.removeItem(storageKey);
    } catch {
    }
  };

  restore();
  selectedFields.forEach((field) => {
    field.addEventListener("input", persist);
    field.addEventListener("change", persist);
  });

  return () => {
    selectedFields.forEach((field) => {
      field.removeEventListener("input", persist);
      field.removeEventListener("change", persist);
    });
    if (options.clearOnCleanup) clear();
  };
}

if (typeof window !== "undefined") {
  window.__nmReadAdminSession = readAdminSession;
  window.__nmClearAdminSession = clearAdminSession;
}
