import { ActionError, defineAction } from "astro:actions";
import { z } from "astro/zod";
import { marked } from "marked";
import appConfig from "../config/appConfig.json";
import { articleFileSlugSchema } from "../lib/article-file-slug-schema";
import { verifyPremiumFragmentSignature } from "../lib/premium-fragment-signing";
import { premiumSessionCookieName, signPremiumExpiry, verifyPremiumCookieValue } from "../lib/premium-cookie";
import { verifyPremiumSessionCode } from "../lib/premium-code-verify";
import premiumLocks from "../lib/generated/premium-locks.json";
import { reportPremiumArticleUnlocked } from "../lib/premium-unlock-analytics";

const premiumFragmentInputSchema = z.object({
  slug: articleFileSlugSchema,
  signature: z.string().trim().min(40).max(200),
  gaClientId: z.string().trim().max(120).optional(),
  scrollRatio: z.number().min(0).max(1).optional(),
});

const startSessionInputSchema = z.object({
  code: z.string().trim().min(1).max(500),
});

export const premium = {
  getFragment: defineAction({
    accept: "json",
    input: premiumFragmentInputSchema,
    handler: async (input, ctx) => {
      const raw = ctx.cookies.get(premiumSessionCookieName)?.value;
      if (!verifyPremiumCookieValue(raw)) {
        throw new ActionError({ code: "FORBIDDEN", message: "premium_session" });
      }
      if (!verifyPremiumFragmentSignature(input.slug, input.signature)) {
        throw new ActionError({ code: "FORBIDDEN", message: "fragment_signature" });
      }
      const locks = premiumLocks as Record<string, string>;
      const md = locks[input.slug];
      if (md === undefined || md.trim().length === 0) {
        throw new ActionError({ code: "NOT_FOUND", message: "no_lock" });
      }

      await reportPremiumArticleUnlocked({
        articleSlug: input.slug,
        premiumSessionCookie: raw,
        gaClientIdParam: input.gaClientId,
        scrollRatio: input.scrollRatio,
        referer: ctx.request.headers.get("referer"),
      });

      const html = marked.parse(md, { async: false });
      const htmlStr = typeof html === "string" ? html : String(html);
      return { html: htmlStr } as const;
    },
  }),

  startSession: defineAction({
    accept: "json",
    input: startSessionInputSchema,
    handler: async (input, ctx) => {
      if (!verifyPremiumSessionCode(input.code)) {
        throw new ActionError({ code: "FORBIDDEN", message: "bad_code" });
      }
      const hours = Number(appConfig.premiumAccess?.sessionHours) || 168;
      const ms = hours * 3600 * 1000;
      const exp = Date.now() + ms;
      let token: string;
      try {
        token = signPremiumExpiry(exp);
      } catch {
        throw new ActionError({ code: "INTERNAL_SERVER_ERROR", message: "sign_failed" });
      }
      ctx.cookies.set(premiumSessionCookieName, token, {
        path: "/",
        httpOnly: true,
        secure: import.meta.env.PROD,
        sameSite: "lax",
        maxAge: Math.floor(ms / 1000),
      });
      return { ok: true as const };
    },
  }),
};
