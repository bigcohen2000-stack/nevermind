interface Env {
  CLUB_MEMBERS: KVNamespace;
  CLUB_ACTIVITY: KVNamespace;
  CLUB_IP_PEPPER: string;
  ALLOWED_ORIGINS?: string;
}

type LoginRequest = {
  phone?: string;
  password?: string;
  path?: string;
  fullName?: string;
};

type StoredMember = {
  memberName?: string;
  phone?: string;
  passwordHash?: string;
  expiresAt?: string;
  status?: "active" | "paused" | "blocked";
  passwordGroup?: string;
  lastLoginAt?: string;
  lastIpHash?: string;
  flaggedAt?: string;
};

type ActivityEntry = {
  ipHash: string;
  seenAt: string;
  path: string;
  phone: string;
  userAgent: string;
};

const DEFAULT_ALLOWED_ORIGINS = [
  "https://www.nevermind.co.il",
  "https://nevermind.co.il",
  "http://localhost:4321",
];
const LOGIN_WINDOW_MS = 6 * 60 * 60 * 1000;
const MAX_ACTIVITY_ENTRIES = 12;

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const corsHeaders = createCorsHeaders(request, env);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method === "GET" && url.pathname === "/health") {
      return json(
        {
          ok: true,
          service: "nm-club-auth",
          now: new Date().toISOString(),
        },
        200,
        corsHeaders
      );
    }

    if (request.method !== "POST" || !isLoginPath(url.pathname)) {
      return json({ ok: false, error: "הנתיב לא נתמך." }, 404, corsHeaders);
    }

    let payload: LoginRequest | null = null;
    try {
      payload = (await request.json()) as LoginRequest;
    } catch {
      return json({ ok: false, error: "הבקשה לא נקראה כמו שצריך." }, 400, corsHeaders);
    }

    const phone = normalizePhone(payload?.phone ?? "");
    const password = String(payload?.password ?? "");
    const fallbackName = String(payload?.fullName ?? "").trim();
    const path = String(payload?.path ?? "").trim();

    if (!phone || !password) {
      return json({ ok: false, error: "צריך טלפון וסיסמת כניסה." }, 400, corsHeaders);
    }

    const memberKey = `member:${phone}`;
    const member = await env.CLUB_MEMBERS.get<StoredMember>(memberKey, "json");
    if (!member) {
      return json({ ok: false, error: "לא מצאנו גישה פעילה לפרטים האלה." }, 401, corsHeaders);
    }

    if (member.status === "blocked" || member.status === "paused") {
      return json({ ok: false, error: "הגישה כרגע לא פעילה." }, 403, corsHeaders);
    }

    const expiresAt = String(member.expiresAt ?? "").trim();
    if (!expiresAt || isExpired(expiresAt)) {
      return json({ ok: false, error: "הגישה הזו כבר לא פעילה." }, 403, corsHeaders);
    }

    const passwordHash = String(member.passwordHash ?? "").trim();
    const isValidPassword = await verifyPassword(password, passwordHash);
    if (!isValidPassword) {
      return json({ ok: false, error: "הטלפון או הסיסמה לא התאימו." }, 401, corsHeaders);
    }

    const nowIso = new Date().toISOString();
    const userAgent = String(request.headers.get("user-agent") ?? "").slice(0, 240);
    const ip = readClientIp(request);
    const ipHash = await sha256Hex(`${env.CLUB_IP_PEPPER}:${ip}`);
    const passwordGroup = String(member.passwordGroup ?? passwordHash).trim();

    const memberActivityKey = `activity:member:${phone}`;
    const passwordActivityKey = `activity:password:${passwordGroup}`;

    const [memberActivity, passwordActivity] = await Promise.all([
      readActivity(env.CLUB_ACTIVITY, memberActivityKey),
      readActivity(env.CLUB_ACTIVITY, passwordActivityKey),
    ]);

    const nextEntry: ActivityEntry = {
      ipHash,
      seenAt: nowIso,
      path,
      phone,
      userAgent,
    };

    const nextMemberActivity = appendActivity(memberActivity, nextEntry);
    const nextPasswordActivity = appendActivity(passwordActivity, nextEntry);

    const memberIpCount = countDistinctIps(nextMemberActivity);
    const passwordIpCount = countDistinctIps(nextPasswordActivity);
    const fraudFlag = memberIpCount > 1 || passwordIpCount > 1;

    const updatedMember: StoredMember = {
      ...member,
      phone,
      memberName: String(member.memberName ?? fallbackName ?? "").trim() || "חבר",
      lastLoginAt: nowIso,
      lastIpHash: ipHash,
      ...(fraudFlag ? { flaggedAt: nowIso } : {}),
    };

    ctx.waitUntil(
      Promise.all([
        env.CLUB_MEMBERS.put(memberKey, JSON.stringify(updatedMember)),
        env.CLUB_ACTIVITY.put(memberActivityKey, JSON.stringify(nextMemberActivity)),
        env.CLUB_ACTIVITY.put(passwordActivityKey, JSON.stringify(nextPasswordActivity)),
        fraudFlag
          ? env.CLUB_ACTIVITY.put(
              `flag:${phone}`,
              JSON.stringify({
                phone,
                flaggedAt: nowIso,
                memberIpCount,
                passwordIpCount,
                lastPath: path,
              })
            )
          : Promise.resolve(),
      ])
    );

    return json(
      {
        ok: true,
        memberName: updatedMember.memberName,
        phone,
        expiresAt,
        lastLoginAt: nowIso,
        fraudFlag,
        liveStatus: "LIVE",
      },
      200,
      corsHeaders
    );
  },
};

function isLoginPath(pathname: string): boolean {
  return pathname === "/" || pathname === "/auth/login";
}

function createCorsHeaders(request: Request, env: Env): Headers {
  const headers = new Headers({
    "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
    "Access-Control-Allow-Headers": "Content-Type",
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

function resolveAllowedOrigin(request: Request, env: Env): string | null {
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

function json(payload: unknown, status: number, headers: Headers): Response {
  return new Response(JSON.stringify(payload), { status, headers });
}

function normalizePhone(raw: string): string {
  const digits = String(raw ?? "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("972") && digits.length === 12) {
    return `0${digits.slice(3)}`;
  }
  return digits;
}

function isExpired(expiresAt: string): boolean {
  const timestamp = Date.parse(expiresAt);
  return Number.isNaN(timestamp) || timestamp < Date.now();
}

function readClientIp(request: Request): string {
  const headerValue =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for") ??
    request.headers.get("x-real-ip") ??
    "";
  const first = String(headerValue).split(",")[0]?.trim();
  return first || "unknown";
}

async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  const [version, salt, expectedHash] = String(passwordHash ?? "").split("$");
  if (version !== "v1" || !salt || !expectedHash) {
    return false;
  }
  const actualHash = await sha256Hex(`${salt}:${password}`);
  return timingSafeEqual(actualHash, expectedHash);
}

async function sha256Hex(input: string): Promise<string> {
  const buffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return mismatch === 0;
}

async function readActivity(namespace: KVNamespace, key: string): Promise<ActivityEntry[]> {
  const entries = await namespace.get<ActivityEntry[]>(key, "json");
  if (!Array.isArray(entries)) return [];
  return entries.filter((entry) => entry && typeof entry.ipHash === "string" && typeof entry.seenAt === "string");
}

function appendActivity(entries: ActivityEntry[], nextEntry: ActivityEntry): ActivityEntry[] {
  const cutoff = Date.now() - LOGIN_WINDOW_MS;
  const recentEntries = entries.filter((entry) => {
    const timestamp = Date.parse(entry.seenAt);
    return !Number.isNaN(timestamp) && timestamp >= cutoff;
  });
  recentEntries.push(nextEntry);
  return recentEntries.slice(-MAX_ACTIVITY_ENTRIES);
}

function countDistinctIps(entries: ActivityEntry[]): number {
  return new Set(entries.map((entry) => entry.ipHash)).size;
}
