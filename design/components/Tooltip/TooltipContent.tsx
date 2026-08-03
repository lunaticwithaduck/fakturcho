'use client';

import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { forwardRef } from 'react';
import { tooltipContentStyles } from './Tooltip.styles';

type TooltipContentProps = Omit<TooltipPrimitive.TooltipContentProps, 'className'> & {
  className?: string;
};

export const TooltipContent = forwardRef<HTMLDivElement, TooltipContentProps>(
  ({ className, sideOffset = 6, ...rest }, ref) => (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={tooltipContentStyles({ className })}
        {...rest}
      />
    </TooltipPrimitive.Portal>
  ),
);

TooltipContent.displayName = 'TooltipContent';
