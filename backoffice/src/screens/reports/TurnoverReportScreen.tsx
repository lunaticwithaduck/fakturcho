import { Select, Typography } from 'antd';
import { useState } from 'react';
import { useReportMonths } from '../../hooks/useReportMonths';
import { useTurnoverReport } from '../../hooks/useTurnoverReport';
import { ApiErrorAlert } from '../../layout/ApiErrorAlert';
import { formatMonthLabel } from '../../utils/date';
import { TurnoverReportTable } from './TurnoverReportTable';

export function TurnoverReportScreen() {
  const { data: months, isError: monthsError } = useReportMonths();
  const [month, setMonth] = useState(months[0] ?? '');
  const {
    data: rows,
    isLoading,
    isError: rowsError,
  } = useTurnoverReport(month || (months[0] ?? ''));

  const options = months.map((value) => ({ value, label: formatMonthLabel(value) }));

  return (
    <div>
      <Typography.Title level={3}>Оборот по месеци</Typography.Title>
      {monthsError || rowsError ? <ApiErrorAlert /> : null}
      <Select
        value={month || (months[0] ?? '')}
        onChange={setMonth}
        options={options}
        style={{ width: 220, marginBottom: 16 }}
      />
      <TurnoverReportTable rows={rows} loading={isLoading} />
    </div>
  );
}
