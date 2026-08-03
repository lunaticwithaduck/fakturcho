import { Alert, Button, Card, Flex, Form, Input, Typography } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { checkCredentials, setAuthenticated } from '../../auth/authStorage';

interface LoginFormValues {
  email: string;
  password: string;
}

export function LoginScreen() {
  const navigate = useNavigate();
  const [hasError, setHasError] = useState(false);

  const handleFinish = (values: LoginFormValues) => {
    if (checkCredentials(values.email, values.password)) {
      setAuthenticated();
      navigate('/accounts', { replace: true });
      return;
    }
    setHasError(true);
  };

  return (
    <Flex align="center" justify="center" style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Card style={{ width: 380 }}>
        <Typography.Title level={3} style={{ textAlign: 'center' }}>
          Фактурчо — админ
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ textAlign: 'center' }}>
          Демонстрационен вход, докато няма истинско админ API за оторизация.
        </Typography.Paragraph>
        {hasError ? (
          <Alert
            type="error"
            message="Грешен имейл или парола"
            showIcon
            style={{ marginBottom: 16 }}
          />
        ) : null}
        <Form<LoginFormValues> layout="vertical" onFinish={handleFinish} requiredMark={false}>
          <Form.Item
            label="Имейл"
            name="email"
            rules={[{ required: true, message: 'Въведете имейл' }]}
          >
            <Input placeholder="admin@fakturcho.bg" autoComplete="username" />
          </Form.Item>
          <Form.Item
            label="Парола"
            name="password"
            rules={[{ required: true, message: 'Въведете парола' }]}
          >
            <Input.Password autoComplete="current-password" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Вход
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </Flex>
  );
}
