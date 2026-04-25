const CANONICAL_HOST = "www.nevermind.co.il";
const APEX_HOST = "nevermind.co.il";
const PRIVATE_API_PREFIXES = ["/api/admin", "/api/dashboard", "/api/club-admin", "/api/site"];

function shouldRedirectToCanonical(url) {
  if (url.hostname !== APEX_HOST) return false;
  const path = url.pathname || "/";
  return (
    path.startsWith("/admin") ||
    path.startsWith("/dashboard") ||
    path.startsWith("/api/admin") ||
    path.startsWith("/api/dashboard") ||
    path.startsWith("/api/club-admin")
  );
}

function withApiSecurityHeaders(pathname, response) {
  if (!pathname.startsWith("/api/")) return response;
  const headers = new Headers(response.headers);
  headers.set("X-Robots-Tag", "noindex, nofollow, noarchive, nosnippet");
  const isPrivateApi = PRIVATE_API_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  headers.set("Cache-Control", isPrivateApi ? "private, no-store" : "no-store");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export async function onRequest(context) {
  const url = new URL(context.request.url);

  if (shouldRedirectToCanonical(url)) {
    url.hostname = CANONICAL_HOST;
    return Response.redirect(url.toString(), 302);
  }

  const response = await context.next();
  return withApiSecurityHeaders(url.pathname, response);
}

