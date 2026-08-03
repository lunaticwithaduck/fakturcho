'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { forwardRef } from 'react';
import {
  dialogCloseStyles,
  dialogContentStyles,
  dialogOverlayStyles,
  dialogPositionerStyles,
} from './Dialog.styles';

type DialogContentProps = Omit<DialogPrimitive.DialogContentProps, 'className'> & {
  className?: string;
  closeLabel?: string;
};

export const DialogContent = forwardRef<HTMLDivElement, DialogContentProps>(
  ({ children, className, closeLabel = 'Затвори', ...rest }, ref) => (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className={dialogOverlayStyles()} />
      <div className={dialogPositionerStyles()}>
        <DialogPrimitive.Content ref={ref} className={dialogContentStyles({ className })} {...rest}>
          {children}
          <DialogPrimitive.Close aria-label={closeLabel} className={dialogCloseStyles()}>
            <X className="size-4" aria-hidden />
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </div>
    </DialogPrimitive.Portal>
  ),
);

DialogContent.displayName = 'DialogContent';
