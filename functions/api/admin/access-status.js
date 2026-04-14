import { isDashboardAuthorized, json, readAccessEmail, readAllowedAdminEmails } from "../../_lib/club-admin.js";

function readReturnTarget(request) {
  const requestUrl = new URL(request.url);
  const raw = String(requestUrl.searchParams.get("returnTo") ?? "").trim();
  if (!raw) return null;
  try {
    const parsed = new URL(raw);
    if (parsed.origin !== requestUrl.origin) return null;
    return parsed;
  } catch {
    return null;
  }
}

function buildAccessUrls(request) {
  const requestUrl = new URL(request.url);
  const returnTarget = readReturnTarget(request);
  const protectedUrl = returnTarget?.toString() ?? new URL("/", requestUrl.origin).toString();
  const challengeUrl = protectedUrl;
  const switchIdentityUrl = protectedUrl;

  return { challengeUrl, switchIdentityUrl };
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const urls = buildAccessUrls(request);

  if (isDashboardAuthorized(request, env) === false) {
    return json(
      {
        ok: false,
        error: "נדרשת גישת Cloudflare Access עם מייל מורשה.",
        allowedEmails: readAllowedAdminEmails(env),
        challengeUrl: urls.challengeUrl,
        switchIdentityUrl: urls.switchIdentityUrl,
      },
      401,
    );
  }

  const email = readAccessEmail(request);
  const identity = String(request.headers.get("Cf-Access-Authenticated-User-Identity") ?? "").trim();

  return json({
    ok: true,
    access: "cloudflare",
    email,
    identity,
    allowedEmails: readAllowedAdminEmails(env),
    challengeUrl: urls.challengeUrl,
    switchIdentityUrl: urls.switchIdentityUrl,
  });
}
