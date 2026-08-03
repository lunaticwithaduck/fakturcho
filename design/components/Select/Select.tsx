'use client';

import * as SelectPrimitive from '@radix-ui/react-select';
import { ChevronDown } from 'lucide-react';
import type { ReactNode } from 'react';
import { useId } from 'react';
import { fieldErrorStyles, fieldLabelStyles, fieldWrapperStyles } from '../../lib/fieldStyles';
import { selectContentStyles, selectTriggerStyles } from './Select.styles';

type SelectProps = Omit<SelectPrimitive.SelectProps, 'children'> & {
  label: string;
  placeholder?: string;
  error?: string;
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
};

export function Select({
  label,
  placeholder,
  error,
  size = 'md',
  children,
  ...rootProps
}: SelectProps) {
  const triggerId = useId();

  return (
    <div className={fieldWrapperStyles()}>
      <label htmlFor={triggerId} className={fieldLabelStyles()}>
        {label}
      </label>
      <SelectPrimitive.Root {...rootProps}>
        <SelectPrimitive.Trigger
          id={triggerId}
          aria-invalid={!!error}
          className={selectTriggerStyles({ invalid: !!error, size })}
        >
          <SelectPrimitive.Value placeholder={placeholder} />
          <SelectPrimitive.Icon>
            <ChevronDown className="size-4 text-text-muted" aria-hidden />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            position="popper"
            sideOffset={6}
            className={selectContentStyles()}
          >
            <SelectPrimitive.Viewport>{children}</SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
      {error ? <p className={fieldErrorStyles()}>{error}</p> : null}
    </div>
  );
}
