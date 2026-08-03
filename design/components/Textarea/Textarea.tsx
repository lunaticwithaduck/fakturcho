'use client';

import type { TextareaHTMLAttributes } from 'react';
import { forwardRef, useId } from 'react';
import {
  fieldErrorStyles,
  fieldHintStyles,
  fieldLabelStyles,
  fieldWrapperStyles,
} from '../../lib/fieldStyles';
import { textareaStyles } from './Textarea.styles';

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  hint?: string;
  error?: string;
  wrapperClassName?: string;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, hint, error, disabled, className, wrapperClassName, id, rows = 4, ...rest }, ref) => {
    const autoId = useId();
    const textareaId = id ?? autoId;
    const describedById = error ? `${textareaId}-error` : hint ? `${textareaId}-hint` : undefined;

    return (
      <div className={fieldWrapperStyles({ className: wrapperClassName })}>
        <label htmlFor={textareaId} className={fieldLabelStyles()}>
          {label}
        </label>
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={describedById}
          className={textareaStyles({ invalid: !!error, disabled: !!disabled, className })}
          {...rest}
        />
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

Textarea.displayName = 'Textarea';
