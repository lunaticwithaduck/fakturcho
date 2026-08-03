'use client';

import * as TabsPrimitive from '@radix-ui/react-tabs';
import { forwardRef } from 'react';
import { tabsContentStyles } from './Tabs.styles';

type TabsContentProps = Omit<TabsPrimitive.TabsContentProps, 'className'> & {
  className?: string;
};

export const TabsContent = forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, ...rest }, ref) => (
    <TabsPrimitive.Content ref={ref} className={tabsContentStyles({ className })} {...rest} />
  ),
);

TabsContent.displayName = 'TabsContent';
