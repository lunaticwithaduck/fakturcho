'use client';

import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { forwardRef } from 'react';
import { dropdownMenuItemStyles } from './DropdownMenu.styles';

type DropdownMenuItemProps = Omit<DropdownMenuPrimitive.DropdownMenuItemProps, 'className'> & {
  className?: string;
};

export const DropdownMenuItem = forwardRef<HTMLDivElement, DropdownMenuItemProps>(
  ({ className, ...rest }, ref) => (
    <DropdownMenuPrimitive.Item
      ref={ref}
      className={dropdownMenuItemStyles({ className })}
      {...rest}
    />
  ),
);

DropdownMenuItem.displayName = 'DropdownMenuItem';
