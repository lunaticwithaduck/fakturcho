import type { BadgeStylesProps, LucideIcon } from '@design/components';
import { Ban, CircleCheck, Clock, Pencil, Send } from '@design/components';
import type { DocumentStatus } from '@shared/types';

type BadgeVariant = NonNullable<NonNullable<BadgeStylesProps>['variant']>;

const VARIANT_BY_STATUS: Record<DocumentStatus, BadgeVariant> = {
  draft: 'neutral',
  sent: 'accent',
  paid: 'success',
  overdue: 'danger',
  cancelled: 'neutral',
};

const ICON_BY_STATUS: Record<DocumentStatus, LucideIcon> = {
  draft: Pencil,
  sent: Send,
  paid: CircleCheck,
  overdue: Clock,
  cancelled: Ban,
};

export function getStatusBadgeVariant(status: DocumentStatus): BadgeVariant {
  return VARIANT_BY_STATUS[status];
}

export function getStatusIcon(status: DocumentStatus): LucideIcon {
  return ICON_BY_STATUS[status];
}
