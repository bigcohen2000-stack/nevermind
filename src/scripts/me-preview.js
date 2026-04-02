const PREVIEW_ENDPOINT = "/api/club-admin/admin/member";

const normalizePhone = (value) => String(value ?? "").replace(/\D/g, "");

const readPreviewPhone = () => {
  try {
    const url = new URL(window.location.href);
    return normalizePhone(url.searchParams.get("previewPhone") || "");
  } catch {
    return "";
  }
};

const formatDate = (value) => {
  const date = new Date(value || "");
  if (Number.isNaN(date.getTime())) return "לא ידוע";
  return date.toLocaleDateString("he-IL", { day: "numeric", month: "long", year: "numeric" });
};

const formatDateTime = (value) => {
  const date = new Date(value || "");
  if (Number.isNaN(date.getTime())) return "לא ידוע";
  return date.toLocaleString("he-IL", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const statusLabel = (member) => {
  if (!member) return "לא נטען";
  if (member.status === "blocked") return "חסום";
  if (member.status === "paused") return "מושהה";
  if (member.status === "active") return "חבר פעיל";
  return "דורש בדיקה";
};

const statusTone = (member) => {
  if (!member) return { border: "rgba(26,26,26,0.1)", background: "rgba(255,255,255,0.82)", color: "#1A1A1A" };
  if (member.status === "active") {
    return { border: "rgba(75,96,85,0.18)", background: "rgba(75,96,85,0.10)", color: "#3F5448" };
  }
  if (member.status === "blocked") {
    return { border: "rgba(212,43,43,0.18)", background: "rgba(212,43,43,0.10)", color: "#D42B2B" };
  }
  return { border: "rgba(26,26,26,0.12)", background: "rgba(255,255,255,0.82)", color: "#1A1A1A" };
};

async function loadPreviewMember(phone) {
  try {
    const response = await fetch(`${PREVIEW_ENDPOINT}?phone=${encodeURIComponent(phone)}`, {
      headers: { accept: "application/json" },
      cache: "no-store",
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload || payload.ok !== true) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

function renderPreviewBanner(member, phone) {
  const root = document.querySelector("[data-member-preview-root]");
  const title = document.querySelector("[data-member-preview-title]");
  const copy = document.querySelector("[data-member-preview-copy]");
  const status = document.querySelector("[data-member-preview-status]");
  const meta = document.querySelector("[data-member-preview-meta]");
  if (!(root instanceof HTMLElement)) return;
  if (!phone) {
    root.classList.add("hidden");
    return;
  }
  root.classList.remove("hidden");

  if (title instanceof HTMLElement) {
    title.textContent = member?.memberName ? `תצוגת חבר עבור ${member.memberName}` : `תצוגת חבר עבור ${phone}`;
  }
  if (copy instanceof HTMLElement) {
    copy.textContent = member
      ? `זהו מסך בדיקה עבור ${member.phone}. הגישה שלו ${member.status === "active" ? `פעילה עד ${formatDate(member.expiresAt)}` : "לא פעילה כרגע"}, והבדיקה כאן לא משנה את ההתחברות שעל המכשיר שלך.`
      : "תצוגת בדיקה זמינה מתוך הניהול בלבד. אם לא נטענו פרטי חבר, כדאי לפתוח את העמוד הזה מתוך הדשבורד המוגן.";
  }
  if (status instanceof HTMLElement) {
    const tone = statusTone(member);
    status.textContent = statusLabel(member);
    status.style.borderColor = tone.border;
    status.style.background = tone.background;
    status.style.color = tone.color;
  }
  if (meta instanceof HTMLElement) {
    meta.textContent = member
      ? `${member.phone} · כניסה אחרונה ${formatDateTime(member.lastLoginAt)}`
      : `${phone} · הנתונים זמינים רק מתוך גישת הניהול`;
  }
}

function renderList(root, items, emptyEl, emptyText) {
  if (!(root instanceof HTMLElement) || !(emptyEl instanceof HTMLElement)) return;
  root.innerHTML = "";
  emptyEl.textContent = emptyText;
  emptyEl.classList.toggle("hidden", items.length > 0);
  items.forEach((item) => {
    const card = document.createElement("div");
    card.className = "rounded-[1.2rem] border border-[color-mix(in_srgb,var(--nm-fg)_10%,transparent)] bg-[var(--nm-surface-muted)] px-4 py-3";
    card.innerHTML = `<p class="font-semibold text-[var(--nm-fg)]">${item.title}</p><p class="mt-1 text-sm leading-[1.6] text-[color-mix(in_srgb,var(--nm-fg)_60%,var(--nm-bg))]">${item.meta}</p>`;
    root.appendChild(card);
  });
}

async function initMePreview() {
  const phone = readPreviewPhone();
  renderPreviewBanner(null, phone);
  if (!phone) return;

  const payload = await loadPreviewMember(phone);
  const member = payload?.member;
  renderPreviewBanner(member, phone);
  if (!member) return;

  const guest = document.querySelector("[data-me-guest]");
  const memberSection = document.querySelector("[data-me-member]");
  if (guest instanceof HTMLElement) guest.classList.add("hidden");
  if (memberSection instanceof HTMLElement) memberSection.classList.remove("hidden");

  const greeting = document.querySelector("[data-me-greeting]");
  const phoneEl = document.querySelector("[data-me-phone]");
  const expiry = document.querySelector("[data-me-expiry]");
  const lastLogin = document.querySelector("[data-me-last-login]");
  if (greeting instanceof HTMLElement) greeting.textContent = `${member.memberName || "חבר"} - תצוגת בדיקה`;
  if (phoneEl instanceof HTMLElement) phoneEl.textContent = member.phone || phone;
  if (expiry instanceof HTMLElement) expiry.textContent = formatDate(member.expiresAt);
  if (lastLogin instanceof HTMLElement) lastLogin.textContent = formatDateTime(member.lastLoginAt);

  const favoritesList = document.querySelector("[data-me-favorites-list]");
  const favoritesEmpty = document.querySelector("[data-me-favorites-empty]");
  const historyList = document.querySelector("[data-me-history-list]");
  const historyEmpty = document.querySelector("[data-me-history-empty]");
  const favoritesCount = document.querySelector("[data-me-favorites-count]");
  const historyCount = document.querySelector("[data-me-history-count]");
  const notesField = document.querySelector("[data-me-notes]");
  const notesStatus = document.querySelector("[data-me-notes-status]");

  const timelineItems = Array.isArray(payload?.timeline)
    ? payload.timeline.slice(0, 4).map((item) => ({
        title: item.title || "פעילות",
        meta: item.detail ? `${item.detail} · ${formatDateTime(item.at)}` : formatDateTime(item.at),
      }))
    : [];

  renderList(
    favoritesList,
    [],
    favoritesEmpty,
    "בתצוגת בדיקה לא נטענים מועדפים מהמכשיר. כאן רק בודקים את מבנה המסך."
  );
  renderList(
    historyList,
    timelineItems,
    historyEmpty,
    "עדיין אין פעילות זמינה לתצוגה עבור החבר הזה."
  );

  if (favoritesCount instanceof HTMLElement) favoritesCount.textContent = "0";
  if (historyCount instanceof HTMLElement) historyCount.textContent = String(timelineItems.length);

  if (notesField instanceof HTMLTextAreaElement) {
    notesField.value = "";
    notesField.disabled = true;
    notesField.placeholder = "בתצוגת בדיקה לא שומרים הערות על המכשיר.";
  }
  if (notesStatus instanceof HTMLElement) {
    notesStatus.textContent = "תצוגת בדיקה לא שומרת הערות או היסטוריה מקומית.";
  }
}

const boot = () => {
  void initMePreview();
};

boot();
document.addEventListener("astro:page-load", boot);
window.addEventListener("nm-club-session-changed", boot);
window.addEventListener("storage", boot);