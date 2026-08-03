'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { forwardRef } from 'react';
import { dialogDescriptionStyles } from './Dialog.styles';

type DialogDescriptionProps = Omit<DialogPrimitive.DialogDescriptionProps, 'className'> & {
  className?: string;
};

export const DialogDescription = forwardRef<HTMLParagraphElement, DialogDescriptionProps>(
  ({ className, ...rest }, ref) => (
    <DialogPrimitive.Description
      ref={ref}
      className={dialogDescriptionStyles({ className })}
      {...rest}
    />
  ),
);

DialogDescription.displayName = 'DialogDescription';
