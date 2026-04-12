import { sendResendEmail } from "../../_lib/resend.js";

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

  let incoming;
  try {
    incoming = await request.formData();
  } catch {
    return json({ ok: false, success: false, error: "invalid_form_body", message: "גוף הטופס לא הגיע בפורמט תקין." }, 400);
  }

  const payload = {
    subject: readString(incoming, "subject", 180) || "פנייה מהאתר | NeverMind",
    page: readString(incoming, "page", 80),
    name: readString(incoming, "name", 120),
    email: readString(incoming, "email", 160),
    phone: readString(incoming, "phone", 80),
    message: String(incoming.get("message") ?? "").trim().slice(0, 5000),
  };

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
          error: "missing_mail_delivery_config",
          message: "שרת המייל של האתר עדיין לא הוגדר בפריסה.",
        },
        503,
      );
    }

    return json(
      {
        ok: false,
        success: false,
        error: sent.error || "mail_submit_failed",
        message: "שרת השליחה לא אישר קבלה כרגע.",
      },
      502,
    );
  }

  return json({ ok: true, success: true, message: "accepted" }, 200);
}
