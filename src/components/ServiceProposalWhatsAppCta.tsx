import { useMemo, useState } from "react";
import type { FlatService, ServiceExtension } from "../lib/services";
import { buildServiceProposalWhatsAppHref } from "../lib/services";

function WhatsAppGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.173.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.883 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
      />
    </svg>
  );
}

const waProposalButtonClass =
  "inline-flex min-h-[2.75rem] items-center justify-center gap-2 rounded-full bg-[#25D366] px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-[#20BD5A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#128C7E]";

type Props = {
  serviceJson: string;
  selectedExtensionJson?: string | null;
};

export default function ServiceProposalWhatsAppCta({ serviceJson, selectedExtensionJson }: Props) {
  const [focus, setFocus] = useState("");
  const service = useMemo(() => JSON.parse(serviceJson) as FlatService, [serviceJson]);
  const selectedExt = useMemo((): ServiceExtension | null => {
    if (selectedExtensionJson == null || selectedExtensionJson === "" || selectedExtensionJson === "null") {
      return null;
    }
    try {
      return JSON.parse(selectedExtensionJson) as ServiceExtension;
    } catch {
      return null;
    }
  }, [selectedExtensionJson]);

  const href = useMemo(
    () => buildServiceProposalWhatsAppHref(service, selectedExt, focus),
    [service, selectedExt, focus],
  );

  return (
    <div className="flex w-full min-w-0 flex-col gap-2 sm:max-w-md" dir="rtl">
      <label className="block text-right text-xs font-medium text-[color-mix(in_srgb,var(--nm-fg)_70%,var(--nm-bg))]">
        רוצים לציין במה להתמקד? (רשות)
        <textarea
          value={focus}
          onChange={(e) => setFocus(e.target.value)}
          rows={2}
          maxLength={800}
          className="mt-1 w-full resize-y rounded-xl border border-[color-mix(in_srgb,var(--nm-fg)_12%,transparent)] bg-white/90 px-3 py-2 text-sm text-[var(--nm-fg)] placeholder:text-[color-mix(in_srgb,var(--nm-fg)_40%,var(--nm-bg))]"
          placeholder="משפט או שניים. אפשר להשאיר ריק."
        />
      </label>
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className={`${waProposalButtonClass} w-full shrink-0 self-stretch sm:w-auto sm:self-start`}
      >
        <WhatsAppGlyph className="size-[1.15rem] shrink-0" />
        בואו נבדוק בוואטסאפ
      </a>
    </div>
  );
}
