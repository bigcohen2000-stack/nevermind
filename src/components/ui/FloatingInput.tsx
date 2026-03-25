import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

const PH = "\u00a0";

const defaultEmailInvalid = "נראה שיש טעות קטנה בכתובת - בדוק שוב?";

function defaultValidateForType(type: string | undefined, value: string): boolean {
  const t = (type ?? "text").toLowerCase();
  if (t === "email") {
    const v = value.trim();
    if (!v) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }
  return true;
}

export type FloatingInputProps = {
  id: string;
  label: string;
  name?: string;
  type?: string;
  multiline?: boolean;
  rows?: number;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  validate?: (value: string) => boolean;
  errorMessage?: string;
  required?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
  dir?: "rtl" | "ltr";
  className?: string;
  hideValidation?: boolean;
  fieldInnerEnd?: React.ReactNode;
  fieldPaddingEndClass?: string;
  /** שורה בתוך משפט: תווית נשמרת ב־sr-only, בלי אנימציית צף */
  variant?: "default" | "embed";
  /** ב־embed: מציג כיתוב קטן מתחת לשדה כדי שהתווית תיראה גם בעין */
  embedShowCaption?: boolean;
  /** data-bq-fear / data-bq-would לסקריפט מילוי משפט */
  datasetMarker?: "bq-fear" | "bq-would";
  /** data-pagefind-input לעמוד 404 */
  pagefindInput?: boolean;
  /** data-trigger-input ל־TriggerBuster */
  dataTriggerInput?: "fact" | "story" | "gain";
  /** data-decision-input */
  dataDecisionInput?: boolean;
  /** data-cost-input */
  dataCostInput?: boolean;
  /** data-name-input ל־Gatekeeper */
  dataNameInput?: boolean;
} & Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  | "id"
  | "type"
  | "value"
  | "defaultValue"
  | "onChange"
  | "placeholder"
  | "className"
  | "dir"
  | "onInput"
  | "ref"
>;

export const FloatingInput = forwardRef<HTMLInputElement | HTMLTextAreaElement, FloatingInputProps>(
  function FloatingInput(
    {
      id,
      label,
      name,
      type = "text",
      multiline = false,
      rows = 4,
      value: valueProp,
      defaultValue,
      onChange,
      validate,
      errorMessage = defaultEmailInvalid,
      required,
      readOnly,
      disabled,
      dir = "rtl",
      className = "",
      hideValidation,
      fieldInnerEnd,
      fieldPaddingEndClass,
      variant = "default",
      embedShowCaption = false,
      datasetMarker,
      pagefindInput,
      dataTriggerInput,
      dataDecisionInput,
      dataCostInput,
      dataNameInput,
      maxLength,
      autoComplete,
      min,
      max,
      step,
      inputMode,
      ...restNative
    },
    forwardedRef
  ) {
    const errId = useId();
    const innerRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
    useImperativeHandle(forwardedRef, () => innerRef.current as HTMLInputElement | HTMLTextAreaElement, []);

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [innerValue, setInnerValue] = useState(() =>
      valueProp !== undefined ? valueProp : (defaultValue ?? "")
    );
    const [showValid, setShowValid] = useState(false);
    const [showInvalid, setShowInvalid] = useState(false);
    const [liveError, setLiveError] = useState<string | null>(null);

    const isControlled = valueProp !== undefined;

    useEffect(() => {
      if (isControlled) setInnerValue(valueProp);
    }, [isControlled, valueProp]);

    const runValidation = useCallback(
      (raw: string) => {
        if (hideValidation || readOnly) {
          setShowValid(false);
          setShowInvalid(false);
          setLiveError(null);
          return;
        }
        if (!raw.trim()) {
          setShowValid(false);
          setShowInvalid(false);
          setLiveError(null);
          return;
        }
        let ok = true;
        if (validate) {
          ok = validate(raw);
        } else {
          ok = defaultValidateForType(type, raw);
        }
        if (ok) {
          setShowValid(true);
          setShowInvalid(false);
          setLiveError(null);
        } else {
          setShowValid(false);
          setShowInvalid(true);
          setLiveError(errorMessage);
        }
      },
      [errorMessage, hideValidation, readOnly, type, validate]
    );

    const scheduleValidate = useCallback(
      (raw: string) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
          debounceRef.current = null;
          runValidation(raw);
        }, 400);
      },
      [runValidation]
    );

    useEffect(() => {
      return () => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
      };
    }, []);

    const syncValue = (raw: string) => {
      if (!isControlled) setInnerValue(raw);
      onChange?.(raw);
    };

    const handleInput = (raw: string) => {
      syncValue(raw);
      scheduleValidate(raw);
    };

    const isEmbed = variant === "embed";

    const controlClass = multiline
      ? `nm-floating-control nm-floating-control--textarea w-full resize-y${isEmbed ? " nm-floating-control--embed" : " peer"}`
      : `nm-floating-control w-full${isEmbed ? " nm-floating-control--embed" : " peer"}`;

    const padClass = `${controlClass} ${fieldPaddingEndClass ?? ""}`.trim();

    const labelText = required ? `${label} (חובה)` : label;

    const dataMarkerProps = {
      ...(datasetMarker === "bq-fear"
        ? { "data-bq-fear": "" as const }
        : datasetMarker === "bq-would"
          ? { "data-bq-would": "" as const }
          : {}),
      ...(pagefindInput ? { "data-pagefind-input": "" as const } : {}),
      ...(dataTriggerInput ? { "data-trigger-input": dataTriggerInput } : {}),
      ...(dataDecisionInput ? { "data-decision-input": "" as const } : {}),
      ...(dataCostInput ? { "data-cost-input": "" as const } : {}),
      ...(dataNameInput ? { "data-name-input": "" as const } : {}),
    };

    if (isEmbed && !multiline) {
      return (
        <span className={`inline-flex max-w-full flex-col align-baseline ${className}`.trim()}>
          <span className="inline-flex max-w-full items-baseline gap-0">
            <label htmlFor={id} className="sr-only">
              {labelText}
            </label>
            <input
            {...restNative}
            {...dataMarkerProps}
            ref={innerRef as React.RefObject<HTMLInputElement>}
            id={id}
            name={name}
            type={type}
            required={required}
            readOnly={readOnly}
            disabled={disabled}
            min={min}
            max={max}
            step={step}
            inputMode={inputMode}
            placeholder={PH}
            aria-invalid={showInvalid || undefined}
            aria-describedby={showInvalid && liveError ? errId : undefined}
            maxLength={maxLength}
            autoComplete={autoComplete}
            className={padClass}
            value={isControlled ? valueProp : innerValue}
            onChange={(e) => handleInput(e.currentTarget.value)}
            title={labelText}
          />
            {!hideValidation && !readOnly ? (
              <span className="ms-1 inline align-middle text-base" aria-hidden>
                {showValid ? <span className="text-[var(--color-valid)]">✓</span> : null}
                {showInvalid ? <span className="text-[var(--color-red)]">×</span> : null}
              </span>
            ) : null}
          </span>
          {embedShowCaption ? (
            <span className="mt-0.5 block max-w-[min(100%,18rem)] text-[0.7rem] leading-tight text-[color-mix(in_srgb,var(--color-black)_58%,var(--color-white))]">
              {label}
            </span>
          ) : null}
          {showInvalid && liveError ? (
            <span id={errId} role="alert" className="sr-only">
              {liveError}
            </span>
          ) : null}
        </span>
      );
    }

    const validationUi = !hideValidation && !readOnly && (
      <span
        className="mt-[0.65rem] inline-flex h-6 min-w-6 shrink-0 items-center justify-center text-base leading-none"
        aria-hidden
      >
        {showValid ? (
          <span className="text-[var(--color-valid)]" title="תקין">
            ✓
          </span>
        ) : null}
        {showInvalid ? (
          <span className="text-[var(--color-red)]" title={liveError ?? ""}>
            ×
          </span>
        ) : null}
      </span>
    );

    return (
      <div className={`nm-floating-field w-full ${className}`.trim()} data-dir={dir}>
        <div className="flex flex-row items-start gap-2" dir={dir}>
          <div className="relative min-w-0 flex-1">
            {fieldInnerEnd ? (
              <div
                className={`pointer-events-none absolute top-1/2 z-[1] -translate-y-1/2 ${dir === "rtl" ? "right-3" : "left-3"}`}
                aria-hidden
              >
                {fieldInnerEnd}
              </div>
            ) : null}
            {multiline ? (
              <textarea
                {...(restNative as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
                {...dataMarkerProps}
                ref={innerRef as React.RefObject<HTMLTextAreaElement>}
                id={id}
                name={name}
                required={required}
                readOnly={readOnly}
                disabled={disabled}
                rows={rows}
                placeholder={PH}
                aria-invalid={showInvalid || undefined}
                aria-describedby={showInvalid && liveError ? errId : undefined}
                maxLength={maxLength}
                autoComplete={autoComplete}
                className={padClass}
                value={isControlled ? valueProp : innerValue}
                onChange={(e) => handleInput(e.currentTarget.value)}
              />
            ) : (
              <input
                {...restNative}
                {...dataMarkerProps}
                ref={innerRef as React.RefObject<HTMLInputElement>}
                id={id}
                name={name}
                type={type}
                required={required}
                readOnly={readOnly}
                disabled={disabled}
                min={min}
                max={max}
                step={step}
                inputMode={inputMode}
                placeholder={PH}
                aria-invalid={showInvalid || undefined}
                aria-describedby={showInvalid && liveError ? errId : undefined}
                maxLength={maxLength}
                autoComplete={autoComplete}
                className={padClass}
                value={isControlled ? valueProp : innerValue}
                onChange={(e) => handleInput(e.currentTarget.value)}
              />
            )}
            <label className="nm-floating-label" htmlFor={id}>
              {labelText}
            </label>
          </div>
          {validationUi}
        </div>
        {showInvalid && liveError ? (
          <p id={errId} role="alert" className="mt-1.5 text-right text-sm text-[var(--color-red)]">
            {liveError}
          </p>
        ) : null}
      </div>
    );
  }
);

FloatingInput.displayName = "FloatingInput";
