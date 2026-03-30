import{r as v}from"./pagefind-client.BBJgR3th.js";import"./local-site-search.KQByz5hj.js";const g="מזקק את המנגנון...";function x(){const t=new URLSearchParams(window.location.search).get("q")?.trim()??"";if(t)return t;const r=document.querySelector("[data-pagefind-input]"),n=r instanceof HTMLInputElement?r.value.trim():"";return n||"משהו מסוים"}function h(e){return`היי, חיפשתי באתר על ${e} ולא מצאתי. אני רוצה לקבוע פגישה מצולמת ולפרק את זה יחד.`}function w(e){e.setAttribute("aria-busy","true"),e.innerHTML=`
    <div class="nm-feedback-loading space-y-4 rounded-2xl border border-[color-mix(in_srgb,var(--nm-fg)_8%,transparent)] bg-[color-mix(in_srgb,var(--nm-surface-muted)_55%,white)] p-5 text-right">
      <p class="text-[clamp(0.95rem,0.9rem+0.2vw,1.05rem)] font-medium text-[var(--nm-fg)]">${g}</p>
      <div class="space-y-3" aria-hidden="true">
        <span class="nm-skeleton-line nm-skeleton-line--88 block rounded-lg"></span>
        <span class="nm-skeleton-line nm-skeleton-line--60 block rounded-lg"></span>
        <span class="nm-skeleton-line nm-skeleton-line--88 block rounded-lg"></span>
      </div>
    </div>`}function u(e){e.removeAttribute("aria-busy");const t=String(e.dataset.waDigits??"").replace(/\D/g,""),r=x(),n=t?`https://wa.me/${t}?text=${encodeURIComponent(h(r))}`:"",i=n?`<a
        href="${n}"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[color-mix(in_srgb,#1A1A1A_22%,transparent)] bg-transparent px-5 py-3 text-center text-[clamp(0.9rem,0.85rem+0.2vw,1rem)] font-semibold text-[#1A1A1A] transition hover:bg-[color-mix(in_srgb,#1A1A1A_6%,transparent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D42B2B]"
        aria-label="פתיחת וואטסאפ עם הודעה מוכנה על החיפוש שלא הניב תוצאות"
      >שליחה בוואטסאפ עם טקסט מוכן</a>`:"";e.innerHTML=`
    <div class="nm-search-empty space-y-6 rounded-2xl border border-[color-mix(in_srgb,#1A1A1A_12%,transparent)] bg-[#FAFAF8] p-6 text-right text-[#1A1A1A] [font-family:'Assistant_Variable','Heebo',system-ui,sans-serif] leading-[1.6]">
      <div class="space-y-3 text-[clamp(0.95rem,0.9rem+0.2vw,1.05rem)]">
        <p>החיפוש עדיין לא פגש את המחשבה הנכונה כאן.</p>
        <p>אולי ננסה לשאול את ההפך?</p>
        <p>אפשר להמשיך למאמרים שכבר מחכים לך.</p>
        <p>אפשר גם שנשב לפרק את זה יחד באולפן.</p>
        <p>אנחנו מצלמים שיחות עומק כאלו כדי להעלות תכנים חדשים שמעניינים אותך.</p>
      </div>
      <nav aria-label="קישורים מהירים" class="space-y-2">
        <ul class="m-0 list-none space-y-2 p-0">
          <li>
            <a
              href="/tags/hidden-assumption"
              class="flex w-full items-center gap-2 rounded-xl py-2 ps-1 pe-1 text-[clamp(0.9rem,0.85rem+0.2vw,1rem)] font-medium text-[#1A1A1A] underline-offset-4 transition hover:bg-[color-mix(in_srgb,#1A1A1A_5%,transparent)] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D42B2B]"
            >
              <span>הנחה סמויה</span>
              <span class="ms-auto shrink-0 text-[#D42B2B]" aria-hidden="true">←</span>
            </a>
          </li>
          <li>
            <a
              href="/articles/why-bad-things-happen/"
              class="flex w-full items-center gap-2 rounded-xl py-2 ps-1 pe-1 text-[clamp(0.9rem,0.85rem+0.2vw,1rem)] font-medium text-[#1A1A1A] underline-offset-4 transition hover:bg-[color-mix(in_srgb,#1A1A1A_5%,transparent)] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D42B2B]"
            >
              <span class="shrink-0 text-[#D42B2B]" aria-hidden="true">←</span>
              <span>למה דברים רעים קורים</span>
            </a>
          </li>
          <li>
            <a
              href="/library/"
              class="flex w-full items-center gap-2 rounded-xl py-2 ps-1 pe-1 text-[clamp(0.9rem,0.85rem+0.2vw,1rem)] font-medium text-[#1A1A1A] underline-offset-4 transition hover:bg-[color-mix(in_srgb,#1A1A1A_5%,transparent)] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D42B2B]"
            >
              <span>כל המאמרים</span>
              <span class="ms-auto shrink-0 text-[#D42B2B]" aria-hidden="true">←</span>
            </a>
          </li>
        </ul>
      </nav>
      <div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
        <a
          href="/services#balcony-experience"
          class="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[#D42B2B] px-6 py-3 text-center text-[clamp(0.95rem,0.9rem+0.2vw,1.05rem)] font-bold text-white transition hover:bg-[color-mix(in_srgb,#D42B2B_92%,#1A1A1A)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1A1A1A]"
          aria-label="מעבר לפרטי האולפן לפריקת נושא בפודקאסט"
        >אני רוצה לפרק את זה באולפן</a>
        ${i}
      </div>
    </div>`}function A(e,t){if(e.removeAttribute("aria-busy"),e.innerHTML="",!t.length){u(e);return}t.forEach(r=>{const n=document.createElement("a");n.href=r.url,n.className="block rounded-2xl border border-[color-mix(in_srgb,var(--nm-fg)_10%,transparent)] bg-white/70 px-4 py-3 transition-colors duration-300 hover:bg-white",n.setAttribute("data-nm-loading-label","בודק את שורש הרצון...");const i=document.createElement("p");i.className="text-[clamp(0.95rem,0.9rem+0.25vw,1.1rem)] font-semibold text-[var(--nm-fg)]",i.textContent=r.title;const a=document.createElement("p");a.className="mt-1 text-[clamp(0.85rem,0.8rem+0.2vw,1rem)] text-[color-mix(in_srgb,var(--nm-fg)_60%,var(--nm-bg))]",a.innerHTML=r.excerpt,n.append(i,a),e.appendChild(n)})}async function f(){typeof window.__nmSearchPageCleanup=="function"&&window.__nmSearchPageCleanup();const e=document.querySelector("[data-pagefind-input]"),t=document.querySelector("[data-pagefind-results]");if(!(e instanceof HTMLInputElement)||!(t instanceof HTMLElement))return;const n=(new URLSearchParams(window.location.search).get("q")||"").trim();let i=0,a=0;const l=async(s,{announce:o=!1}={})=>{const p=String(s||"").trim();if(!p){u(t);return}const b=++a;o&&window.__nmHapticLight?.(),w(t);let c=[];try{c=await v(p,12)}catch{c=[]}b===a&&A(t,c)},m=s=>{const o=s.target instanceof HTMLInputElement?s.target.value:"";window.clearTimeout(i),i=window.setTimeout(()=>{l(o,{announce:o.trim().length>1})},200)},d=()=>{l(e.value,{announce:!0})};if(e.addEventListener("input",m),e.addEventListener("search",d),window.__nmSearchPageCleanup=()=>{window.clearTimeout(i),e.removeEventListener("input",m),e.removeEventListener("search",d),window.__nmSearchPageCleanup=void 0},n){e.value=n,l(n);return}u(t)}window.__nmSearchPageLoadBound||(window.__nmSearchPageLoadBound=!0,document.addEventListener("astro:page-load",()=>{f()}));window.requestAnimationFrame(()=>{f()});
