import {
  ACTIVE_NOW_WINDOW_MS,
  buildSharedIdentityKey,
  DEEP_PAGE_VIEWS_KEY,
  INTEGRITY_REPORTS_KEY,
  KV_LIST_LIMIT,
  normalizeIdentityName,
  readActivity,
  isExpired,
} from "./shared";
import type {
  ActivityEntry,
  AdminMemberSummary,
  AdminMemberTimelineItem,
  DeepPageBeacon,
  FraudFlagEntry,
  IntegrityReportEntry,
  StoredMember,
} from "./types";

const RECENT_LOGIN_LIMIT = 24;
const FRAUD_FLAG_LIMIT = 24;

export async function listKvKeys(namespace: KVNamespace, prefix: string): Promise<string[]> {
  let cursor: string | undefined;
  const keys: string[] = [];

  do {
    const page = await namespace.list({ prefix, cursor, limit: KV_LIST_LIMIT });
    keys.push(...page.keys.map((entry) => entry.name));
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);

  return keys;
}

export async function readRecentLogins(namespace: KVNamespace): Promise<Array<Record<string, string>>> {
  const [memberKeys, sharedKeys] = await Promise.all([
    listKvKeys(namespace, "activity:member:"),
    listKvKeys(namespace, "activity:shared:"),
  ]);
  const entries = await Promise.all(
    [...memberKeys, ...sharedKeys].map((key) => namespace.get<ActivityEntry[]>(key, "json"))
  );

  const activeCutoff = Date.now() - ACTIVE_NOW_WINDOW_MS;
  const latestByIdentity = new Map<string, ActivityEntry>();

  entries
    .flatMap((list) => (Array.isArray(list) ? list : []))
    .filter((entry) => entry && typeof entry.seenAt === "string")
    .sort((left, right) => Date.parse(right.seenAt) - Date.parse(left.seenAt))
    .forEach((entry) => {
      const phone = String(entry.phone ?? "").trim();
      const memberName = normalizeIdentityName(entry.memberName ?? "");
      const identityKey =
        String(entry.identityKey ?? "").trim() ||
        (entry.source === "SHARED" ? buildSharedIdentityKey(memberName, phone) : `member:${phone}`);
      if (!identityKey || latestByIdentity.has(identityKey)) return;
      latestByIdentity.set(identityKey, entry);
    });

  return [...latestByIdentity.values()]
    .slice(0, RECENT_LOGIN_LIMIT)
    .map((entry) => ({
      phone: String(entry.phone ?? "").trim(),
      memberName: normalizeIdentityName(entry.memberName ?? ""),
      seenAt: entry.seenAt,
      path: entry.path,
      userAgent: entry.userAgent,
      ipFingerprint: entry.ipHash.slice(0, 8),
      source: String(entry.source === "SHARED" ? "SHARED" : "LIVE"),
      identityKey:
        String(entry.identityKey ?? "").trim() ||
        (entry.source === "SHARED"
          ? buildSharedIdentityKey(normalizeIdentityName(entry.memberName ?? ""), String(entry.phone ?? "").trim())
          : `member:${String(entry.phone ?? "").trim()}`),
      eventType: String(entry.eventType === "heartbeat" ? "heartbeat" : "login"),
      activeNow: Date.parse(entry.seenAt) >= activeCutoff ? "true" : "false",
    }));
}

export async function readMemberSummaries(namespace: KVNamespace): Promise<AdminMemberSummary[]> {
  const keys = await listKvKeys(namespace, "member:");
  const members = await Promise.all(keys.map((key) => namespace.get<StoredMember>(key, "json")));

  return members
    .filter((entry): entry is StoredMember => Boolean(entry && typeof entry.phone === "string"))
    .map((entry) => {
      const expiresAt = String(entry.expiresAt ?? "").trim();
      const lastLoginAt = String(entry.lastLoginAt ?? "").trim();
      const status = String(entry.status ?? "active") as AdminMemberSummary["status"];
      const isActive = Boolean(expiresAt) && !isExpired(expiresAt) && status === "active";
      return {
        phone: String(entry.phone ?? "").trim(),
        memberName: String(entry.memberName ?? "חבר").trim() || "חבר",
        status,
        expiresAt,
        lastLoginAt,
        lastIpFingerprint: String(entry.lastIpHash ?? "").slice(0, 8),
        isActive,
        flaggedAt: String(entry.flaggedAt ?? "").trim() || undefined,
      } satisfies AdminMemberSummary;
    })
    .sort((left, right) => {
      const leftLast = Date.parse(left.lastLoginAt || left.expiresAt || "1970-01-01T00:00:00.000Z");
      const rightLast = Date.parse(right.lastLoginAt || right.expiresAt || "1970-01-01T00:00:00.000Z");
      return rightLast - leftLast;
    })
    .slice(0, 160);
}

export function buildMemberTimeline(member: StoredMember, activity: ActivityEntry[]): AdminMemberTimelineItem[] {
  const items: AdminMemberTimelineItem[] = [];
  const expiresAt = String(member.expiresAt ?? "").trim();
  const status = String(member.status ?? "active").trim() || "active";

  if (expiresAt) {
    items.push({
      id: `membership:${expiresAt}`,
      kind: "membership",
      at: expiresAt,
      title: status === "active" ? "חברות פעילה" : "חברות דורשת בדיקה",
      detail: status === "active" ? `הגישה פתוחה עד ${expiresAt}` : `סטטוס נוכחי: ${status}`,
    });
  }

  if (member.flaggedAt) {
    items.push({
      id: `flag:${member.flaggedAt}`,
      kind: "flag",
      at: member.flaggedAt,
      title: "נפתח Flag",
      detail: "זוהה דפוס כניסה שדורש בדיקה ידנית.",
    });
  }

  for (const entry of activity) {
    items.push({
      id: `login:${entry.seenAt}:${entry.ipHash}`,
      kind: "login",
      at: entry.seenAt,
      title: "כניסה של חבר",
      detail: `${entry.path || "/"} · ${entry.userAgent || "דפדפן לא זוהה"}`,
    });
  }

  return items
    .sort((left, right) => Date.parse(right.at) - Date.parse(left.at))
    .slice(0, 12);
}

export async function readFraudFlags(namespace: KVNamespace): Promise<FraudFlagEntry[]> {
  const keys = await listKvKeys(namespace, "flag:");
  const entries = await Promise.all(keys.map((key) => namespace.get<FraudFlagEntry>(key, "json")));

  return entries
    .filter((entry): entry is FraudFlagEntry => Boolean(entry && typeof entry.phone === "string" && typeof entry.flaggedAt === "string"))
    .sort((left, right) => Date.parse(right.flaggedAt) - Date.parse(left.flaggedAt))
    .slice(0, FRAUD_FLAG_LIMIT);
}

export async function readDeepPageBeaconList(namespace: KVNamespace): Promise<DeepPageBeacon[]> {
  const raw = await namespace.get<DeepPageBeacon[]>(DEEP_PAGE_VIEWS_KEY, "json");
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (entry) =>
      entry &&
      typeof entry.path === "string" &&
      typeof entry.seenAt === "string" &&
      typeof entry.ipHash === "string"
  );
}

export async function readIntegrityReports(namespace: KVNamespace): Promise<IntegrityReportEntry[]> {
  const raw = await namespace.get<IntegrityReportEntry[]>(INTEGRITY_REPORTS_KEY, "json");
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (entry) =>
      entry &&
      typeof entry.pageUrl === "string" &&
      typeof entry.pagePath === "string" &&
      typeof entry.reportedAt === "string" &&
      typeof entry.reporterFingerprint === "string"
  );
}

export { readActivity };
