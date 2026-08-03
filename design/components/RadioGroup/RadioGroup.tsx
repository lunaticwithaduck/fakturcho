'use client';

import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import { forwardRef } from 'react';
import { radioGroupRootStyles } from './RadioGroup.styles';

type RadioGroupProps = Omit<RadioGroupPrimitive.RadioGroupProps, 'className'> & {
  className?: string;
};

export const RadioGroup = forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ className, ...rest }, ref) => (
    <RadioGroupPrimitive.Root ref={ref} className={radioGroupRootStyles({ className })} {...rest} />
  ),
);

RadioGroup.displayName = 'RadioGroup';
