function applyFabState(button: HTMLAnchorElement) {
  button.classList.remove("opacity-0", "pointer-events-none");
  button.classList.add("opacity-100", "pointer-events-auto", "transition-opacity", "duration-200");
}

function syncWhatsAppHref(button: HTMLAnchorElement) {
  const base = button.dataset.waBase?.trim();
  const prefill = button.dataset.waPrefill?.trim();
  if (!base || !prefill) return;
  button.href = `${base}?text=${prefill}`;
}

export function initWhatsAppButton() {
  const button = document.querySelector<HTMLAnchorElement>("[data-whatsapp]");
  if (!button) return;

  syncWhatsAppHref(button);
  applyFabState(button);
}
