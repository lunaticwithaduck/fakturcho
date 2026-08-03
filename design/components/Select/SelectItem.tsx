'use client';

import * as SelectPrimitive from '@radix-ui/react-select';
import { Check } from 'lucide-react';
import { forwardRef } from 'react';
import { selectItemStyles } from './Select.styles';

type SelectItemProps = SelectPrimitive.SelectItemProps;

export const SelectItem = forwardRef<HTMLDivElement, SelectItemProps>(
  ({ children, className, ...rest }, ref) => (
    <SelectPrimitive.Item ref={ref} className={selectItemStyles({ className })} {...rest}>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator className="absolute right-3 inline-flex items-center">
        <Check className="size-4 text-accent" aria-hidden />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  ),
);

SelectItem.displayName = 'SelectItem';
