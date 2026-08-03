import { tv } from 'tailwind-variants';

export const badgeStyles = tv({
  base: 'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
  variants: {
    variant: {
      neutral: 'border-border bg-surface-sunken text-text-muted',
      success: 'border-success-border bg-success-subtle text-success',
      warning: 'border-warning-border bg-warning-subtle text-warning',
      danger: 'border-danger-border bg-danger-subtle text-danger',
    },
  },
  defaultVariants: {
    variant: 'neutral',
  },
});

export type BadgeStylesProps = Parameters<typeof badgeStyles>[0];
