import type { HTMLAttributes } from 'react';
import { cardStyles } from './Card.styles';

type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...rest }: CardProps) {
  return <div className={cardStyles({ className })} {...rest} />;
}
