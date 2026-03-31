/**
 * טולטיפ לפי data-glossary-preview על .nm-glossary-tip (קישור או span אחרי עיטוף אוטומטי).
 */
let glossaryTooltipBound = false;

function initGlossaryTooltips() {
  if (glossaryTooltipBound) return;
  glossaryTooltipBound = true;
  let tip: HTMLDivElement | null = null;

  const tipSelector = "[data-glossary-preview].nm-glossary-tip";

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
  };

  const position = (anchor: HTMLElement, el: HTMLDivElement) => {
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

  const showForAnchor = (anchor: HTMLElement) => {
    const preview = anchor.getAttribute("data-glossary-preview");
    if (!preview) return;
    const el = ensureTip();
    el.textContent = preview;
    el.hidden = false;
    position(anchor, el);
    requestAnimationFrame(() => el.classList.remove("opacity-0"));
  };

  const onEnter = (e: Event) => {
    const target = e.target;
    if (!(target instanceof Element)) return;
    const anchor = target.closest(tipSelector);
    if (!(anchor instanceof HTMLElement)) return;
    showForAnchor(anchor);
  };

  const onLeave = (e: Event) => {
    const target = e.target;
    if (!(target instanceof Element)) return;
    const anchor = target.closest(tipSelector);
    if (!anchor) return;
    const rel = e instanceof MouseEvent ? e.relatedTarget : (e as FocusEvent).relatedTarget;
    if (rel instanceof Node && anchor.contains(rel)) return;
    hide();
  };

  document.addEventListener("pointerover", onEnter, true);
  document.addEventListener("pointerout", onLeave, true);
  document.addEventListener("focusin", onEnter, true);
  document.addEventListener("focusout", onLeave, true);
  document.addEventListener("scroll", hide, { passive: true, capture: true });
}

document.addEventListener("astro:page-load", initGlossaryTooltips);
