import type { ActivityEntry, Env } from "./types";

export const DEFAULT_ALLOWED_ORIGINS = [
  "https://www.nevermind.co.il",
  "https://nevermind.co.il",
  "http://localhost:4321",
];
export const MEMBER_PASSWORD_PBKDF2_ITERATIONS = 180000;
export const LOGIN_WINDOW_MS = 6 * 60 * 60 * 1000;
export const MAX_ACTIVITY_ENTRIES = 12;
export const KV_LIST_LIMIT = 1000;
export const CLUB_MEMBER_DEFAULT_EXPIRES_DAYS = 365;
export const DEEP_PAGE_VIEWS_KEY = "deep:page_views";
export const MAX_DEEP_PAGE_VIEWS = 200;
export const INTEGRITY_REPORTS_KEY = "feedback:integrity_reports";
export const MAX_INTEGRITY_REPORTS = 120;
export const PROGRESS_TOKEN_MAX_MS = 30 * 24 * 60 * 60 * 1000;
export const ACTIVE_NOW_WINDOW_MS = 20 * 60 * 1000;

export async function checkRateLimit(
  env: Env,
  ipHash: string,
  routeTag: string,
  maxPerWindow: number,
  windowSec: number,
  corsHeaders: Headers
): Promise<Response | null> {
  const key = `rl:${ipHash}:${routeTag}`;
  const raw = await env.CLUB_ACTIVITY.get(key);
  const count = raw ? Number.parseInt(raw, 10) || 0 : 0;
  if (count >= maxPerWindow) {
    return json({ ok: false, error: "יותר מדי בקשות. נסה שוב בעוד רגע.", errorCode: "rate_limited" }, 429, corsHeaders);
  }
  await env.CLUB_ACTIVITY.put(key, String(count + 1), { expirationTtl: windowSec });
  return null;
}

export function createCorsHeaders(request: Request, env: Env): Headers {
  const headers = new Headers({
    "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-NM-Admin-Service",
    "Access-Control-Max-Age": "86400",
    "Content-Type": "application/json; charset=utf-8",
    Vary: "Origin",
    "Cache-Control": "no-store",
  });
  const allowedOrigin = resolveAllowedOrigin(request, env);
  if (allowedOrigin) {
    headers.set("Access-Control-Allow-Origin", allowedOrigin);
  }
  return headers;
}

export function resolveAllowedOrigin(request: Request, env: Env): string | null {
  const origin = request.headers.get("Origin");
  const configured = String(env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const allowedOrigins = configured.length > 0 ? configured : DEFAULT_ALLOWED_ORIGINS;
  if (!origin) {
    return allowedOrigins[0] ?? null;
  }
  return allowedOrigins.includes(origin) ? origin : null;
}

export function json(payload: unknown, status: number, headers: Headers): Response {
  return new Response(JSON.stringify(payload), { status, headers });
}

export function normalizePhone(raw: string): string {
  const digits = String(raw ?? "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("972") && digits.length === 12) {
    return `0${digits.slice(3)}`;
  }
  return digits;
}

export function normalizeIdentityName(raw: string): string {
  return String(raw ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 80);
}

export function buildSharedIdentityKey(fullName: string, phone: string): string {
  const normalizedName = normalizeIdentityName(fullName)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `shared:${normalizedName || "member"}:${phone}`;
}

export function isExpired(expiresAt: string): boolean {
  const timestamp = Date.parse(expiresAt);
  return Number.isNaN(timestamp) || timestamp < Date.now();
}

export function readClientIp(request: Request): string {
  const headerValue =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for") ??
    request.headers.get("x-real-ip") ??
    "";
  const first = String(headerValue).split(",")[0]?.trim();
  return first || "unknown";
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  const [version, first, second, third] = String(passwordHash ?? "").split("$");
  if (version === "v1" && first && second) {
    const actualHash = await sha256Hex(`${first}:${password}`);
    return timingSafeEqual(actualHash, second);
  }
  if (version === "v2" && first && second && third) {
    const iterations = Number.parseInt(first, 10);
    if (!Number.isFinite(iterations) || iterations < 100000) {
      return false;
    }
    const actualHash = await pbkdf2Sha256Hex(password, second, iterations);
    return timingSafeEqual(actualHash, third);
  }
  return false;
}

export async function createPasswordHash(password: string): Promise<string> {
  const salt = randomHex(16);
  const digest = await pbkdf2Sha256Hex(password, salt, MEMBER_PASSWORD_PBKDF2_ITERATIONS);
  return `v2$${MEMBER_PASSWORD_PBKDF2_ITERATIONS}$${salt}$${digest}`;
}

export function getPasswordHashVersion(passwordHash: string): "v1" | "v2" | "unknown" {
  if (String(passwordHash ?? "").startsWith("v1$")) return "v1";
  if (String(passwordHash ?? "").startsWith("v2$")) return "v2";
  return "unknown";
}

export function randomHex(bytes: number): string {
  const buffer = new Uint8Array(bytes);
  crypto.getRandomValues(buffer);
  return Array.from(buffer)
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

export async function sha256Hex(input: string): Promise<string> {
  const buffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function pbkdf2Sha256Hex(password: string, saltHex: string, iterations: number): Promise<string> {
  const baseKey = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: hexToBytes(saltHex),
      iterations,
      hash: "SHA-256",
    },
    baseKey,
    256
  );
  return Array.from(new Uint8Array(derivedBits))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function hexToBytes(value: string): Uint8Array {
  const normalized = String(value ?? "").trim();
  if (!normalized || normalized.length % 2 !== 0) {
    return new Uint8Array();
  }
  const bytes = new Uint8Array(normalized.length / 2);
  for (let index = 0; index < normalized.length; index += 2) {
    const byte = Number.parseInt(normalized.slice(index, index + 2), 16);
    bytes[index / 2] = Number.isFinite(byte) ? byte : 0;
  }
  return bytes;
}

export function timingSafeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return mismatch === 0;
}

export async function readActivity(namespace: KVNamespace, key: string): Promise<ActivityEntry[]> {
  const entries = await namespace.get<ActivityEntry[]>(key, "json");
  if (!Array.isArray(entries)) return [];
  return entries.filter((entry) => entry && typeof entry.ipHash === "string" && typeof entry.seenAt === "string");
}

export function appendActivity(entries: ActivityEntry[], nextEntry: ActivityEntry): ActivityEntry[] {
  const cutoff = Date.now() - LOGIN_WINDOW_MS;
  const recentEntries = entries.filter((entry) => {
    const timestamp = Date.parse(entry.seenAt);
    return !Number.isNaN(timestamp) && timestamp >= cutoff;
  });
  recentEntries.push(nextEntry);
  return recentEntries.slice(-MAX_ACTIVITY_ENTRIES);
}

export function countDistinctIps(entries: ActivityEntry[]): number {
  return new Set(entries.map((entry) => entry.ipHash)).size;
}

export async function requireAdminAuth(request: Request, env: Env, headers: Headers): Promise<true | Response> {
  const serviceSecret = String(env.ADMIN_SERVICE_KEY ?? env.NM_CLUB_ADMIN_SERVICE_KEY ?? "").trim();
  const serviceHeader = String(request.headers.get("x-nm-admin-service") ?? "").trim();
  if (serviceSecret && serviceHeader && timingSafeEqual(serviceHeader, serviceSecret)) {
    return true;
  }
  return json({ ok: false, error: "נדרש מפתח שירות פנימי לניהול." }, 401, headers);
}

export function encodeBase64Url(input: string): string {
  return btoa(input).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function decodeBase64Url(input: string): string {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return atob(`${normalized}${padding}`);
}
