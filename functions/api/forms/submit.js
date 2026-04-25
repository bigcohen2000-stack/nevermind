import { sendResendEmail } from "../../_lib/resend.js";
import { checkRateLimit, rateLimitResponse } from "../../_lib/rate-limit.js";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function readString(formData, key, max = 2000) {
  return String(formData.get(key) ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

// Basic RFC 5322-compatible email check
function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(value ?? "").trim());
}

async function verifyHcaptcha(token, secretKey) {
  if (!secretKey) return true; // skip if not configured
  if (!token) return false;
  try {
    const res = await fetch("https://api.hcaptcha.com/siteverify", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret: secretKey, response: token }),
    });
    const data = await res.json().catch(() => null);
    return data?.success === true;
  } catch {
    return false;
  }
}

function buildMailText(payload) {
  const lines = [
    `עמוד: ${payload.page || "לא צוין"}`,
    `שם: ${payload.name || "לא צוין"}`,
    `אימייל: ${payload.email || "לא צוין"}`,
    payload.phone ? `טלפון: ${payload.phone}` : "",
    "",
    payload.message || "אין תוכן",
  ].filter(Boolean);

  return lines.join("\n");
}

export async function onRequestPost(context) {
  const { request, env } = context;

  const rl = checkRateLimit(request, "form_submit", { max: 5, windowMs: 60_000 });
  if (!rl.ok) return rateLimitResponse(rl.retryAfter);

  let incoming;
  try {
    incoming = await request.formData();
  } catch {
    return json({ ok: false, success: false, error: "invalid_request", message: "גוף הטופס לא הגיע בפורמט תקין." }, 400);
  }

  const payload = {
    subject: readString(incoming, "subject", 180) || "פנייה מהאתר | NeverMind",
    page: readString(incoming, "page", 80),
    name: readString(incoming, "name", 120),
    email: readString(incoming, "email", 160),
    phone: readString(incoming, "phone", 80),
    message: String(incoming.get("message") ?? "").trim().slice(0, 5000),
  };

  if (payload.email && !isValidEmail(payload.email)) {
    return json({ ok: false, success: false, error: "invalid_request", message: "כתובת המייל אינה תקינה." }, 400);
  }

  const hcaptchaToken = readString(incoming, "h-captcha-response", 2048);
  const hcaptchaSecret = String(env.HCAPTCHA_SECRET_KEY ?? "").trim();
  const captchaOk = await verifyHcaptcha(hcaptchaToken, hcaptchaSecret);
  if (!captchaOk) {
    return json({ ok: false, success: false, error: "invalid_request", message: "אימות האנושיות נכשל. נסה שוב." }, 400);
  }

  const sent = await sendResendEmail(env, {
    subject: payload.subject,
    replyTo: payload.email,
    text: buildMailText(payload),
    tags: [
      { name: "source", value: "site_form" },
      { name: "page", value: payload.page || "unknown" },
    ],
  });

  if (!sent.ok) {
    if (sent.skipped) {
      return json(
        {
          ok: false,
          success: false,
          error: "service_unavailable",
          message: "שירות השליחה אינו זמין כרגע.",
        },
        503,
      );
    }

    return json(
      {
        ok: false,
        success: false,
        error: "send_failed",
        message: "השליחה נכשלה. אפשר לנסות שוב או לפנות בוואטסאפ.",
      },
      502,
    );
  }

  return json({ ok: true, success: true, message: "accepted" }, 200);
}
