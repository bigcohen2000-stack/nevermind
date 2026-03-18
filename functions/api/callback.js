const GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token";

function getCookie(request, name) {
  const cookieHeader = request.headers.get("Cookie") || "";
  const cookies = cookieHeader.split(";").map((part) => part.trim());
  const prefix = `${name}=`;
  const match = cookies.find((cookie) => cookie.startsWith(prefix));
  return match ? decodeURIComponent(match.slice(prefix.length)) : null;
}

function clearStateCookie() {
  return "decap-cms-github-oauth-state=; Path=/api; Max-Age=0; HttpOnly; Secure; SameSite=Lax";
}

function renderMessage(message) {
  return `<!doctype html>
<html lang="he" dir="rtl">
  <body>
    <script>
      (function () {
        if (window.opener) {
          window.opener.postMessage(${JSON.stringify(message)}, window.location.origin);
        }
        window.close();
      })();
    </script>
  </body>
</html>`;
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  const error = url.searchParams.get("error");
  if (error) {
    return new Response(renderMessage(`authorization:github:error:${JSON.stringify({ error })}`), {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Set-Cookie": clearStateCookie(),
      },
    });
  }

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const storedState = getCookie(request, "decap-cms-github-oauth-state");

  if (!code || !state || !storedState || state !== storedState) {
    return new Response(renderMessage(`authorization:github:error:${JSON.stringify({ error: "Invalid OAuth state" })}`), {
      status: 400,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Set-Cookie": clearStateCookie(),
      },
    });
  }

  const redirectUri = `${url.origin}/api/callback`;
  const tokenResponse = await fetch(GITHUB_TOKEN_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: redirectUri,
      state,
    }),
  });

  const tokenData = await tokenResponse.json();

  if (!tokenResponse.ok || tokenData.error || !tokenData.access_token) {
    return new Response(
      renderMessage(`authorization:github:error:${JSON.stringify({ error: tokenData.error || "OAuth token exchange failed" })}`),
      {
        status: 400,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Set-Cookie": clearStateCookie(),
        },
      }
    );
  }

  const successPayload = {
    token: tokenData.access_token,
    provider: "github",
  };

  return new Response(
    renderMessage(`authorization:github:success:${JSON.stringify(successPayload)}`),
    {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Set-Cookie": clearStateCookie(),
      },
    }
  );
}
