export function isClubAdminViaProxy() {
  return true;
}

export function buildAdminApiUrl(pathname) {
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  if (typeof window !== "undefined" && window.location?.origin) {
    const protectedBase = window.location.pathname.startsWith("/admin/")
      ? "/admin/api/club-admin"
      : "/dashboard/api/club-admin";
    return `${window.location.origin}${protectedBase}${normalizedPath}`;
  }
  return `/dashboard/api/club-admin${normalizedPath}`;
}

export function readAdminSession() {
  return null;
}

export function saveAdminSession() {
  return false;
}

export function clearAdminSession() {
}

export function buildAdminAuthHeaders(headers = {}) {
  return { ...headers };
}

export function bindAdminDraftPersistence(form, options = {}) {
  if (!(form instanceof HTMLFormElement)) return () => {};

  let storage = null;
  try {
    storage = typeof window === "undefined" ? null : window.localStorage;
  } catch {
    storage = null;
  }
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
