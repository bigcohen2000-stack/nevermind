import { useId, useState } from "react";

const oldPoints = [
  "כיבוי סימפטומים במקום הקשבה",
  "מאבק מול מחשבות ורגשות",
  "תנועה מעומס לפתרון זמני",
];

const newPoints = [
  "התבוננות מדויקת במה שכבר קורה",
  "הפרדה בין חוויה לסיפור",
  "בהירות שמייצרת תנועה שקטה",
];

export default function TruthSlider() {
  const [value, setValue] = useState(55);
  const sliderId = useId();

  return (
    <section
      aria-labelledby={`${sliderId}-title`}
      className="w-full space-y-6"
    >
      <div className="space-y-3">
        <p className="text-[clamp(0.85rem,0.8rem+0.25vw,1rem)] text-[#1A1A1A]/55">
          אמת בתנועה
        </p>
        <h2
          id={`${sliderId}-title`}
          className="text-[clamp(1.8rem,1.45rem+1.4vw,2.6rem)] font-semibold text-[#1A1A1A]"
        >
          הדרך הישנה מול דרך NeverMind
        </h2>
      </div>

      <div className="relative overflow-hidden rounded-[clamp(1.5rem,2vw,2.5rem)] border border-white/70 bg-white/70 p-[clamp(1.5rem,2vw,2.5rem)] shadow-sm backdrop-blur-md">
        <div
          aria-hidden="true"
          className="grid gap-8 md:grid-cols-2 grayscale blur-[0.6px]"
        >
          <div className="space-y-4 text-[#1A1A1A]/45">
            <h3 className="text-[clamp(1.2rem,1.05rem+0.6vw,1.6rem)] font-semibold">
              הדרך הישנה
            </h3>
            <p className="text-[clamp(0.95rem,0.9rem+0.25vw,1.1rem)] leading-[1.7]">
              תיקון אינסופי, דרמה, הישרדות.
            </p>
            <ul className="list-disc space-y-2 ps-5 text-[clamp(0.95rem,0.9rem+0.25vw,1.1rem)] leading-[1.7]">
              {oldPoints.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="space-y-4 text-[#1A1A1A]/45">
            <h3 className="text-[clamp(1.2rem,1.05rem+0.6vw,1.6rem)] font-semibold">
              דרך NeverMind
            </h3>
            <p className="text-[clamp(0.95rem,0.9rem+0.25vw,1.1rem)] leading-[1.7]">
              ראייה, בהירות, חום אנושי.
            </p>
            <ul className="list-disc space-y-2 ps-5 text-[clamp(0.95rem,0.9rem+0.25vw,1.1rem)] leading-[1.7]">
              {newPoints.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ clipPath: `inset(0 ${100 - value}% 0 0)` }}
        >
          <div className="grid gap-8 md:grid-cols-2">
            <div className="space-y-4 text-[#2A1C12]">
              <h3 className="text-[clamp(1.2rem,1.05rem+0.6vw,1.6rem)] font-semibold">
                הדרך הישנה
              </h3>
              <p className="text-[clamp(0.95rem,0.9rem+0.25vw,1.1rem)] leading-[1.7]">
                תיקון אינסופי, דרמה, הישרדות.
              </p>
              <ul className="list-disc space-y-2 ps-5 text-[clamp(0.95rem,0.9rem+0.25vw,1.1rem)] leading-[1.7]">
                {oldPoints.map((item) => (
                  <li key={`new-${item}`}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="space-y-4 text-[#2A1C12]">
              <h3 className="text-[clamp(1.2rem,1.05rem+0.6vw,1.6rem)] font-semibold">
                דרך NeverMind
              </h3>
              <p className="text-[clamp(0.95rem,0.9rem+0.25vw,1.1rem)] leading-[1.7]">
                ראייה, בהירות, חום אנושי.
              </p>
              <ul className="list-disc space-y-2 ps-5 text-[clamp(0.95rem,0.9rem+0.25vw,1.1rem)] leading-[1.7]">
                {newPoints.map((item) => (
                  <li key={`newer-${item}`}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 z-10"
          style={{ left: `${value}%` }}
        >
          <div className="relative h-full -translate-x-1/2">
            <span className="block h-full w-px bg-[#1A1A1A]/25" />
            <span className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#1A1A1A]/25 bg-white/90" />
          </div>
        </div>

        <div className="sr-only" aria-live="polite">
          <p>הדרך הישנה: תיקון אינסופי, דרמה, הישרדות.</p>
          <p>דרך NeverMind: ראייה, בהירות, חום אנושי.</p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <label
          htmlFor={sliderId}
          className="text-[clamp(0.9rem,0.85rem+0.25vw,1.05rem)] text-[#1A1A1A]/60"
        >
          הזזת ההשוואה
        </label>
        <input
          id={sliderId}
          type="range"
          min={0}
          max={100}
          value={value}
          onChange={(event) => setValue(Number(event.target.value))}
          className="h-1 w-full cursor-ew-resize accent-[#1A1A1A]/70"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={value}
        />
      </div>
    </section>
  );
}
