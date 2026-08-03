'use client';

import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { forwardRef } from 'react';
import { dropdownMenuContentStyles } from './DropdownMenu.styles';

type DropdownMenuContentProps = Omit<
  DropdownMenuPrimitive.DropdownMenuContentProps,
  'className'
> & {
  className?: string;
};

export const DropdownMenuContent = forwardRef<HTMLDivElement, DropdownMenuContentProps>(
  ({ className, sideOffset = 6, ...rest }, ref) => (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={dropdownMenuContentStyles({ className })}
        {...rest}
      />
    </DropdownMenuPrimitive.Portal>
  ),
);

DropdownMenuContent.displayName = 'DropdownMenuContent';
