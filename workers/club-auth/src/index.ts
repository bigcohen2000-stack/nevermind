import {
  CLUB_MEMBER_DEFAULT_EXPIRES_DAYS,
  DEEP_PAGE_VIEWS_KEY,
  INTEGRITY_REPORTS_KEY,
  MAX_DEEP_PAGE_VIEWS,
  MAX_INTEGRITY_REPORTS,
  PROGRESS_TOKEN_MAX_MS,
  buildSharedIdentityKey,
  appendActivity,
  checkRateLimit,
  countDistinctIps,
  createCorsHeaders,
  createPasswordHash,
  decodeBase64Url,
  encodeBase64Url,
  getPasswordHashVersion,
  isExpired,
  json,
  normalizeIdentityName,
  normalizePhone,
  readClientIp,
  requireAdminAuth,
  sha256Hex,
  timingSafeEqual,
  verifyPassword,
} from "./shared";
import {
  buildMemberTimeline,
  listKvKeys,
  readActivity,
  readDeepPageBeaconList,
  readFraudFlags,
  readIntegrityReports,
  readMemberSummaries,
  readRecentLogins,
} from "./admin-data";
import type {
  ActivityEntry,
  AdminAddMemberRequest,
  AdminResetPasswordRequest,
  DeepPageBeacon,
  Env,
  FraudFlagEntry,
  IntegrityReportEntry,
  LoginRequest,
  MemberProgressStored,
  ProgressTokenPayload,
  SharedAccessLogRequest,
  StoredMember,
} from "./types";

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

    if (request.method === "POST" && url.pathname === "/admin/shared-access-log") {
      return handleAdminSharedAccessLog(request, env, corsHeaders);
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
    const passwordHashVersion = getPasswordHashVersion(passwordHash);
    const isValidPassword = await verifyPassword(password, passwordHash);
    if (!isValidPassword) {
      return json({ ok: false, error: "הטלפון או הסיסמה לא תואמים." }, 401, corsHeaders);
    }

    const migratedPasswordHash =
      passwordHashVersion === "v1" ? await createPasswordHash(password) : passwordHash;

    const nowIso = new Date().toISOString();
    const userAgent = String(request.headers.get("user-agent") ?? "").slice(0, 240);
    const ip = readClientIp(request);
    const ipHash = await sha256Hex(`${env.CLUB_IP_PEPPER}:${ip}`);
    const passwordGroup = String(member.passwordGroup ?? migratedPasswordHash).trim();

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
      memberName: String(member.memberName ?? fallbackName ?? "").trim() || "חבר",
      userAgent,
      source: "LIVE",
      identityKey: `member:${phone}`,
      eventType: "login",
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
      passwordHash: migratedPasswordHash,
      passwordGroup,
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

async function handleAdminSharedAccessLog(request: Request, env: Env, headers: Headers): Promise<Response> {
  const auth = await requireAdminAuth(request, env, headers);
  if (auth instanceof Response) return auth;

  let payload: SharedAccessLogRequest | null = null;
  try {
    payload = (await request.json()) as SharedAccessLogRequest;
  } catch {
    return json({ ok: false, error: "הבקשה לא נקראה כמו שצריך." }, 400, headers);
  }

  const phone = normalizePhone(payload?.phone ?? "");
  const memberName = normalizeIdentityName(payload?.fullName ?? "");
  const path = String(payload?.path ?? "/me/unlock/").trim().slice(0, 500);
  const identityKey =
    String(payload?.identityKey ?? "").trim() || buildSharedIdentityKey(memberName, phone);
  const eventType = payload?.eventType === "heartbeat" ? "heartbeat" : "login";

  if (!phone || memberName.length < 2 || !identityKey) {
    return json({ ok: false, error: "צריך שם וטלפון תקינים." }, 400, headers);
  }

  const nowIso = new Date().toISOString();
  const forwardedIp = String(request.headers.get("x-nm-client-ip") ?? "").trim();
  const forwardedUserAgent = String(request.headers.get("x-nm-client-ua") ?? "").trim();
  const rawIp = forwardedIp || readClientIp(request);
  const ipHash = await sha256Hex(`${env.CLUB_IP_PEPPER}:${rawIp}`);
  const userAgent = (forwardedUserAgent || String(request.headers.get("user-agent") ?? "")).slice(0, 240);

  const memberActivityKey = `activity:shared:${identityKey}`;
  const memberActivity = await readActivity(env.CLUB_ACTIVITY, memberActivityKey);
  const nextEntry: ActivityEntry = {
    ipHash,
    seenAt: nowIso,
    path: path.startsWith("/") ? path : "/me/unlock/",
    phone,
    memberName,
    userAgent,
    source: "SHARED",
    identityKey,
    eventType,
  };
  const nextMemberActivity = appendActivity(memberActivity, nextEntry);

  await env.CLUB_ACTIVITY.put(memberActivityKey, JSON.stringify(nextMemberActivity));

  return json(
    {
      ok: true,
      phone,
      memberName,
      lastLoginAt: nowIso,
      identityKey,
      source: "SHARED",
      eventType,
    },
    200,
    headers
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
