const CANONICAL_HOST = "www.nevermind.co.il";
const APEX_HOST = "nevermind.co.il";

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

export async function onRequest(context) {
  const url = new URL(context.request.url);

  if (shouldRedirectToCanonical(url)) {
    url.hostname = CANONICAL_HOST;
    return Response.redirect(url.toString(), 302);
  }

  return context.next();
}

