'use client';

import { Slot } from '@radix-ui/react-slot';
import type { LucideIcon } from 'lucide-react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { forwardRef } from 'react';
import { type ButtonStylesProps, buttonStyles } from './Button.styles';

type ButtonProps = ButtonStylesProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'color'> & {
    asChild?: boolean;
    iconLeft?: LucideIcon;
    iconRight?: LucideIcon;
    children: ReactNode;
  };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      asChild,
      variant,
      size,
      className,
      children,
      iconLeft: IconLeft,
      iconRight: IconRight,
      ...rest
    },
    ref,
  ) => {
    const classes = buttonStyles({ variant, size, className });

    if (asChild) {
      return (
        <Slot ref={ref} className={classes} {...rest}>
          {children}
        </Slot>
      );
    }

    return (
      <button ref={ref} type="button" className={classes} {...rest}>
        {IconLeft && <IconLeft className="size-4" aria-hidden />}
        {children}
        {IconRight && <IconRight className="size-4" aria-hidden />}
      </button>
    );
  },
);

Button.displayName = 'Button';
