import { isDashboardAuthorized, json } from "../../_lib/club-admin.js";

export async function onRequestGet(context) {
  const { request, env } = context;

  if (!isDashboardAuthorized(request, env)) {
    return json({ ok: false, error: "נדרשת גישת Cloudflare Access." }, 401);
  }

  const email = String(request.headers.get("Cf-Access-Authenticated-User-Email") ?? "").trim();
  const identity = String(request.headers.get("Cf-Access-Authenticated-User-Identity") ?? "").trim();

  return json({
    ok: true,
    access: "cloudflare",
    email,
    identity,
  });
}
