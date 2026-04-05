const memoryStore = new Map();
const KV_PREFIX = "gap:";

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
    .replace(/\s+/g, " ")
    .slice(0, 120);
}

function readSearchGapStore(env) {
  const binding = env?.SEARCH_GAPS;
  if (
    binding &&
    typeof binding.get === "function" &&
    typeof binding.put === "function" &&
    typeof binding.list === "function"
  ) {
    return binding;
  }
  return null;
}

async function writeRow(store, row) {
  if (store) {
    await store.put(`${KV_PREFIX}${row.key}`, JSON.stringify(row));
    return;
  }
  memoryStore.set(row.key, row);
}

async function readRow(store, key) {
  if (store) {
    const raw = await store.get(`${KV_PREFIX}${key}`, "json");
    return raw && typeof raw === "object" ? raw : null;
  }
  return memoryStore.get(key) ?? null;
}

async function listRows(store) {
  if (!store) {
    return [...memoryStore.values()];
  }

  const rows = [];
  let cursor = undefined;
  do {
    const page = await store.list({ prefix: KV_PREFIX, cursor, limit: 100 });
    cursor = page.cursor;
    for (const key of page.keys ?? []) {
      const raw = await store.get(key.name, "json");
      if (raw && typeof raw === "object") {
        rows.push(raw);
      }
    }
  } while (cursor);
  return rows;
}

export async function onRequestPost(context) {
  const { request, env } = context;
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
  const store = readSearchGapStore(env);
  const prev = await readRow(store, key);
  const next = {
    key,
    query,
    count: prev ? Number(prev.count || 0) + 1 : 1,
    lastSeen: new Date().toISOString(),
  };

  await writeRow(store, next);
  return json({ ok: true, persistent: Boolean(store) });
}

export async function onRequestGet(context) {
  const store = readSearchGapStore(context.env);
  const rows = (await listRows(store))
    .map((row) => ({
      query: String(row?.query || ""),
      count: Number(row?.count || 0),
      lastSeen: String(row?.lastSeen || ""),
    }))
    .filter((row) => row.query)
    .sort((a, b) => b.count - a.count || (a.query > b.query ? 1 : -1));

  return json({
    ok: true,
    source: store ? "kv:search_gaps" : "memory:search_gaps",
    available: true,
    rows,
  });
}
