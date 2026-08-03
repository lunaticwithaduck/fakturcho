'use client';

import * as ToastPrimitive from '@radix-ui/react-toast';
import { forwardRef } from 'react';
import { toastViewportStyles } from './Toast.styles';

type ToastViewportProps = Omit<ToastPrimitive.ToastViewportProps, 'className'> & {
  className?: string;
};

export const ToastViewport = forwardRef<HTMLOListElement, ToastViewportProps>(
  ({ className, ...rest }, ref) => (
    <ToastPrimitive.Viewport ref={ref} className={toastViewportStyles({ className })} {...rest} />
  ),
);

ToastViewport.displayName = 'ToastViewport';
