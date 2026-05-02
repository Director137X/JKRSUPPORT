'use client';

import { forwardRef } from 'react';

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string | null;
};

export const PortalField = forwardRef<HTMLInputElement, Props>(function PortalField(
  { label, error, id, className = '', ...rest },
  ref,
) {
  const inputId = id ?? `portal-${label.toLowerCase().replace(/\s+/g, '-')}`;
  return (
    <div className="flex flex-col">
      <label
        htmlFor={inputId}
        className="text-[11px] font-portal font-medium uppercase text-portal-tertiary"
        style={{ letterSpacing: '0.18em' }}
      >
        {label}
      </label>

      <div className="portal-field-wrap relative mt-4">
        <input
          ref={ref}
          id={inputId}
          className={`portal-input block w-full bg-transparent border-0 border-b border-portal-hairline text-[15px] font-portal text-portal-text placeholder:text-portal-tertiary py-3 outline-none focus:ring-0 focus-visible:outline-none ${className}`}
          style={{ borderRadius: 0 }}
          {...rest}
        />
        <span className="portal-field-underline" />
      </div>

      {error ? (
        <>
          <div className="h-px w-full bg-portal-error mt-1" />
          <p className="mt-2 text-[10px] font-portal text-portal-error">{error}</p>
        </>
      ) : null}
    </div>
  );
});
