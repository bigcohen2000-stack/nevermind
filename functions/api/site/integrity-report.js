import { fetchClubWorkerJson, json } from "../../_lib/club-admin.js";

function resolveAccessKey(env) {
  return String(env.WEB3FORMS_ACCESS_KEY ?? env.PUBLIC_WEB3FORMS_ACCESS_KEY ?? "").trim();
}

function readString(source, key, max = 2000) {
  return String(source?.[key] ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

async function readPayload(request) {
  const contentType = String(request.headers.get("content-type") ?? "").toLowerCase();
  if (contentType.includes("application/json")) {
    const body = (await request.json()) ?? {};
    return {
      subject: readString(body, "subject", 180),
      message: String(body?.message ?? "").trim().slice(0, 5000),
      pageUrl: readString(body, "page_url", 500),
      pagePath: readString(body, "page_path", 240),
      pageTitle: readString(body, "page_title", 180),
      selectedText: readString(body, "selected_text", 500),
      note: readString(body, "note", 1600),
      fromName: readString(body, "from_name", 120),
      botcheck: readString(body, "botcheck", 120),
    };
  }

  const form = await request.formData();
  return {
    subject: readString(Object.fromEntries(form.entries()), "subject", 180),
    message: String(form.get("message") ?? "").trim().slice(0, 5000),
    pageUrl: String(form.get("page_url") ?? "").trim().slice(0, 500),
    pagePath: String(form.get("page_path") ?? "").trim().slice(0, 240),
    pageTitle: String(form.get("page_title") ?? "").trim().slice(0, 180),
    selectedText: String(form.get("selected_text") ?? "").trim().slice(0, 500),
    note: String(form.get("note") ?? "").trim().slice(0, 1600),
    fromName: String(form.get("from_name") ?? "").trim().slice(0, 120),
    botcheck: String(form.get("botcheck") ?? "").trim().slice(0, 120),
  };
}

async function saveToClubAdmin(env, payload, request) {
  const forwarded = await fetchClubWorkerJson(env, "/admin/integrity-report", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": request.headers.get("user-agent") ?? "",
    },
    body: JSON.stringify(payload),
  });

  return {
    ok: forwarded.ok === true,
    error: forwarded.error || "",
    payload: forwarded.payload,
  };
}

async function sendToWeb3Forms(env, payload) {
  const accessKey = resolveAccessKey(env);
  if (!accessKey) {
    return { ok: false, skipped: true, error: "missing_form_access_key" };
  }

  const outbound = new FormData();
  outbound.set("access_key", accessKey);
  outbound.set("subject", payload.subject || "דיווח דיוק מהאתר");
  outbound.set("from_name", payload.fromName || "דיווח דיוק");
  outbound.set("message", payload.message || "דיווח חדש מהאתר");
  outbound.set("page_url", payload.pageUrl || "");
  outbound.set("page_path", payload.pagePath || "");
  outbound.set("page_title", payload.pageTitle || "");
  outbound.set("selected_text", payload.selectedText || "");
  outbound.set("note", payload.note || "");
  outbound.set("botcheck", "");

  try {
    const response = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { Accept: "application/json" },
      body: outbound,
    });

    const result = await response.json().catch(() => null);
    return {
      ok: response.ok && result?.success === true,
      skipped: false,
      error:
        response.ok && result?.success === true
          ? ""
          : typeof result?.message === "string" && result.message.trim()
            ? result.message.trim()
            : "web3forms_rejected",
    };
  } catch {
    return { ok: false, skipped: false, error: "web3forms_unreachable" };
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;

  let payload;
  try {
    payload = await readPayload(request);
  } catch {
    return json({ ok: false, message: "גוף הדיווח לא הגיע בפורמט תקין." }, 400);
  }

  if (payload.botcheck) {
    return json({ ok: true, stored: false, emailed: false, skipped: true }, 200);
  }

  if (!payload.pageUrl && !payload.pagePath) {
    return json({ ok: false, message: "חסר קישור לעמוד שממנו נשלח הדיווח." }, 400);
  }

  const message = payload.message || [payload.pageTitle, payload.selectedText, payload.note].filter(Boolean).join("\n");
  const clubPayload = {
    pageUrl: payload.pageUrl,
    pagePath: payload.pagePath,
    pageTitle: payload.pageTitle,
    selectedText: payload.selectedText,
    note: payload.note,
    message,
  };

  const [storage, mail] = await Promise.all([
    saveToClubAdmin(env, clubPayload, request),
    sendToWeb3Forms(env, {
      ...payload,
      message: `${message}\n\n${payload.pageUrl || payload.pagePath || ""}`.trim(),
    }),
  ]);

  if (!storage.ok && !mail.ok) {
    const message = !mail.skipped ? "לא הצלחנו לשמור את הדיווח כרגע." : storage.error || "שרת הדיווחים לא זמין כרגע.";
    return json(
      {
        ok: false,
        message,
        stored: false,
        emailed: false,
        emailEnabled: !mail.skipped,
      },
      502,
    );
  }

  return json(
    {
      ok: true,
      stored: storage.ok,
      emailed: mail.ok,
      emailEnabled: !mail.skipped,
    },
    200,
  );
}
