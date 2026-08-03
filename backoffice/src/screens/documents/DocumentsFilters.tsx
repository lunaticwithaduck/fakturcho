import {
  DOCUMENT_STATUS_LABELS,
  DOCUMENT_STATUSES,
  DOCUMENT_TYPE_LABELS,
  DOCUMENT_TYPES,
} from '@fakturcho/shared-types';
import { Flex, Input, Select } from 'antd';
import type { DocumentStatusFilter, DocumentTypeFilter } from '../../types/admin';

interface DocumentsFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  documentType: DocumentTypeFilter;
  onDocumentTypeChange: (value: DocumentTypeFilter) => void;
  status: DocumentStatusFilter;
  onStatusChange: (value: DocumentStatusFilter) => void;
}

const TYPE_OPTIONS: { value: DocumentTypeFilter; label: string }[] = [
  { value: 'all', label: 'Всички типове' },
  ...DOCUMENT_TYPES.map((type) => ({ value: type, label: DOCUMENT_TYPE_LABELS[type] })),
];

const STATUS_OPTIONS: { value: DocumentStatusFilter; label: string }[] = [
  { value: 'all', label: 'Всички статуси' },
  ...DOCUMENT_STATUSES.map((status) => ({ value: status, label: DOCUMENT_STATUS_LABELS[status] })),
];

export function DocumentsFilters({
  search,
  onSearchChange,
  documentType,
  onDocumentTypeChange,
  status,
  onStatusChange,
}: DocumentsFiltersProps) {
  return (
    <Flex gap={12} style={{ marginBottom: 16 }} wrap>
      <Input.Search
        allowClear
        placeholder="Търсене по абонат, получател или номер"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        style={{ width: 300 }}
      />
      <Select<DocumentTypeFilter>
        value={documentType}
        onChange={onDocumentTypeChange}
        options={TYPE_OPTIONS}
        style={{ width: 200 }}
      />
      <Select<DocumentStatusFilter>
        value={status}
        onChange={onStatusChange}
        options={STATUS_OPTIONS}
        style={{ width: 200 }}
      />
    </Flex>
  );
}
