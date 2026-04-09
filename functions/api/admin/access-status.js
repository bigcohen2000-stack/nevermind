import { isDashboardAuthorized, json, readAccessEmail, readAllowedAdminEmails } from "../../_lib/club-admin.js";

export async function onRequestGet(context) {
  const { request, env } = context;

  if (!isDashboardAuthorized(request, env)) {
    return json(
      {
        ok: false,
        error: "נדרשת גישת Cloudflare Access עם מייל מורשה.",
        allowedEmails: readAllowedAdminEmails(env),
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
  });
}
