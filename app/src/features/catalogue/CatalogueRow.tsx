import { formatMoney } from '@app/features/shared/format';
import { Button, Card } from '@design/components';
import type { CatalogueItemDto } from '@shared/types';

interface CatalogueRowProps {
  item: CatalogueItemDto;
  onEdit: (item: CatalogueItemDto) => void;
  onDelete: (item: CatalogueItemDto) => void;
}

export function CatalogueRow({ item, onEdit, onDelete }: CatalogueRowProps) {
  return (
    <Card className="flex items-center justify-between gap-4">
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="truncate text-sm font-semibold text-text">{item.name}</p>
        <p className="truncate text-sm text-text-muted">
          {formatMoney(item.defaultUnitPrice)} / {item.unit}
        </p>
      </div>
      <div className="flex shrink-0 gap-1">
        <Button variant="ghost" size="sm" onClick={() => onEdit(item)}>
          Редактирай
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onDelete(item)}>
          Изтрий
        </Button>
      </div>
    </Card>
  );
}
