import { Flex, Input } from 'antd';

interface AccountsFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
}

export function AccountsFilters({ search, onSearchChange }: AccountsFiltersProps) {
  return (
    <Flex gap={12} style={{ marginBottom: 16 }} wrap>
      <Input.Search
        allowClear
        placeholder="Търсене по фирма или ЕИК"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        style={{ width: 280 }}
      />
    </Flex>
  );
}
