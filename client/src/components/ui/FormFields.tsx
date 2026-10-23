import { useId, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

const baseField =
  "w-full rounded-xl border-2 bg-white px-4 py-2.5 font-body text-brand-ink transition-colors placeholder:text-slate-400 disabled:bg-slate-50 disabled:cursor-not-allowed";

const stateStyles = (hasError: boolean) =>
  hasError
    ? "border-coral-400 focus:border-coral-500"
    : "border-slate-200 focus:border-brand-sky";

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-1 text-sm font-semibold text-red-600">
      {message}
    </p>
  );
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, className, id, ...rest }: InputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const errorId = `${inputId}-error`;
  return (
    <div>
      <label htmlFor={inputId} className="mb-1 block font-bold text-sm text-slate-700">
        {label}
        {rest.required && <span className="text-coral-500" aria-hidden="true"> *</span>}
      </label>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : hint ? `${inputId}-hint` : undefined}
        className={cn(baseField, stateStyles(!!error), className)}
        {...rest}
      />
      {hint && !error && (
        <p id={`${inputId}-hint`} className="mt-1 text-xs text-slate-500">
          {hint}
        </p>
      )}
      <FieldError id={errorId} message={error} />
    </div>
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}

export function Select({ label, error, options, placeholder, className, id, ...rest }: SelectProps) {
  const autoId = useId();
  const selectId = id ?? autoId;
  const errorId = `${selectId}-error`;
  return (
    <div>
      <label htmlFor={selectId} className="mb-1 block font-bold text-sm text-slate-700">
        {label}
        {rest.required && <span className="text-coral-500" aria-hidden="true"> *</span>}
      </label>
      <select
        id={selectId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={cn(baseField, stateStyles(!!error), "appearance-none", className)}
        {...rest}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <FieldError id={errorId} message={error} />
    </div>
  );
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
}

export function Textarea({ label, error, className, id, ...rest }: TextareaProps) {
  const autoId = useId();
  const areaId = id ?? autoId;
  const errorId = `${areaId}-error`;
  return (
    <div>
      <label htmlFor={areaId} className="mb-1 block font-bold text-sm text-slate-700">
        {label}
        {rest.required && <span className="text-coral-500" aria-hidden="true"> *</span>}
      </label>
      <textarea
        id={areaId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={cn(baseField, stateStyles(!!error), "min-h-28 resize-y", className)}
        {...rest}
      />
      <FieldError id={errorId} message={error} />
    </div>
  );
}
