'use client';

import { formatMoney } from '@app/features/shared/format';
import { Input } from '@design/components';
import type { CatalogueItemDto } from '@shared/types';
import { useState } from 'react';

interface CatalogueAutocompleteInputProps {
  value: string;
  items: readonly CatalogueItemDto[];
  onChangeName: (name: string) => void;
  onSelectItem: (item: CatalogueItemDto) => void;
}

export function CatalogueAutocompleteInput({
  value,
  items,
  onChangeName,
  onSelectItem,
}: CatalogueAutocompleteInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const query = value.trim().toLowerCase();
  const matches = (
    query === '' ? items : items.filter((item) => item.name.toLowerCase().includes(query))
  ).slice(0, 8);

  return (
    <div className="relative">
      <Input
        label="Наименование"
        required
        value={value}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        onChange={(event) => {
          onChangeName(event.target.value);
          setIsOpen(true);
        }}
      />
      {isOpen && matches.length > 0 ? (
        <div className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-border bg-surface-raised shadow-md">
          {matches.map((item) => (
            <button
              key={item.id}
              type="button"
              className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm text-text hover:bg-surface-sunken"
              onMouseDown={(event) => {
                event.preventDefault();
                onSelectItem(item);
                setIsOpen(false);
              }}
            >
              <span className="truncate">{item.name}</span>
              <span className="shrink-0 text-text-muted">{formatMoney(item.defaultUnitPrice)}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
