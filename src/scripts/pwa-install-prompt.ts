const STORAGE_KEY = "nm-pwa-install-dismissed";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let deferred: BeforeInstallPromptEvent | null = null;

function rootEl(): HTMLElement | null {
  const n = document.getElementById("nm-pwa-install-root");
  return n instanceof HTMLElement ? n : null;
}

function show(root: HTMLElement, visible: boolean) {
  root.classList.toggle("hidden", !visible);
  root.classList.toggle("translate-y-full", !visible);
  root.classList.toggle("opacity-0", !visible);
}

function syncVisibility() {
  const root = rootEl();
  if (!root) return;
  if (sessionStorage.getItem(STORAGE_KEY) === "1") {
    show(root, false);
    return;
  }
  show(root, Boolean(deferred));
}

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferred = e as BeforeInstallPromptEvent;
  syncVisibility();
});

document.addEventListener("astro:page-load", () => {
  syncVisibility();
});

document.addEventListener(
  "click",
  async (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const action = target.closest("#nm-pwa-install-action");
    const dismiss = target.closest("#nm-pwa-install-dismiss");
    if (!action && !dismiss) return;
    const root = rootEl();
    if (!root || !root.contains(target)) return;

    if (dismiss) {
      try {
        sessionStorage.setItem(STORAGE_KEY, "1");
      } catch {
        /* ignore */
      }
      show(root, false);
      return;
    }

    if (action && deferred) {
      try {
        await deferred.prompt();
        await deferred.userChoice;
      } catch {
        /* ignore */
      }
      deferred = null;
      show(root, false);
    }
  },
  true,
);

syncVisibility();
