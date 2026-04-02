const GRAPHQL_ENDPOINT = "https://api.cloudflare.com/client/v4/graphql";

function readCloudflareConfig(env) {
  return {
    token: String(env.CF_API_TOKEN ?? "").trim(),
    zoneTag: String(env.CF_ZONE_ID ?? "").trim(),
  };
}

async function fetchCloudflareGraphQL(env, query, variables = {}) {
  const { token, zoneTag } = readCloudflareConfig(env);
  if (!token || !zoneTag) {
    return {
      ok: false,
      status: 503,
      error: "חסרים CF_API_TOKEN או CF_ZONE_ID.",
      data: null,
      errors: [],
    };
  }

  try {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        query,
        variables: { zoneTag, ...variables },
      }),
    });

    const payload = await response.json().catch(() => null);
    const errors = Array.isArray(payload?.errors) ? payload.errors : [];
    if (!response.ok || errors.length) {
      const first = errors[0]?.message;
      return {
        ok: false,
        status: response.status || 502,
        error: typeof first === "string" && first.trim() ? first.trim() : "Cloudflare GraphQL לא החזיר תשובה תקינה.",
        data: payload?.data ?? null,
        errors,
      };
    }

    return {
      ok: true,
      status: response.status,
      error: "",
      data: payload?.data ?? null,
      errors: [],
    };
  } catch {
    return {
      ok: false,
      status: 502,
      error: "לא הצלחנו להגיע ל-Cloudflare GraphQL.",
      data: null,
      errors: [],
    };
  }
}

function isoMinutesAgo(minutes) {
  return new Date(Date.now() - minutes * 60 * 1000).toISOString();
}

export { fetchCloudflareGraphQL, isoMinutesAgo };
