import type { BadgeStylesProps } from '@design/components';
import type { DocumentStatus } from '@shared/types';

type BadgeVariant = NonNullable<NonNullable<BadgeStylesProps>['variant']>;

const VARIANT_BY_STATUS: Record<DocumentStatus, BadgeVariant> = {
  draft: 'neutral',
  sent: 'neutral',
  paid: 'success',
  overdue: 'warning',
  cancelled: 'danger',
};

export function getStatusBadgeVariant(status: DocumentStatus): BadgeVariant {
  return VARIANT_BY_STATUS[status];
}
