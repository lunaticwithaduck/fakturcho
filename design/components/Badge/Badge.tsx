import type { HTMLAttributes } from 'react';
import { type BadgeStylesProps, badgeStyles } from './Badge.styles';

type BadgeProps = BadgeStylesProps & Omit<HTMLAttributes<HTMLSpanElement>, 'className'>;

export function Badge({ variant, className, ...rest }: BadgeProps) {
  return <span className={badgeStyles({ variant, className })} {...rest} />;
}
