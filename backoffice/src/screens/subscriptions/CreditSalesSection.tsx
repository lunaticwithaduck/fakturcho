import { Typography } from 'antd';
import { useCreditPurchases } from '../../hooks/useCreditPurchases';
import { useCreditSalesMonths } from '../../hooks/useCreditSalesMonths';
import { useCreditSalesSummary } from '../../hooks/useCreditSalesSummary';
import { ApiErrorAlert } from '../../layout/ApiErrorAlert';
import { CreditPurchasesTable } from './CreditPurchasesTable';
import { CreditSalesMonthsTable } from './CreditSalesMonthsTable';
import { CreditSalesSummaryCards } from './CreditSalesSummaryCards';

export function CreditSalesSection() {
  const { data: summary, isError: summaryError } = useCreditSalesSummary();
  const { data: months, isLoading: monthsLoading, isError: monthsError } = useCreditSalesMonths();
  const {
    data: purchases,
    isLoading: purchasesLoading,
    isError: purchasesError,
  } = useCreditPurchases();

  return (
    <div style={{ marginTop: 32 }}>
      <Typography.Title level={3}>Продадени кредити</Typography.Title>
      {summaryError || monthsError || purchasesError ? <ApiErrorAlert /> : null}
      <CreditSalesSummaryCards summary={summary} />
      <CreditSalesMonthsTable months={months} loading={monthsLoading} />
      <div style={{ marginTop: 16 }}>
        <CreditPurchasesTable purchases={purchases} loading={purchasesLoading} />
      </div>
    </div>
  );
}
