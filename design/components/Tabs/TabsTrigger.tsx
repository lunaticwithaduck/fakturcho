'use client';

import * as TabsPrimitive from '@radix-ui/react-tabs';
import { forwardRef } from 'react';
import { tabsTriggerStyles } from './Tabs.styles';

type TabsTriggerProps = Omit<TabsPrimitive.TabsTriggerProps, 'className'> & {
  className?: string;
};

export const TabsTrigger = forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, ...rest }, ref) => (
    <TabsPrimitive.Trigger ref={ref} className={tabsTriggerStyles({ className })} {...rest} />
  ),
);

TabsTrigger.displayName = 'TabsTrigger';
