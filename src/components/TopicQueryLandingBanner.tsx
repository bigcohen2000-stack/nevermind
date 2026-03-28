import { useEffect, useMemo, useState } from "react";
import {
  buildTopicLandingPlanWhatsAppHref,
  findServiceById,
  formatTopicLandingSubtitle,
  servicesTopicLanding,
} from "../lib/services";

export default function TopicQueryLandingBanner() {
  const [topic, setTopic] = useState("");

  useEffect(() => {
    const readTopic = () => {
      const t = new URLSearchParams(window.location.search).get("topic")?.trim() ?? "";
      setTopic(t);
    };
    readTopic();
    document.addEventListener("astro:page-load", readTopic);
    window.addEventListener("popstate", readTopic);
    return () => {
      document.removeEventListener("astro:page-load", readTopic);
      window.removeEventListener("popstate", readTopic);
    };
  }, []);

  const paymentLink = useMemo(() => {
    const link = findServiceById("portal-access")?.payment_link;
    return typeof link === "string" ? link.trim() : undefined;
  }, []);

  const cfg = servicesTopicLanding;

  if (!topic || cfg.update === false) {
    return null;
  }

  const header = cfg.topic_header;

  return (
    <section
      className="mx-auto max-w-6xl px-4 pt-12 text-[var(--nm-fg)] md:pt-16"
      aria-labelledby="topic-landing-title"
      data-topic-landing=""
      data-update={String(cfg.update === true)}
      data-extend={String(cfg.extend === true)}
      data-override-base-cta={String(cfg.override_base_cta === true)}
      data-override-on-extension={String(cfg.override_on_extension === true)}
      data-topic-pricing={JSON.stringify(cfg.pricing)}
    >
      <div className="rounded-[2rem] border border-[color-mix(in_srgb,var(--nm-accent)_22%,transparent)] bg-[color-mix(in_srgb,var(--nm-tint)_35%,var(--nm-bg-canvas))] p-6 text-right shadow-[0_20px_60px_rgba(26,26,26,0.05)] md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--nm-accent)]">{header.label}</p>
        <h2
          id="topic-landing-title"
          className="mt-3 text-[clamp(1.35rem,1.1rem+1vw,2rem)] font-semibold leading-tight text-[var(--nm-fg)]"
        >
          {header.title}
        </h2>
        <p className="mt-4 text-sm leading-8 text-[color-mix(in_srgb,var(--nm-fg)_72%,var(--nm-bg))] md:text-[0.95rem]">
          {formatTopicLandingSubtitle(header.subtitle, topic)}
        </p>
        {header.cta_buttons.length > 0 ? (
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
            {header.cta_buttons.map((btn) => (
              <a
                key={btn.plan}
                href={buildTopicLandingPlanWhatsAppHref({
                  topic,
                  plan: btn.plan,
                  price: btn.price,
                  ctaLabel: btn.text.trim(),
                  paymentLink,
                })}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-[2.75rem] items-center justify-center rounded-full bg-[var(--nm-accent)] px-5 py-3 text-center text-sm font-semibold text-[var(--nm-on-accent)] transition-colors duration-200 hover:bg-[var(--nm-accent-hover)]"
                data-topic-plan={btn.plan}
                data-topic-price={String(btn.price)}
              >
                {btn.text.trim()}
              </a>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
