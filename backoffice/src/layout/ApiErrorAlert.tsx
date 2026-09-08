import { Alert } from 'antd';

export function ApiErrorAlert() {
  return (
    <Alert
      type="error"
      showIcon
      message="Възникна грешка при зареждане на данните."
      style={{ marginBottom: 16 }}
    />
  );
}
