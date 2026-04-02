function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function resolveAccessKey(env) {
  return String(env.WEB3FORMS_ACCESS_KEY ?? env.PUBLIC_WEB3FORMS_ACCESS_KEY ?? "").trim();
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const accessKey = resolveAccessKey(env);
  if (!accessKey) {
    return json({ ok: false, success: false, error: "missing_form_access_key", message: "שרת הטפסים עדיין לא הוגדר בפריסה." }, 503);
  }

  let incoming;
  try {
    incoming = await request.formData();
  } catch {
    return json({ ok: false, success: false, error: "invalid_form_body", message: "גוף הטופס לא הגיע בפורמט תקין." }, 400);
  }

  const outbound = new FormData();
  for (const [key, value] of incoming.entries()) {
    if (key === "access_key") continue;
    if (typeof value === "string") {
      outbound.append(key, value);
      continue;
    }
    outbound.append(key, value, value.name);
  }

  outbound.set("access_key", accessKey);

  const name = String(incoming.get("name") ?? "").trim();
  const email = String(incoming.get("email") ?? "").trim();
  if (name && !String(incoming.get("from_name") ?? "").trim()) {
    outbound.set("from_name", name);
  }
  if (email && !String(incoming.get("replyto") ?? "").trim()) {
    outbound.set("replyto", email);
  }

  try {
    const response = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { Accept: "application/json" },
      body: outbound,
    });

    let payload = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    if (!response.ok || payload?.success !== true) {
      return json(
        {
          ok: false,
          success: false,
          error: typeof payload?.message === "string" && payload.message.trim() ? payload.message.trim() : "form_submit_failed",
          message: "שרת הטפסים לא אישר קבלה כרגע.",
          providerStatus: response.status,
        },
        response.ok ? 502 : response.status,
      );
    }

    return json({ ok: true, success: true, message: "accepted" }, 200);
  } catch {
    return json({ ok: false, success: false, error: "form_provider_unreachable", message: "שרת השליחה לא זמין כרגע." }, 502);
  }
}