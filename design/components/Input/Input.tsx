'use client';

import type { InputHTMLAttributes } from 'react';
import { forwardRef, useId } from 'react';
import {
  fieldErrorStyles,
  fieldHintStyles,
  fieldLabelStyles,
  fieldWrapperStyles,
} from '../../lib/fieldStyles';
import { inputFieldStyles, inputWrapperStyles } from './Input.styles';

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & {
  label: string;
  hint?: string;
  error?: string;
  size?: 'sm' | 'md' | 'lg';
  wrapperClassName?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { label, hint, error, size = 'md', disabled, className, wrapperClassName, id, ...rest },
    ref,
  ) => {
    const autoId = useId();
    const inputId = id ?? autoId;
    const describedById = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

    return (
      <div className={fieldWrapperStyles({ className: wrapperClassName })}>
        <label htmlFor={inputId} className={fieldLabelStyles()}>
          {label}
        </label>
        <div className={inputWrapperStyles({ invalid: !!error, size, disabled: !!disabled })}>
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            aria-invalid={!!error}
            aria-describedby={describedById}
            className={inputFieldStyles({ size, className })}
            {...rest}
          />
        </div>
        {error ? (
          <p id={describedById} className={fieldErrorStyles()}>
            {error}
          </p>
        ) : hint ? (
          <p id={describedById} className={fieldHintStyles()}>
            {hint}
          </p>
        ) : null}
      </div>
    );
  },
);

Input.displayName = 'Input';
