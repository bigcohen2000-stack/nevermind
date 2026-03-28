/**
 * פיצול גוף MDX לפרימיום: מרקר HTML או יחס שורות (~30% ציבורי).
 */
export function normalizeCutoffMarker(marker: string): string {
  return (marker || "premium-break").replace(/<!--|-->/g, "").trim();
}

export function splitPremiumRawBody(
  body: string,
  cutoffMarker: string
): { publicPart: string; lockedPart: string } {
  const needle = `<!--${normalizeCutoffMarker(cutoffMarker)}-->`;
  const i = body.indexOf(needle);
  if (i !== -1) {
    return {
      publicPart: body.slice(0, i).trimEnd(),
      lockedPart: body.slice(i + needle.length).trimStart(),
    };
  }
  const lines = body.split("\n");
  const visibleCount = Math.max(1, Math.ceil(lines.length * 0.3));
  return {
    publicPart: lines.slice(0, visibleCount).join("\n"),
    lockedPart: lines.slice(visibleCount).join("\n"),
  };
}
