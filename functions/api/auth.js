const GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize";

function buildCookie(name, value, options = {}) {
  const parts = [`${name}=${value}`];
  if (options.path) parts.push(`Path=${options.path}`);
  if (options.maxAge) parts.push(`Max-Age=${options.maxAge}`);
  if (options.httpOnly) parts.push("HttpOnly");
  if (options.secure) parts.push("Secure");
  if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);
  return parts.join("; ");
}

export async function onRequestGet(context) {
  const { request, env } = context;

  if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
    return new Response("Missing GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET", { status: 500 });
  }

  const url = new URL(request.url);
  const state = crypto.randomUUID();
  const redirectUri = `${url.origin}/api/callback`;

  const githubUrl = new URL(GITHUB_AUTHORIZE_URL);
  githubUrl.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
  githubUrl.searchParams.set("redirect_uri", redirectUri);
  githubUrl.searchParams.set("scope", env.GITHUB_OAUTH_SCOPE || "repo");
  githubUrl.searchParams.set("state", state);

  return new Response(null, {
    status: 302,
    headers: {
      Location: githubUrl.toString(),
      "Set-Cookie": buildCookie("decap-cms-github-oauth-state", state, {
        path: "/api",
        maxAge: 600,
        httpOnly: true,
        secure: true,
        sameSite: "Lax",
      }),
    },
  });
}
