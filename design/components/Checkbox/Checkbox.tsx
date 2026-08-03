'use client';

import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';
import { forwardRef, useId } from 'react';
import { checkboxLabelStyles, checkboxRootStyles } from './Checkbox.styles';

type CheckboxProps = Omit<CheckboxPrimitive.CheckboxProps, 'className'> & {
  label: string;
  error?: boolean;
  className?: string;
};

export const Checkbox = forwardRef<HTMLButtonElement, CheckboxProps>(
  ({ label, error, disabled, id, className, ...rest }, ref) => {
    const autoId = useId();
    const checkboxId = id ?? autoId;

    return (
      <label htmlFor={checkboxId} className={checkboxLabelStyles({ disabled: !!disabled })}>
        <CheckboxPrimitive.Root
          ref={ref}
          id={checkboxId}
          disabled={disabled}
          className={checkboxRootStyles({ invalid: !!error, className })}
          {...rest}
        >
          <CheckboxPrimitive.Indicator>
            <Check className="size-3.5 text-text-inverse" aria-hidden />
          </CheckboxPrimitive.Indicator>
        </CheckboxPrimitive.Root>
        {label}
      </label>
    );
  },
);

Checkbox.displayName = 'Checkbox';
