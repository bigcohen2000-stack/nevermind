function trimEnv(env, key) {
  return String(env?.[key] ?? "").trim();
}

function sanitizeTagToken(value) {
  return String(value ?? "")
    .trim()
    .replace(/[^A-Za-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 256);
}

export function resolveResendConfig(env) {
  const apiKey = trimEnv(env, "RESEND_API_KEY");
  const from = trimEnv(env, "RESEND_FROM_EMAIL");
  const to = trimEnv(env, "RESEND_TO_EMAIL") || from;

  return {
    apiKey,
    from,
    to,
    enabled: Boolean(apiKey && from && to),
  };
}

export async function sendResendEmail(env, payload) {
  const config = resolveResendConfig(env);
  if (!config.enabled) {
    return { ok: false, skipped: true, error: "missing_mail_delivery_config" };
  }

  const body = {
    from: config.from,
    to: [config.to],
    subject: String(payload?.subject ?? "").trim() || "NeverMind",
    text: String(payload?.text ?? "").trim() || "",
  };

  const replyTo = String(payload?.replyTo ?? "").trim();
  if (replyTo) {
    body.reply_to = replyTo;
  }

  const html = String(payload?.html ?? "").trim();
  if (html) {
    body.html = html;
  }

  const tags = Array.isArray(payload?.tags)
    ? payload.tags
        .map((tag) => {
          const name = sanitizeTagToken(tag?.name);
          const value = sanitizeTagToken(tag?.value);
          if (!name || !value) return null;
          return { name, value };
        })
        .filter(Boolean)
    : [];

  if (tags.length > 0) {
    body.tags = tags;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.id) {
      const message =
        typeof result?.message === "string" && result.message.trim()
          ? result.message.trim()
          : Array.isArray(result?.errors) && result.errors.length > 0
            ? String(result.errors[0]?.message ?? "").trim() || "resend_rejected"
            : "resend_rejected";
      return { ok: false, skipped: false, error: message };
    }

    return {
      ok: true,
      skipped: false,
      error: "",
      id: String(result.id),
    };
  } catch {
    return { ok: false, skipped: false, error: "resend_unreachable" };
  }
}
