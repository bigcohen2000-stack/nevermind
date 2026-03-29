globalThis.process ??= {}; globalThis.process.env ??= {};
import { r as renderers } from './chunks/_@astro-renderers_2wubI7U7.mjs';
import { c as createExports, s as serverEntrypointModule } from './chunks/_@astrojs-ssr-adapter_D_8fkL86.mjs';
import { manifest } from './manifest_CQSnNWTp.mjs';

const serverIslandMap = new Map();;

const _page0 = () => import('./pages/_image.astro.mjs');
const _page1 = () => import('./pages/_actions/_---path_.astro.mjs');
const _page2 = () => import('./pages/404.astro.mjs');
const _page3 = () => import('./pages/about.astro.mjs');
const _page4 = () => import('./pages/accessibility.astro.mjs');
const _page5 = () => import('./pages/admin/dashboard.astro.mjs');
const _page6 = () => import('./pages/admin/decap.astro.mjs');
const _page7 = () => import('./pages/admin/generator.astro.mjs');
const _page8 = () => import('./pages/admin/paradoxes.astro.mjs');
const _page9 = () => import('./pages/admin.astro.mjs');
const _page10 = () => import('./pages/archive.astro.mjs');
const _page11 = () => import('./pages/articles.astro.mjs');
const _page12 = () => import('./pages/articles/_---slug_.astro.mjs');
const _page13 = () => import('./pages/blog/_slug_.astro.mjs');
const _page14 = () => import('./pages/blog.astro.mjs');
const _page15 = () => import('./pages/book.astro.mjs');
const _page16 = () => import('./pages/contact.astro.mjs');
const _page17 = () => import('./pages/courses/_slug_.astro.mjs');
const _page18 = () => import('./pages/dashboard/learning.astro.mjs');
const _page19 = () => import('./pages/dashboard/settings.astro.mjs');
const _page20 = () => import('./pages/dashboard.astro.mjs');
const _page21 = () => import('./pages/definitions/choice.astro.mjs');
const _page22 = () => import('./pages/definitions/fear.astro.mjs');
const _page23 = () => import('./pages/definitions/love.astro.mjs');
const _page24 = () => import('./pages/faq.astro.mjs');
const _page25 = () => import('./pages/forbidden-library.astro.mjs');
const _page26 = () => import('./pages/glossary/_term_.astro.mjs');
const _page27 = () => import('./pages/glossary.astro.mjs');
const _page28 = () => import('./pages/intake.astro.mjs');
const _page29 = () => import('./pages/journey/mental-health.astro.mjs');
const _page30 = () => import('./pages/journey/_id_.astro.mjs');
const _page31 = () => import('./pages/library.astro.mjs');
const _page32 = () => import('./pages/method.astro.mjs');
const _page33 = () => import('./pages/now.astro.mjs');
const _page34 = () => import('./pages/personal-consultation.astro.mjs');
const _page35 = () => import('./pages/podcast.astro.mjs');
const _page36 = () => import('./pages/premium.astro.mjs');
const _page37 = () => import('./pages/premium-access.astro.mjs');
const _page38 = () => import('./pages/privacy.astro.mjs');
const _page39 = () => import('./pages/products/_slug_.astro.mjs');
const _page40 = () => import('./pages/products.astro.mjs');
const _page41 = () => import('./pages/questions.astro.mjs');
const _page42 = () => import('./pages/root-problem-tree.astro.mjs');
const _page43 = () => import('./pages/rss.xml.astro.mjs');
const _page44 = () => import('./pages/search.astro.mjs');
const _page45 = () => import('./pages/services/couples.astro.mjs');
const _page46 = () => import('./pages/services.astro.mjs');
const _page47 = () => import('./pages/simulators.astro.mjs');
const _page48 = () => import('./pages/sitemap.xml.astro.mjs');
const _page49 = () => import('./pages/studio.astro.mjs');
const _page50 = () => import('./pages/terms.astro.mjs');
const _page51 = () => import('./pages/testimonials.astro.mjs');
const _page52 = () => import('./pages/thank-you.astro.mjs');
const _page53 = () => import('./pages/therapists.astro.mjs');
const _page54 = () => import('./pages/topics/_topic_.astro.mjs');
const _page55 = () => import('./pages/index.astro.mjs');
const pageMap = new Map([
    ["node_modules/@astrojs/cloudflare/dist/entrypoints/image-endpoint.js", _page0],
    ["node_modules/astro/dist/actions/runtime/route.js", _page1],
    ["src/pages/404.astro", _page2],
    ["src/pages/about/index.astro", _page3],
    ["src/pages/accessibility.astro", _page4],
    ["src/pages/admin/dashboard.astro", _page5],
    ["src/pages/admin/decap.html", _page6],
    ["src/pages/admin/generator.astro", _page7],
    ["src/pages/admin/paradoxes.astro", _page8],
    ["src/pages/admin/index.astro", _page9],
    ["src/pages/archive/index.astro", _page10],
    ["src/pages/articles/index.astro", _page11],
    ["src/pages/articles/[...slug].astro", _page12],
    ["src/pages/blog/[slug].astro", _page13],
    ["src/pages/blog/index.astro", _page14],
    ["src/pages/book.astro", _page15],
    ["src/pages/contact.astro", _page16],
    ["src/pages/courses/[slug].astro", _page17],
    ["src/pages/dashboard/learning.astro", _page18],
    ["src/pages/dashboard/settings.astro", _page19],
    ["src/pages/dashboard.astro", _page20],
    ["src/pages/definitions/choice.astro", _page21],
    ["src/pages/definitions/fear.astro", _page22],
    ["src/pages/definitions/love.astro", _page23],
    ["src/pages/faq.astro", _page24],
    ["src/pages/forbidden-library.astro", _page25],
    ["src/pages/glossary/[term].astro", _page26],
    ["src/pages/glossary/index.astro", _page27],
    ["src/pages/intake.astro", _page28],
    ["src/pages/journey/mental-health.astro", _page29],
    ["src/pages/journey/[id].astro", _page30],
    ["src/pages/library.astro", _page31],
    ["src/pages/method.astro", _page32],
    ["src/pages/now.astro", _page33],
    ["src/pages/personal-consultation.astro", _page34],
    ["src/pages/podcast/index.astro", _page35],
    ["src/pages/premium.astro", _page36],
    ["src/pages/premium-access.astro", _page37],
    ["src/pages/privacy.astro", _page38],
    ["src/pages/products/[slug].astro", _page39],
    ["src/pages/products/index.astro", _page40],
    ["src/pages/questions/index.astro", _page41],
    ["src/pages/root-problem-tree.astro", _page42],
    ["src/pages/rss.xml.js", _page43],
    ["src/pages/search.astro", _page44],
    ["src/pages/services/couples/index.astro", _page45],
    ["src/pages/services.astro", _page46],
    ["src/pages/simulators/index.astro", _page47],
    ["src/pages/sitemap.xml.ts", _page48],
    ["src/pages/studio/index.astro", _page49],
    ["src/pages/terms.astro", _page50],
    ["src/pages/testimonials.astro", _page51],
    ["src/pages/thank-you.astro", _page52],
    ["src/pages/therapists.astro", _page53],
    ["src/pages/topics/[topic].astro", _page54],
    ["src/pages/index.astro", _page55]
]);

const _manifest = Object.assign(manifest, {
    pageMap,
    serverIslandMap,
    renderers,
    actions: () => import('./entrypoint.mjs'),
    middleware: () => import('./_astro-internal_middleware.mjs')
});
const _args = undefined;
const _exports = createExports(_manifest);
const __astrojsSsrVirtualEntry = _exports.default;
const _start = 'start';
if (Object.prototype.hasOwnProperty.call(serverEntrypointModule, _start)) {
	serverEntrypointModule[_start](_manifest, _args);
}

export { __astrojsSsrVirtualEntry as default, pageMap };
