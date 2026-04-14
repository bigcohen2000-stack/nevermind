const PUBLIC_UNLOCK_MODE = "public";

function readCodesFromEnv(env) {
  const raw = String(env.PUBLIC_DASHBOARD_CODES ?? env.NEXT_PUBLIC_DASHBOARD_CODES ?? "").trim();
  if (!raw) return [];
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function readUnlockAccessMode(env) {
  return String(env.PUBLIC_UNLOCK_ACCESS_MODE ?? env.NEXT_PUBLIC_UNLOCK_ACCESS_MODE ?? "")
    .trim()
    .toLowerCase();
}

function isExplicitPublicUnlock(env) {
  return readUnlockAccessMode(env) === PUBLIC_UNLOCK_MODE;
}

function resolveUnlockAccess(code, env) {
  const clean = String(code ?? "").trim();
  const codes = readCodesFromEnv(env);
  const explicitPublic = isExplicitPublicUnlock(env);

  if (!clean) {
    return {
      authorized: false,
      mode: explicitPublic ? PUBLIC_UNLOCK_MODE : codes.length > 0 ? "strict" : "closed",
      codesConfigured: codes.length > 0,
      explicitPublic,
    };
  }

  if (codes.length > 0) {
    return {
      authorized: codes.includes(clean),
      mode: "strict",
      codesConfigured: true,
      explicitPublic: false,
    };
  }

  if (explicitPublic) {
    return {
      authorized: true,
      mode: PUBLIC_UNLOCK_MODE,
      codesConfigured: false,
      explicitPublic: true,
    };
  }

  return {
    authorized: false,
    mode: "closed",
    codesConfigured: false,
    explicitPublic: false,
  };
}

export {
  PUBLIC_UNLOCK_MODE,
  readCodesFromEnv,
  readUnlockAccessMode,
  isExplicitPublicUnlock,
  resolveUnlockAccess,
};
