/**
 * תצוגת תקציר מושג ב-hover לקישורי .nm-glossary-tip (ללא ספרייה חיצונית).
 */
let glossaryTooltipBound = false;

function initGlossaryTooltips() {
  if (glossaryTooltipBound) return;
  glossaryTooltipBound = true;
  let tip: HTMLDivElement | null = null;
  let activeAnchor: HTMLAnchorElement | null = null;

  const ensureTip = () => {
    if (tip) return tip;
    tip = document.createElement("div");
    tip.className =
      "nm-glossary-tooltip pointer-events-none fixed z-[200] max-w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-[color-mix(in_srgb,var(--nm-fg)_12%,transparent)] bg-[#FAFAF8] px-3 py-2 text-right text-[0.8125rem] leading-relaxed text-[#1a1a1a] shadow-lg opacity-0 transition-opacity duration-150";
    tip.setAttribute("role", "tooltip");
    tip.hidden = true;
    document.body.appendChild(tip);
    return tip;
  };

  const hide = () => {
    if (!tip) return;
    tip.classList.add("opacity-0");
    tip.hidden = true;
    activeAnchor = null;
  };

  const position = (anchor: HTMLAnchorElement, el: HTMLDivElement) => {
    const rect = anchor.getBoundingClientRect();
    const margin = 8;
    let top = rect.bottom + margin + window.scrollY;
    let left = rect.right + window.scrollX - 280;
    const vw = window.innerWidth;
    if (left + 280 > vw + window.scrollX - margin) {
      left = vw + window.scrollX - 280 - margin;
    }
    if (left < margin + window.scrollX) left = margin + window.scrollX;
    const estH = 120;
    if (top + estH > window.scrollY + window.innerHeight) {
      top = rect.top + window.scrollY - estH - margin;
    }
    el.style.top = `${top}px`;
    el.style.left = `${left}px`;
  };

  const onEnter = (e: Event) => {
    const target = e.target;
    if (!(target instanceof Element)) return;
    const a = target.closest("a.nm-glossary-tip");
    if (!(a instanceof HTMLAnchorElement)) return;
    const preview = a.getAttribute("data-glossary-preview");
    if (!preview) return;
    activeAnchor = a;
    const el = ensureTip();
    el.textContent = preview;
    el.hidden = false;
    position(a, el);
    requestAnimationFrame(() => el.classList.remove("opacity-0"));
  };

  const onLeave = (e: Event) => {
    const target = e.target;
    if (!(target instanceof Element)) return;
    const a = target.closest("a.nm-glossary-tip");
    if (!a) return;
    const rel = e.relatedTarget;
    if (rel instanceof Node && a.contains(rel)) return;
    hide();
  };

  document.addEventListener("pointerover", onEnter, true);
  document.addEventListener("pointerout", onLeave, true);
  document.addEventListener("scroll", hide, { passive: true, capture: true });
}

document.addEventListener("astro:page-load", initGlossaryTooltips);
