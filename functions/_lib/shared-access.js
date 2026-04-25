function normalizePhone(raw) {
  const digits = String(raw ?? "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("972") && digits.length === 12) {
    return `0${digits.slice(3)}`;
  }
  return digits;
}

function normalizeSharedIdentityName(raw) {
  return String(raw ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 80);
}

function buildSharedIdentityKey(fullName, phone) {
  const normalizedName = normalizeSharedIdentityName(fullName)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `shared:${normalizedName || "member"}:${phone}`;
}

function readClientIp(request) {
  const headerValue =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for") ??
    request.headers.get("x-real-ip") ??
    "";
  return String(headerValue).split(",")[0]?.trim() || "";
}

export {
  normalizePhone,
  normalizeSharedIdentityName,
  buildSharedIdentityKey,
  readClientIp,
};
