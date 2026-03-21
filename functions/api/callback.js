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

function renderMessage(status, content) {
  const payload = `authorization:github:${status}:${JSON.stringify(content)}`;
  const title = status === "success" ? "האישור הושלם" : "ההתחברות נכשלה";
  const body =
    status === "success"
      ? "האישור התקבל. אפשר לסגור את החלון ולחזור למערכת הניהול."
      : "המערכת לא הצליחה להשלים את ההתחברות. חזרו למערכת הניהול ונסו שוב.";

  return `<!doctype html>
<html lang="he" dir="rtl">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background: #f9f8f6;
        color: #1a1a1a;
        font-family: Assistant, system-ui, sans-serif;
      }

      main {
        width: min(92vw, 32rem);
        padding: 2rem;
        border: 1px solid rgba(26, 26, 26, 0.12);
        border-radius: 1.5rem;
        background: rgba(255, 255, 255, 0.92);
        box-shadow: 0 20px 40px rgba(26, 26, 26, 0.08);
        text-align: center;
      }

      h1 {
        margin: 0 0 0.75rem;
        font-size: 1.4rem;
      }

      p {
        margin: 0;
        line-height: 1.7;
      }

      a {
        display: inline-flex;
        margin-top: 1.5rem;
        padding: 0.8rem 1.2rem;
        border-radius: 999px;
        background: #1a1a1a;
        color: #f9f8f6;
        text-decoration: none;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>${title}</h1>
      <p>${body}</p>
      <a href="/admin/">חזרה למערכת הניהול</a>
    </main>
    <script>
      (function () {
        const authPayload = ${JSON.stringify(payload)};

        const storeFallback = () => {
          try {
            localStorage.setItem("decap-cms-oauth-result", authPayload);
          } catch {}
        };

        const finishWithoutPopup = () => {
          storeFallback();
          setTimeout(() => {
            window.location.replace("/admin/");
          }, 400);
        };

        if (!window.opener || window.opener.closed) {
          finishWithoutPopup();
          return;
        }

        function receiveMessage(event) {
          try {
            window.opener.postMessage(authPayload, event.origin);
          } catch {
            storeFallback();
          }

          window.removeEventListener("message", receiveMessage, false);
          setTimeout(() => window.close(), 150);
        }

        window.addEventListener("message", receiveMessage, false);

        try {
          window.opener.postMessage("authorizing:github", "*");
        } catch {
          finishWithoutPopup();
        }
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
    return new Response(renderMessage("error", { error }), {
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
    return new Response(renderMessage("error", { error: "Invalid OAuth state" }), {
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
      renderMessage("error", { error: tokenData.error || "OAuth token exchange failed" }),
      {
        status: 400,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Set-Cookie": clearStateCookie(),
        },
      }
    );
  }

  return new Response(
    renderMessage("success", {
      token: tokenData.access_token,
      provider: "github",
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Set-Cookie": clearStateCookie(),
      },
    }
  );
}
