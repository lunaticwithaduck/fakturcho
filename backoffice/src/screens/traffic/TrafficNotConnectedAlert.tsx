import { Alert } from 'antd';

export function TrafficNotConnectedAlert() {
  return (
    <Alert
      type="warning"
      showIcon
      message="Umami не е свързан"
      description="Настройките UMAMI_API_URL, UMAMI_WEBSITE_ID и данните за вход не са зададени на api услугата, или Umami е недостъпен в момента."
      style={{ marginBottom: 16 }}
    />
  );
}
