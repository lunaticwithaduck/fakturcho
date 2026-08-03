'use client';

import * as SwitchPrimitive from '@radix-ui/react-switch';
import { forwardRef, useId } from 'react';
import { switchLabelStyles, switchRootStyles, switchThumbStyles } from './Switch.styles';

type SwitchProps = Omit<SwitchPrimitive.SwitchProps, 'className'> & {
  label: string;
  className?: string;
};

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
  ({ label, disabled, id, className, ...rest }, ref) => {
    const autoId = useId();
    const switchId = id ?? autoId;

    return (
      <label htmlFor={switchId} className={switchLabelStyles({ disabled: !!disabled })}>
        <SwitchPrimitive.Root
          ref={ref}
          id={switchId}
          disabled={disabled}
          className={switchRootStyles({ className })}
          {...rest}
        >
          <SwitchPrimitive.Thumb className={switchThumbStyles()} />
        </SwitchPrimitive.Root>
        {label}
      </label>
    );
  },
);

Switch.displayName = 'Switch';
