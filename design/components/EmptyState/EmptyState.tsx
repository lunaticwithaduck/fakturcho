import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { emptyStateStyles } from './EmptyState.styles';

type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  const styles = emptyStateStyles();

  return (
    <div className={styles.root({ className })}>
      {Icon && <Icon className={styles.icon()} aria-hidden />}
      <p className={styles.title()}>{title}</p>
      {description && <p className={styles.description()}>{description}</p>}
      {action && <div className={styles.action()}>{action}</div>}
    </div>
  );
}
