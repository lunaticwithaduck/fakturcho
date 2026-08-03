'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { forwardRef } from 'react';
import { dialogTitleStyles } from './Dialog.styles';

type DialogTitleProps = Omit<DialogPrimitive.DialogTitleProps, 'className'> & {
  className?: string;
};

export const DialogTitle = forwardRef<HTMLHeadingElement, DialogTitleProps>(
  ({ className, ...rest }, ref) => (
    <DialogPrimitive.Title ref={ref} className={dialogTitleStyles({ className })} {...rest} />
  ),
);

DialogTitle.displayName = 'DialogTitle';
