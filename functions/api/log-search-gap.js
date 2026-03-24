let gapStore = new Map();

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function normalizeQuery(value) {
  return String(value || "")
    .trim()
    .slice(0, 120);
}

export async function onRequestPost(context) {
  const { request } = context;
  let body = null;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON body" }, 400);
  }

  const query = normalizeQuery(body?.query);
  if (!query) {
    return json({ ok: false, error: "Missing query" }, 400);
  }

  const key = query.toLowerCase();
  const prev = gapStore.get(key);
  const next = {
    query,
    count: prev ? prev.count + 1 : 1,
    lastSeen: new Date().toISOString(),
  };
  gapStore.set(key, next);

  return json({ ok: true });
}

export async function onRequestGet() {
  const rows = [...gapStore.values()].sort((a, b) => b.count - a.count || (a.query > b.query ? 1 : -1));
  return json({ ok: true, rows });
}
