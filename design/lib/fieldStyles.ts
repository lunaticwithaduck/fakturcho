import { tv } from 'tailwind-variants';

export const fieldLabelStyles = tv({
  base: 'text-sm font-medium text-text',
});

export const fieldHintStyles = tv({
  base: 'text-sm text-text-muted',
});

export const fieldErrorStyles = tv({
  base: 'text-sm font-medium text-danger',
});

export const fieldWrapperStyles = tv({
  base: 'flex flex-col gap-1.5',
});
