'use client';

import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import { forwardRef, useId } from 'react';
import { radioItemStyles, radioLabelStyles } from './RadioGroup.styles';

type RadioGroupItemProps = Omit<RadioGroupPrimitive.RadioGroupItemProps, 'className'> & {
  label: string;
  className?: string;
};

export const RadioGroupItem = forwardRef<HTMLButtonElement, RadioGroupItemProps>(
  ({ label, disabled, id, className, ...rest }, ref) => {
    const autoId = useId();
    const itemId = id ?? autoId;

    return (
      <label htmlFor={itemId} className={radioLabelStyles({ disabled: !!disabled })}>
        <RadioGroupPrimitive.Item
          ref={ref}
          id={itemId}
          disabled={disabled}
          className={radioItemStyles({ className })}
          {...rest}
        >
          <RadioGroupPrimitive.Indicator className="size-2.5 rounded-full bg-accent" />
        </RadioGroupPrimitive.Item>
        {label}
      </label>
    );
  },
);

RadioGroupItem.displayName = 'RadioGroupItem';
