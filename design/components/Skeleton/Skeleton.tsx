import type { HTMLAttributes } from 'react';
import { skeletonStyles } from './Skeleton.styles';

type SkeletonProps = HTMLAttributes<HTMLDivElement>;

export function Skeleton({ className, ...rest }: SkeletonProps) {
  return <div className={skeletonStyles({ className })} {...rest} />;
}
