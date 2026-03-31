/** מקור Worker לקריאות member API (מבוסס על PUBLIC_NM_CLUB_WEBHOOK_URL). */
export function getClubWorkerOrigin(): string {
  const raw = import.meta.env.PUBLIC_NM_CLUB_WEBHOOK_URL ?? "";
  try {
    return new URL(raw).origin;
  } catch {
    return "";
  }
}

export function memberProgressUrl(): string {
  const o = getClubWorkerOrigin();
  return o ? `${o}/member/progress` : "";
}
