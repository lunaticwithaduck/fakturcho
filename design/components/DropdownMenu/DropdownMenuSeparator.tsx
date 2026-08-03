'use client';

import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { forwardRef } from 'react';
import { dropdownMenuSeparatorStyles } from './DropdownMenu.styles';

type DropdownMenuSeparatorProps = Omit<
  DropdownMenuPrimitive.DropdownMenuSeparatorProps,
  'className'
> & {
  className?: string;
};

export const DropdownMenuSeparator = forwardRef<HTMLDivElement, DropdownMenuSeparatorProps>(
  ({ className, ...rest }, ref) => (
    <DropdownMenuPrimitive.Separator
      ref={ref}
      className={dropdownMenuSeparatorStyles({ className })}
      {...rest}
    />
  ),
);

DropdownMenuSeparator.displayName = 'DropdownMenuSeparator';
