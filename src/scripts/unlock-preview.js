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

const statusLabel = (member) => {
  if (!member) return "לא נטען";
  if (member.status === "blocked") return "חסום";
  if (member.status === "paused") return "מושהה";
  if (member.status === "active") return "חבר קיים";
  return "דורש בדיקה";
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

function applyGuestPreview(member, phone) {
  const shell = document.querySelector(".unlock-shell");
  const root = document.querySelector("[data-unlock-preview-root]");
  const title = document.querySelector("[data-unlock-preview-title]");
  const copy = document.querySelector("[data-unlock-preview-copy]");
  const status = document.querySelector("[data-unlock-preview-status]");
  const meta = document.querySelector("[data-unlock-preview-meta]");
  const input = document.getElementById("unlock-code-input");
  const enterButton = document.getElementById("unlock-enter");
  const errorLine = document.getElementById("unlock-error");
  const successLine = document.getElementById("unlock-success");
  const logoutButton = document.getElementById("unlock-logout");
  const joinDot = document.querySelector('[data-join-dot]');
  const joinLabel = document.querySelector('[data-join-label]');
  const joinTitle = document.querySelector('[data-join-title]');
  const joinCopy = document.querySelector('[data-join-copy]');
  const joinOffer = document.getElementById('unlock-join-offer');
  const statSession = document.querySelector('[data-stat="session"]');
  const sessionBar = document.querySelector('[data-progress="session"]');

  if (!(root instanceof HTMLElement)) return;
  if (!phone) {
    root.classList.add("hidden");
    return;
  }

  root.classList.remove("hidden");
  if (title instanceof HTMLElement) {
    title.textContent = member?.memberName ? `תצוגת אורח עבור ${member.memberName}` : `תצוגת אורח עבור ${phone}`;
  }
  if (copy instanceof HTMLElement) {
    copy.textContent = member
      ? `כך נראה המסך לפני כניסה עבור ${member.phone}. ${member.status === "active" ? `החברות שלו פעילה עד ${formatDate(member.expiresAt)}` : "כרגע אין לחבר גישה פעילה"}, אבל התצוגה כאן נשארת במצב אורח כדי לבדוק את החוויה הראשונית.`
      : "תצוגת בדיקה זמינה מתוך הניהול בלבד. אם לא נטענו פרטי חבר, כדאי לפתוח את הקישור הזה מתוך הדשבורד המוגן.";
  }
  if (status instanceof HTMLElement) {
    status.textContent = statusLabel(member);
    status.style.borderColor = member?.status === "active" ? "rgba(75,96,85,0.18)" : "rgba(212,43,43,0.18)";
    status.style.background = member?.status === "active" ? "rgba(75,96,85,0.10)" : "rgba(255,255,255,0.82)";
    status.style.color = member?.status === "active" ? "#3F5448" : "#1A1A1A";
  }
  if (meta instanceof HTMLElement) {
    meta.textContent = member
      ? `${member.phone} · מצב פתיחה לפני כניסה`
      : `${phone} · הנתונים זמינים רק מתוך גישת הניהול`;
  }

  shell?.setAttribute("data-authorized", "false");
  if (logoutButton instanceof HTMLElement) logoutButton.classList.add("hidden");
  if (errorLine instanceof HTMLElement) errorLine.classList.add("hidden");
  if (successLine instanceof HTMLElement) successLine.classList.add("hidden");
  if (statSession instanceof HTMLElement) statSession.textContent = "תצוגת אורח";
  if (sessionBar instanceof HTMLElement) sessionBar.style.width = "18%";

  if (joinTitle instanceof HTMLElement) joinTitle.textContent = "כך נראה המסך לפני כניסה";
  if (joinLabel instanceof HTMLElement) joinLabel.textContent = member?.status === "active" ? "בדיקת חוויה" : "נורת בדיקה";
  if (joinCopy instanceof HTMLElement) {
    joinCopy.textContent = member
      ? `החבר ${member.memberName || member.phone} קיים במערכת, אבל כאן נשארים לפני כניסה כדי לבדוק את ההזמנה, את הקופי, ואת תחושת הטרום־חיבור.`
      : "כאן בודקים את תחושת הטרום־חיבור בלי לפתוח גישה אמיתית מהמכשיר.";
  }
  if (joinDot instanceof HTMLElement) {
    joinDot.style.background = member?.status === "active" ? "#4B6055" : "#D42B2B";
    joinDot.style.boxShadow = member?.status === "active"
      ? "0 0 0 6px rgba(75,96,85,0.12)"
      : "0 0 0 6px rgba(212,43,43,0.12)";
  }
  if (joinOffer instanceof HTMLAnchorElement) {
    joinOffer.removeAttribute("target");
    joinOffer.removeAttribute("rel");
  }

  if (input instanceof HTMLInputElement) {
    input.value = "";
    input.disabled = true;
    input.placeholder = "תצוגת בדיקה מתוך הניהול";
  }
  if (enterButton instanceof HTMLButtonElement) {
    enterButton.disabled = true;
    enterButton.textContent = "תצוגת אורח";
    enterButton.classList.add("opacity-70");
  }
}

async function initUnlockPreview() {
  const phone = readPreviewPhone();
  if (!phone) return;
  const payload = await loadPreviewMember(phone);
  applyGuestPreview(payload?.member ?? null, phone);
}

const boot = () => {
  void initUnlockPreview();
};

boot();
document.addEventListener("astro:page-load", boot);
window.addEventListener("storage", boot);
window.addEventListener("nm-club-session-changed", boot);