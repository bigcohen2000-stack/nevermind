interface Env {
  CLUB_MEMBERS: KVNamespace;
  CLUB_ACTIVITY: KVNamespace;
  CLUB_IP_PEPPER: string;
  ADMIN_PASSWORD: string;
  /** מפתח שירות לפרוקסי Pages (כותרת X-NM-Admin-Service). אופציונלי. */
  ADMIN_SERVICE_KEY?: string;
  /** כינוי ל־ADMIN_SERVICE_KEY (אותו ערך כמו ב־Pages). */
  NM_CLUB_ADMIN_SERVICE_KEY?: string;
  ALLOWED_ORIGINS?: string;
}

type LoginRequest = {
  phone?: string;
  password?: string;
  path?: string;
  fullName?: string;
};

type AdminLoginRequest = {
  password?: string;
};

type AdminResetPasswordRequest = {
  phone?: string;
  newPassword?: string;
};

type AdminAddMemberRequest = {
  phone?: string;
  password?: string;
  fullName?: string;
  expiresAt?: string;
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

type FraudFlagEntry = {
  phone: string;
  flaggedAt: string;
  memberIpCount?: number;
  passwordIpCount?: number;
  lastPath?: string;
};

/** Deep File: צפיות בדפים אחרי כניסה (בלי טלפון בגוף). */
type DeepPageBeacon = {
  path: string;
  seenAt: string;
  ipHash: string;
};

type IntegrityReportEntry = {
  pageUrl: string;
  pagePath: string;
  pageTitle?: string;
  selectedText?: string;
  note?: string;
  message?: string;
  reportedAt: string;
  reporterFingerprint: string;
  reporterAgent?: string;
};

type AdminMemberSummary = {
  phone: string;
  memberName: string;
  status: "active" | "paused" | "blocked";
  expiresAt: string;
  lastLoginAt: string;
  lastIpFingerprint: string;
  isActive: boolean;
  flaggedAt?: string;
};

type AdminMemberTimelineItem = {
  id: string;
  kind: "login" | "flag" | "membership";
  at: string;
  title: string;
  detail: string;
};

type MemberProgressStored = {
  articlesRead: string[];
  secondsRead: number;
  updatedAt: string;
  lastIpPrefix?: string;
};

type ProgressTokenPayload = {
  typ: "progress";
  phone: string;
  exp: number;
};

type AdminSessionPayload = {
  role: "admin";
  iat: number;
  exp: number;
  nonce: string;
};

const DEFAULT_ALLOWED_ORIGINS = [
  "https://www.nevermind.co.il",
  "https://nevermind.co.il",
  "http://localhost:4321",
];
const LOGIN_WINDOW_MS = 6 * 60 * 60 * 1000;
const MAX_ACTIVITY_ENTRIES = 12;
const ADMIN_SESSION_MS = 8 * 60 * 60 * 1000;
const RECENT_LOGIN_LIMIT = 24;
const FRAUD_FLAG_LIMIT = 24;
const KV_LIST_LIMIT = 1000;
const CLUB_MEMBER_DEFAULT_EXPIRES_DAYS = 365;
const DEEP_PAGE_VIEWS_KEY = "deep:page_views";
const MAX_DEEP_PAGE_VIEWS = 200;
const INTEGRITY_REPORTS_KEY = "feedback:integrity_reports";
const MAX_INTEGRITY_REPORTS = 120;
const PROGRESS_TOKEN_MAX_MS = 30 * 24 * 60 * 60 * 1000;

async function checkRateLimit(
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

async function createProgressToken(env: Env, phone: string, membershipExpiresAt: string): Promise<string> {
  const memberExpiryMs = Date.parse(membershipExpiresAt);
  const cap = Date.now() + PROGRESS_TOKEN_MAX_MS;
  const exp = Number.isFinite(memberExpiryMs) ? Math.min(memberExpiryMs, cap) : cap;
  const payload: ProgressTokenPayload = { typ: "progress", phone, exp };
  const encoded = encodeBase64Url(JSON.stringify(payload));
  const signature = await sha256Hex(`${env.CLUB_IP_PEPPER}:progress:${phone}:${encoded}`);
  return `${encoded}.${signature}`;
}

async function verifyProgressToken(token: string, env: Env): Promise<ProgressTokenPayload | null> {
  const parts = String(token || "").split(".");
  if (parts.length !== 2) return null;
  const [encoded, signature] = parts;
  if (!encoded || !signature) return null;
  let payload: ProgressTokenPayload;
  try {
    payload = JSON.parse(decodeBase64Url(encoded)) as ProgressTokenPayload;
  } catch {
    return null;
  }
  if (!payload || payload.typ !== "progress" || !payload.phone) return null;
  const expected = await sha256Hex(`${env.CLUB_IP_PEPPER}:progress:${payload.phone}:${encoded}`);
  if (!timingSafeEqual(signature, expected)) return null;
  if (!Number.isFinite(payload.exp) || payload.exp < Date.now()) return null;
  return payload;
}

async function readMemberProgress(env: Env, phone: string): Promise<MemberProgressStored> {
  const key = `progress:${phone}`;
  const raw = await env.CLUB_MEMBERS.get<MemberProgressStored>(key, "json");
  if (!raw || !Array.isArray(raw.articlesRead)) {
    return { articlesRead: [], secondsRead: 0, updatedAt: new Date(0).toISOString() };
  }
  return {
    articlesRead: raw.articlesRead.filter((s) => typeof s === "string"),
    secondsRead: Number.isFinite(raw.secondsRead) ? raw.secondsRead : 0,
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : new Date(0).toISOString(),
    lastIpPrefix: raw.lastIpPrefix,
  };
}

async function handleMemberProgressGet(
  request: Request,
  env: Env,
  ipHash: string,
  corsHeaders: Headers
): Promise<Response> {
  const authHeader = String(request.headers.get("authorization") ?? "").trim();
  if (!authHeader.startsWith("Bearer ")) {
    return json({ ok: false, error: "צריך טוקן התקדמות." }, 401, corsHeaders);
  }
  const token = authHeader.slice(7).trim();
  const payload = await verifyProgressToken(token, env);
  if (!payload) {
    return json({ ok: false, error: "הטוקן לא תקף או שפג." }, 401, corsHeaders);
  }
  const progress = await readMemberProgress(env, payload.phone);
  return json(
    {
      ok: true,
      phone: payload.phone,
      progress,
      lastIpPrefix: progress.lastIpPrefix ?? ipHash.slice(0, 8),
    },
    200,
    corsHeaders
  );
}

async function handleMemberProgressPost(
  request: Request,
  env: Env,
  ipHash: string,
  corsHeaders: Headers
): Promise<Response> {
  const authHeader = String(request.headers.get("authorization") ?? "").trim();
  if (!authHeader.startsWith("Bearer ")) {
    return json({ ok: false, error: "צריך טוקן התקדמות." }, 401, corsHeaders);
  }
  const token = authHeader.slice(7).trim();
  const tokenPayload = await verifyProgressToken(token, env);
  if (!tokenPayload) {
    return json({ ok: false, error: "הטוקן לא תקף או שפג." }, 401, corsHeaders);
  }

  let body: {
    articlesRead?: string[];
    setArticlesRead?: string[];
    secondsReadDelta?: number;
    replaceSecondsRead?: number;
  } | null = null;
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return json({ ok: false, error: "הבקשה לא נקראה כמו שצריך." }, 400, corsHeaders);
  }

  const prev = await readMemberProgress(env, tokenPayload.phone);
  let articlesRead = [...prev.articlesRead];
  if (Array.isArray(body?.setArticlesRead)) {
    articlesRead = body.setArticlesRead.map((s) => String(s).trim()).filter(Boolean);
  } else if (Array.isArray(body?.articlesRead)) {
    const add = body.articlesRead.map((s) => String(s).trim()).filter(Boolean);
    const set = new Set([...articlesRead, ...add]);
    articlesRead = [...set];
  }

  let secondsRead = prev.secondsRead;
  if (typeof body?.replaceSecondsRead === "number" && Number.isFinite(body.replaceSecondsRead) && body.replaceSecondsRead >= 0) {
    secondsRead = Math.floor(body.replaceSecondsRead);
  } else if (typeof body?.secondsReadDelta === "number" && Number.isFinite(body.secondsReadDelta)) {
    secondsRead = Math.max(0, Math.floor(prev.secondsRead + body.secondsReadDelta));
  }

  const updatedAt = new Date().toISOString();
  const next: MemberProgressStored = {
    articlesRead,
    secondsRead,
    updatedAt,
    lastIpPrefix: ipHash.slice(0, 12),
  };

  await env.CLUB_MEMBERS.put(`progress:${tokenPayload.phone}`, JSON.stringify(next));

  return json({ ok: true, progress: next }, 200, corsHeaders);
}

type InsightsStored = {
  text: string;
  updatedAt: string;
};

async function handleMemberInsightsGet(
  request: Request,
  env: Env,
  _ipHash: string,
  corsHeaders: Headers
): Promise<Response> {
  const authHeader = String(request.headers.get("authorization") ?? "").trim();
  if (!authHeader.startsWith("Bearer ")) {
    return json({ ok: false, error: "צריך טוקן התקדמות." }, 401, corsHeaders);
  }
  const token = authHeader.slice(7).trim();
  const payload = await verifyProgressToken(token, env);
  if (!payload) {
    return json({ ok: false, error: "הטוקן לא תקף או שפג." }, 401, corsHeaders);
  }
  const key = `insights:${payload.phone}`;
  const raw = await env.CLUB_MEMBERS.get(key);
  if (!raw) {
    return json({ ok: true, insights: { text: "", updatedAt: "" } }, 200, corsHeaders);
  }
  try {
    const parsed = JSON.parse(raw) as InsightsStored;
    return json(
      {
        ok: true,
        insights: {
          text: typeof parsed.text === "string" ? parsed.text : "",
          updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : "",
        },
      },
      200,
      corsHeaders
    );
  } catch {
    return json({ ok: true, insights: { text: "", updatedAt: "" } }, 200, corsHeaders);
  }
}

async function handleMemberInsightsPut(
  request: Request,
  env: Env,
  ipHash: string,
  corsHeaders: Headers
): Promise<Response> {
  const authHeader = String(request.headers.get("authorization") ?? "").trim();
  if (!authHeader.startsWith("Bearer ")) {
    return json({ ok: false, error: "צריך טוקן התקדמות." }, 401, corsHeaders);
  }
  const token = authHeader.slice(7).trim();
  const payload = await verifyProgressToken(token, env);
  if (!payload) {
    return json({ ok: false, error: "הטוקן לא תקף או שפג." }, 401, corsHeaders);
  }
  let body: { text?: string } | null = null;
  try {
    body = (await request.json()) as { text?: string };
  } catch {
    return json({ ok: false, error: "הבקשה לא נקראה כמו שצריך." }, 400, corsHeaders);
  }
  const text = String(body?.text ?? "").slice(0, 8000);
  const updatedAt = new Date().toISOString();
  const next: InsightsStored = { text, updatedAt };
  await env.CLUB_MEMBERS.put(`insights:${payload.phone}`, JSON.stringify(next));
  return json({ ok: true, insights: next, lastIpPrefix: ipHash.slice(0, 12) }, 200, corsHeaders);
}

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

    if (request.method === "POST" && url.pathname === "/log/club-page") {
      return handleClubPageBeacon(request, env, corsHeaders);
    }

    if (request.method === "POST" && url.pathname === "/admin/login") {
      return handleAdminLogin(request, env, corsHeaders);
    }

    if (request.method === "GET" && url.pathname === "/admin/overview") {
      return handleAdminOverview(request, env, corsHeaders);
    }

    if (request.method === "GET" && url.pathname === "/admin/member") {
      return handleAdminMemberDetail(request, env, corsHeaders);
    }

    if (request.method === "POST" && url.pathname === "/admin/integrity-report") {
      return handleAdminIntegrityReport(request, env, corsHeaders);
    }

    if (request.method === "POST" && url.pathname === "/admin/reset-password") {
      return handleAdminResetPassword(request, env, corsHeaders);
    }

    if (request.method === "POST" && url.pathname === "/admin/add-member") {
      return handleAdminAddMember(request, env, corsHeaders);
    }

    if (request.method === "GET" && url.pathname === "/member/progress") {
      const ip = readClientIp(request);
      const ipHash = await sha256Hex(`${env.CLUB_IP_PEPPER}:${ip}`);
      const limited = await checkRateLimit(env, ipHash, "progress_get", 120, 60, corsHeaders);
      if (limited) return limited;
      return handleMemberProgressGet(request, env, ipHash, corsHeaders);
    }

    if (request.method === "POST" && url.pathname === "/member/progress") {
      const ip = readClientIp(request);
      const ipHash = await sha256Hex(`${env.CLUB_IP_PEPPER}:${ip}`);
      const limited = await checkRateLimit(env, ipHash, "progress_post", 90, 60, corsHeaders);
      if (limited) return limited;
      return handleMemberProgressPost(request, env, ipHash, corsHeaders);
    }

    if (request.method === "GET" && url.pathname === "/member/insights") {
      const ip = readClientIp(request);
      const ipHash = await sha256Hex(`${env.CLUB_IP_PEPPER}:${ip}`);
      const limited = await checkRateLimit(env, ipHash, "insights_get", 120, 60, corsHeaders);
      if (limited) return limited;
      return handleMemberInsightsGet(request, env, ipHash, corsHeaders);
    }

    if (request.method === "PUT" && url.pathname === "/member/insights") {
      const ip = readClientIp(request);
      const ipHash = await sha256Hex(`${env.CLUB_IP_PEPPER}:${ip}`);
      const limited = await checkRateLimit(env, ipHash, "insights_put", 60, 60, corsHeaders);
      if (limited) return limited;
      return handleMemberInsightsPut(request, env, ipHash, corsHeaders);
    }

    if (request.method !== "POST" || !isLoginPath(url.pathname)) {
      return json({ ok: false, error: "הנתיב הזה לא נתמך." }, 404, corsHeaders);
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

    const ipEarly = readClientIp(request);
    const ipHashEarly = await sha256Hex(`${env.CLUB_IP_PEPPER}:${ipEarly}`);
    const loginLimited = await checkRateLimit(env, ipHashEarly, "login", 45, 60, corsHeaders);
    if (loginLimited) return loginLimited;

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
      return json({ ok: false, error: "הטלפון או הסיסמה לא תואמים." }, 401, corsHeaders);
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

    const progressToken = await createProgressToken(env, phone, expiresAt);

    return json(
      {
        ok: true,
        memberName: updatedMember.memberName,
        phone,
        expiresAt,
        lastLoginAt: nowIso,
        fraudFlag,
        liveStatus: "LIVE",
        progressToken,
      },
      200,
      corsHeaders
    );
  },
};

async function handleAdminLogin(request: Request, env: Env, headers: Headers): Promise<Response> {
  const ip = readClientIp(request);
  const ipHash = await sha256Hex(`${env.CLUB_IP_PEPPER}:${ip}`);
  const limited = await checkRateLimit(env, ipHash, "admin_login", 15, 60, headers);
  if (limited) return limited;

  let payload: AdminLoginRequest | null = null;
  try {
    payload = (await request.json()) as AdminLoginRequest;
  } catch {
    return json({ ok: false, error: "הבקשה לא נקראה כמו שצריך." }, 400, headers);
  }

  const password = String(payload?.password ?? "");
  if (!password) {
    return json({ ok: false, error: "צריך סיסמת ניהול." }, 400, headers);
  }

  if (!timingSafeEqual(password, String(env.ADMIN_PASSWORD ?? ""))) {
    return json({ ok: false, error: "סיסמת הניהול לא תואמת." }, 401, headers);
  }

  const now = Date.now();
  const token = await createAdminToken(env, now);
  return json(
    {
      ok: true,
      role: "admin",
      label: "Admin",
      token,
      loggedInAt: new Date(now).toISOString(),
      expiresAt: new Date(now + ADMIN_SESSION_MS).toISOString(),
    },
    200,
    headers
  );
}

async function handleAdminOverview(request: Request, env: Env, headers: Headers): Promise<Response> {
  const auth = await requireAdminAuth(request, env, headers);
  if (auth instanceof Response) return auth;

  const [memberKeys, memberSummaries, recentLogins, fraudFlags, deepRawList, integrityReportsRaw] = await Promise.all([
    listKvKeys(env.CLUB_MEMBERS, "member:"),
    readMemberSummaries(env.CLUB_MEMBERS),
    readRecentLogins(env.CLUB_ACTIVITY),
    readFraudFlags(env.CLUB_ACTIVITY),
    readDeepPageBeaconList(env.CLUB_ACTIVITY),
    readIntegrityReports(env.CLUB_ACTIVITY),
  ]);

  const pageViewBeacons = deepRawList
    .sort((left, right) => Date.parse(right.seenAt) - Date.parse(left.seenAt))
    .slice(0, 48)
    .map((entry) => ({
      path: entry.path,
      seenAt: entry.seenAt,
      ipFingerprint: entry.ipHash.slice(0, 8),
    }));

  const integrityReports = integrityReportsRaw
    .sort((left, right) => Date.parse(right.reportedAt) - Date.parse(left.reportedAt))
    .slice(0, 48);

  return json(
    {
      ok: true,
      stats: {
        members: memberKeys.length,
        recentLogins: recentLogins.length,
        flaggedMembers: fraudFlags.length,
        lastFlaggedAt: fraudFlags[0]?.flaggedAt ?? "",
        pageViewBeacons: deepRawList.length,
        integrityReports: integrityReportsRaw.length,
        lastIntegrityAt: integrityReports[0]?.reportedAt ?? "",
      },
      members: memberSummaries,
      recentLogins,
      fraudFlags,
      pageViewBeacons,
      integrityReports,
    },
    200,
    headers
  );
}

async function handleAdminAddMember(request: Request, env: Env, headers: Headers): Promise<Response> {
  const auth = await requireAdminAuth(request, env, headers);
  if (auth instanceof Response) return auth;

  const ip = readClientIp(request);
  const ipHash = await sha256Hex(`${env.CLUB_IP_PEPPER}:${ip}`);
  const limited = await checkRateLimit(env, ipHash, "admin_add", 20, 60, headers);
  if (limited) return limited;

  let payload: AdminAddMemberRequest | null = null;
  try {
    payload = (await request.json()) as AdminAddMemberRequest;
  } catch {
    return json({ ok: false, error: "הבקשה לא נקראה כמו שצריך." }, 400, headers);
  }

  const phone = normalizePhone(payload?.phone ?? "");
  const password = String(payload?.password ?? "").trim();
  const fullName = String(payload?.fullName ?? "").trim();
  const expiresAtRaw = String(payload?.expiresAt ?? "").trim();

  if (!phone || !password) {
    return json({ ok: false, error: "צריך טלפון וסיסמה." }, 400, headers);
  }

  let expiresAtIso: string;
  if (expiresAtRaw) {
    const ts = Date.parse(expiresAtRaw);
    if (Number.isNaN(ts)) {
      return json({ ok: false, error: "expiresAt לא תקין." }, 400, headers);
    }
    expiresAtIso = new Date(ts).toISOString();
  } else {
    expiresAtIso = new Date(Date.now() + CLUB_MEMBER_DEFAULT_EXPIRES_DAYS * 24 * 60 * 60 * 1000).toISOString();
  }

  const memberKey = `member:${phone}`;
  const existing = await env.CLUB_MEMBERS.get<StoredMember>(memberKey, "json");
  if (existing) {
    const existingExpiresAt = String(existing.expiresAt ?? "").trim();
    const isExistingActive =
      Boolean(existingExpiresAt) &&
      !isExpired(existingExpiresAt) &&
      String(existing.status ?? "active") !== "blocked" &&
      String(existing.status ?? "active") !== "paused";
    if (isExistingActive) {
      return json({ ok: false, error: "חבר פעיל כבר קיים לטלפון הזה." }, 409, headers);
    }
  }

  const passwordHash = await createPasswordHash(password);
  const updatedAt = new Date().toISOString();
  const updatedMember: StoredMember = {
    memberName: fullName || "חבר",
    phone,
    passwordHash,
    passwordGroup: passwordHash,
    expiresAt: expiresAtIso,
    status: "active",
    lastLoginAt: existing?.lastLoginAt,
    lastIpHash: existing?.lastIpHash,
  };

  await env.CLUB_MEMBERS.put(memberKey, JSON.stringify(updatedMember));

  return json(
    {
      ok: true,
      phone,
      memberName: updatedMember.memberName,
      expiresAt: updatedMember.expiresAt,
      updatedAt,
    },
    200,
    headers
  );
}

async function handleAdminResetPassword(request: Request, env: Env, headers: Headers): Promise<Response> {
  const auth = await requireAdminAuth(request, env, headers);
  if (auth instanceof Response) return auth;

  const ip = readClientIp(request);
  const ipHash = await sha256Hex(`${env.CLUB_IP_PEPPER}:${ip}`);
  const limited = await checkRateLimit(env, ipHash, "admin_reset", 20, 60, headers);
  if (limited) return limited;

  let payload: AdminResetPasswordRequest | null = null;
  try {
    payload = (await request.json()) as AdminResetPasswordRequest;
  } catch {
    return json({ ok: false, error: "הבקשה לא נקראה כמו שצריך." }, 400, headers);
  }

  const phone = normalizePhone(payload?.phone ?? "");
  const newPassword = String(payload?.newPassword ?? "").trim();

  if (!phone || !newPassword) {
    return json({ ok: false, error: "צריך טלפון וסיסמה חדשה." }, 400, headers);
  }

  const memberKey = `member:${phone}`;
  const member = await env.CLUB_MEMBERS.get<StoredMember>(memberKey, "json");
  if (!member) {
    return json({ ok: false, error: "לא מצאנו חבר עם הטלפון הזה." }, 404, headers);
  }

  const passwordHash = await createPasswordHash(newPassword);
  const updatedAt = new Date().toISOString();
  const updatedMember: StoredMember = {
    ...member,
    phone,
    passwordHash,
    passwordGroup: passwordHash,
  };

  await env.CLUB_MEMBERS.put(memberKey, JSON.stringify(updatedMember));

  return json(
    {
      ok: true,
      phone,
      updatedAt,
    },
    200,
    headers
  );
}

function isLoginPath(pathname: string): boolean {
  return pathname === "/" || pathname === "/auth/login";
}

function createCorsHeaders(request: Request, env: Env): Headers {
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

async function createPasswordHash(password: string): Promise<string> {
  const salt = randomHex(16);
  const digest = await sha256Hex(`${salt}:${password}`);
  return `v1$${salt}$${digest}`;
}

function randomHex(bytes: number): string {
  const buffer = new Uint8Array(bytes);
  crypto.getRandomValues(buffer);
  return Array.from(buffer)
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
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

async function createAdminToken(env: Env, nowMs: number): Promise<string> {
  const payload: AdminSessionPayload = {
    role: "admin",
    iat: nowMs,
    exp: nowMs + ADMIN_SESSION_MS,
    nonce: randomHex(12),
  };
  const encodedPayload = encodeBase64Url(JSON.stringify(payload));
  const signature = await sha256Hex(`${env.CLUB_IP_PEPPER}:${env.ADMIN_PASSWORD}:${encodedPayload}`);
  return `${encodedPayload}.${signature}`;
}

async function requireAdminAuth(request: Request, env: Env, headers: Headers): Promise<AdminSessionPayload | Response> {
  const serviceSecret = String(env.ADMIN_SERVICE_KEY ?? env.NM_CLUB_ADMIN_SERVICE_KEY ?? "").trim();
  const serviceHeader = String(request.headers.get("x-nm-admin-service") ?? "").trim();
  if (serviceSecret && serviceHeader) {
    if (timingSafeEqual(serviceHeader, serviceSecret)) {
      const nowMs = Date.now();
      return { role: "admin", iat: nowMs, exp: nowMs + ADMIN_SESSION_MS, nonce: "service" };
    }
  }

  const authHeader = String(request.headers.get("authorization") ?? "").trim();
  if (!authHeader.startsWith("Bearer ")) {
    return json({ ok: false, error: "צריך כניסת ניהול." }, 401, headers);
  }
  const token = authHeader.slice(7).trim();
  const payload = await verifyAdminToken(token, env);
  if (!payload) {
    return json({ ok: false, error: "הגישה לניהול כבר לא פעילה." }, 401, headers);
  }
  return payload;
}

async function verifyAdminToken(token: string, env: Env): Promise<AdminSessionPayload | null> {
  const parts = String(token || "").split(".");
  if (parts.length !== 2) return null;
  const [encodedPayload, signature] = parts;
  if (!encodedPayload || !signature) return null;
  const expectedSignature = await sha256Hex(`${env.CLUB_IP_PEPPER}:${env.ADMIN_PASSWORD}:${encodedPayload}`);
  if (!timingSafeEqual(signature, expectedSignature)) return null;

  try {
    const payload = JSON.parse(decodeBase64Url(encodedPayload)) as AdminSessionPayload;
    if (!payload || payload.role !== "admin") return null;
    if (!Number.isFinite(payload.exp) || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

function encodeBase64Url(input: string): string {
  return btoa(input).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodeBase64Url(input: string): string {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return atob(`${normalized}${padding}`);
}

async function listKvKeys(namespace: KVNamespace, prefix: string): Promise<string[]> {
  let cursor: string | undefined;
  const keys: string[] = [];

  do {
    const page = await namespace.list({ prefix, cursor, limit: KV_LIST_LIMIT });
    keys.push(...page.keys.map((entry) => entry.name));
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);

  return keys;
}

async function readRecentLogins(namespace: KVNamespace): Promise<Array<Record<string, string>>> {
  const keys = await listKvKeys(namespace, "activity:member:");
  const entries = await Promise.all(keys.map((key) => namespace.get<ActivityEntry[]>(key, "json")));

  return entries
    .flatMap((list) => (Array.isArray(list) ? list : []))
    .filter((entry) => entry && typeof entry.seenAt === "string")
    .sort((left, right) => Date.parse(right.seenAt) - Date.parse(left.seenAt))
    .slice(0, RECENT_LOGIN_LIMIT)
    .map((entry) => ({
      phone: entry.phone,
      seenAt: entry.seenAt,
      path: entry.path,
      userAgent: entry.userAgent,
      ipFingerprint: entry.ipHash.slice(0, 8),
    }));
}

async function readMemberSummaries(namespace: KVNamespace): Promise<AdminMemberSummary[]> {
  const keys = await listKvKeys(namespace, "member:");
  const members = await Promise.all(keys.map((key) => namespace.get<StoredMember>(key, "json")));

  return members
    .filter((entry): entry is StoredMember => Boolean(entry && typeof entry.phone === "string"))
    .map((entry) => {
      const expiresAt = String(entry.expiresAt ?? "").trim();
      const lastLoginAt = String(entry.lastLoginAt ?? "").trim();
      const status = String(entry.status ?? "active") as AdminMemberSummary["status"];
      const isActive = Boolean(expiresAt) && !isExpired(expiresAt) && status === "active";
      return {
        phone: String(entry.phone ?? "").trim(),
        memberName: String(entry.memberName ?? "חבר").trim() || "חבר",
        status,
        expiresAt,
        lastLoginAt,
        lastIpFingerprint: String(entry.lastIpHash ?? "").slice(0, 8),
        isActive,
        flaggedAt: String(entry.flaggedAt ?? "").trim() || undefined,
      } satisfies AdminMemberSummary;
    })
    .sort((left, right) => {
      const leftLast = Date.parse(left.lastLoginAt || left.expiresAt || "1970-01-01T00:00:00.000Z");
      const rightLast = Date.parse(right.lastLoginAt || right.expiresAt || "1970-01-01T00:00:00.000Z");
      return rightLast - leftLast;
    })
    .slice(0, 160);
}

function buildMemberTimeline(member: StoredMember, activity: ActivityEntry[]): AdminMemberTimelineItem[] {
  const items: AdminMemberTimelineItem[] = [];
  const expiresAt = String(member.expiresAt ?? "").trim();
  const status = String(member.status ?? "active").trim() || "active";

  if (expiresAt) {
    items.push({
      id: `membership:${expiresAt}`,
      kind: "membership",
      at: expiresAt,
      title: status === "active" ? "חברות פעילה" : "חברות דורשת בדיקה",
      detail: status === "active" ? `הגישה פתוחה עד ${expiresAt}` : `סטטוס נוכחי: ${status}`,
    });
  }

  if (member.flaggedAt) {
    items.push({
      id: `flag:${member.flaggedAt}`,
      kind: "flag",
      at: member.flaggedAt,
      title: "נפתח Flag",
      detail: "זוהה דפוס כניסה שדורש בדיקה ידנית.",
    });
  }

  for (const entry of activity) {
    items.push({
      id: `login:${entry.seenAt}:${entry.ipHash}`,
      kind: "login",
      at: entry.seenAt,
      title: "כניסה של חבר",
      detail: `${entry.path || "/"} • ${entry.userAgent || "דפדפן לא זוהה"}`,
    });
  }

  return items
    .sort((left, right) => Date.parse(right.at) - Date.parse(left.at))
    .slice(0, 12);
}

async function readFraudFlags(namespace: KVNamespace): Promise<FraudFlagEntry[]> {
  const keys = await listKvKeys(namespace, "flag:");
  const entries = await Promise.all(keys.map((key) => namespace.get<FraudFlagEntry>(key, "json")));

  return entries
    .filter((entry): entry is FraudFlagEntry => Boolean(entry && typeof entry.phone === "string" && typeof entry.flaggedAt === "string"))
    .sort((left, right) => Date.parse(right.flaggedAt) - Date.parse(left.flaggedAt))
    .slice(0, FRAUD_FLAG_LIMIT);
}

async function readDeepPageBeaconList(namespace: KVNamespace): Promise<DeepPageBeacon[]> {
  const raw = await namespace.get<DeepPageBeacon[]>(DEEP_PAGE_VIEWS_KEY, "json");
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (entry) =>
      entry &&
      typeof entry.path === "string" &&
      typeof entry.seenAt === "string" &&
      typeof entry.ipHash === "string"
  );
}

async function readIntegrityReports(namespace: KVNamespace): Promise<IntegrityReportEntry[]> {
  const raw = await namespace.get<IntegrityReportEntry[]>(INTEGRITY_REPORTS_KEY, "json");
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (entry) =>
      entry &&
      typeof entry.pageUrl === "string" &&
      typeof entry.pagePath === "string" &&
      typeof entry.reportedAt === "string" &&
      typeof entry.reporterFingerprint === "string"
  );
}

async function handleAdminMemberDetail(request: Request, env: Env, headers: Headers): Promise<Response> {
  const auth = await requireAdminAuth(request, env, headers);
  if (auth instanceof Response) return auth;

  const url = new URL(request.url);
  const phone = normalizePhone(url.searchParams.get("phone") ?? "");
  if (!phone) {
    return json({ ok: false, error: "צריך טלפון לחיפוש." }, 400, headers);
  }

  const member = await env.CLUB_MEMBERS.get<StoredMember>(`member:${phone}`, "json");
  if (!member || typeof member.phone !== "string") {
    return json({ ok: false, error: "לא מצאנו חבר עם הטלפון הזה." }, 404, headers);
  }

  const [activity, fraudFlags] = await Promise.all([
    readActivity(env.CLUB_ACTIVITY, `activity:member:${phone}`),
    readFraudFlags(env.CLUB_ACTIVITY),
  ]);
  const relevantFlags = fraudFlags.filter((entry) => entry.phone === phone).slice(0, 4);
  const timeline = buildMemberTimeline(member, activity);

  return json(
    {
      ok: true,
      member: {
        phone,
        memberName: String(member.memberName ?? "חבר").trim() || "חבר",
        status: String(member.status ?? "active").trim() || "active",
        expiresAt: String(member.expiresAt ?? "").trim(),
        lastLoginAt: String(member.lastLoginAt ?? "").trim(),
        lastIpFingerprint: String(member.lastIpHash ?? "").slice(0, 8),
        flaggedAt: String(member.flaggedAt ?? "").trim(),
      },
      recentActivity: activity
        .sort((left, right) => Date.parse(right.seenAt) - Date.parse(left.seenAt))
        .slice(0, 12)
        .map((entry) => ({
          seenAt: entry.seenAt,
          path: entry.path,
          userAgent: entry.userAgent,
          ipFingerprint: entry.ipHash.slice(0, 8),
        })),
      fraudFlags: relevantFlags,
      timeline,
    },
    200,
    headers
  );
}

async function handleAdminIntegrityReport(request: Request, env: Env, headers: Headers): Promise<Response> {
  const auth = await requireAdminAuth(request, env, headers);
  if (auth instanceof Response) return auth;

  let payload:
    | {
        pageUrl?: string;
        pagePath?: string;
        pageTitle?: string;
        selectedText?: string;
        note?: string;
        message?: string;
      }
    | null = null;
  try {
    payload = (await request.json()) as typeof payload;
  } catch {
    return json({ ok: false, error: "הבקשה לא נקראה כמו שצריך." }, 400, headers);
  }

  const pageUrl = String(payload?.pageUrl ?? "").trim().slice(0, 500);
  const pagePath = String(payload?.pagePath ?? "").trim().slice(0, 240);
  const pageTitle = String(payload?.pageTitle ?? "").trim().slice(0, 180);
  const selectedText = String(payload?.selectedText ?? "").trim().slice(0, 500);
  const note = String(payload?.note ?? "").trim().slice(0, 1600);
  const message = String(payload?.message ?? "").trim().slice(0, 3200);

  if (!pageUrl && !pagePath) {
    return json({ ok: false, error: "חסר קישור לעמוד." }, 400, headers);
  }

  const ip = readClientIp(request);
  const ipHash = await sha256Hex(`${env.CLUB_IP_PEPPER}:${ip}`);
  const nowIso = new Date().toISOString();
  const entry: IntegrityReportEntry = {
    pageUrl: pageUrl || pagePath,
    pagePath: pagePath || "/",
    pageTitle,
    selectedText,
    note,
    message,
    reportedAt: nowIso,
    reporterFingerprint: ipHash.slice(0, 12),
    reporterAgent: String(request.headers.get("user-agent") ?? "").trim().slice(0, 180),
  };

  const existing = await readIntegrityReports(env.CLUB_ACTIVITY);
  const next = [entry, ...existing]
    .sort((left, right) => Date.parse(right.reportedAt) - Date.parse(left.reportedAt))
    .slice(0, MAX_INTEGRITY_REPORTS);

  await env.CLUB_ACTIVITY.put(INTEGRITY_REPORTS_KEY, JSON.stringify(next));

  return json({ ok: true, reportedAt: nowIso }, 200, headers);
}

async function handleClubPageBeacon(request: Request, env: Env, headers: Headers): Promise<Response> {
  let payload: { path?: string } | null = null;
  try {
    payload = (await request.json()) as { path?: string };
  } catch {
    return json({ ok: false, error: "הבקשה לא נקראה כמו שצריך." }, 400, headers);
  }

  const path = String(payload?.path ?? "").trim().slice(0, 500);
  if (!path || !path.startsWith("/")) {
    return json({ ok: false, error: "חסר נתיב תקין." }, 400, headers);
  }

  const nowIso = new Date().toISOString();
  const ip = readClientIp(request);
  const ipHash = await sha256Hex(`${env.CLUB_IP_PEPPER}:${ip}`);
  const entry: DeepPageBeacon = { path, seenAt: nowIso, ipHash };

  const existing = await readDeepPageBeaconList(env.CLUB_ACTIVITY);
  const next = [...existing, entry].slice(-MAX_DEEP_PAGE_VIEWS);

  try {
    await env.CLUB_ACTIVITY.put(DEEP_PAGE_VIEWS_KEY, JSON.stringify(next));
  } catch {
    return json({ ok: false, error: "שמירה נכשלה." }, 502, headers);
  }

  return json({ ok: true }, 200, headers);
}
