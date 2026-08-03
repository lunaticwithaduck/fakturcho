'use client';

import * as TabsPrimitive from '@radix-ui/react-tabs';
import { forwardRef } from 'react';
import { tabsListStyles } from './Tabs.styles';

type TabsListProps = Omit<TabsPrimitive.TabsListProps, 'className'> & {
  className?: string;
};

export const TabsList = forwardRef<HTMLDivElement, TabsListProps>(({ className, ...rest }, ref) => (
  <TabsPrimitive.List ref={ref} className={tabsListStyles({ className })} {...rest} />
));

TabsList.displayName = 'TabsList';
