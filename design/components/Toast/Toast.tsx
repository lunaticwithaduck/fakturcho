'use client';

import * as ToastPrimitive from '@radix-ui/react-toast';
import { X } from 'lucide-react';
import {
  toastCloseStyles,
  toastDescriptionStyles,
  toastRootStyles,
  toastTitleStyles,
} from './Toast.styles';
import type { ToastItem } from './useToast';

type ToastProps = {
  item: ToastItem;
  onOpenChange: (open: boolean) => void;
  closeLabel?: string;
};

export function Toast({ item, onOpenChange, closeLabel = 'Затвори' }: ToastProps) {
  return (
    <ToastPrimitive.Root
      className={toastRootStyles({ variant: item.variant })}
      onOpenChange={onOpenChange}
      duration={5000}
    >
      <div className="flex-1">
        <ToastPrimitive.Title className={toastTitleStyles()}>{item.title}</ToastPrimitive.Title>
        {item.description ? (
          <ToastPrimitive.Description className={toastDescriptionStyles()}>
            {item.description}
          </ToastPrimitive.Description>
        ) : null}
      </div>
      <ToastPrimitive.Close aria-label={closeLabel} className={toastCloseStyles()}>
        <X className="size-4" aria-hidden />
      </ToastPrimitive.Close>
    </ToastPrimitive.Root>
  );
}
