import { Alert, Button, Card, Flex, Form, Input, Typography } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useLazyGetMeQuery } from '../../api';
import { authClient } from '../../auth/authClient';

interface LoginFormValues {
  email: string;
  password: string;
}

const GENERIC_ERROR = 'Грешен имейл или парола.';
const NOT_ADMIN_ERROR = 'Нямате администраторски достъп.';

export function LoginScreen() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [fetchMe] = useLazyGetMeQuery();

  const handleFinish = async (values: LoginFormValues) => {
    setSubmitting(true);
    setError(null);

    const signInResult = await authClient.signIn.email({
      email: values.email,
      password: values.password,
    });
    if (signInResult.error) {
      setError(GENERIC_ERROR);
      setSubmitting(false);
      return;
    }

    const me = await fetchMe()
      .unwrap()
      .catch(() => null);
    if (me?.role !== 'admin') {
      await authClient.signOut();
      setError(NOT_ADMIN_ERROR);
      setSubmitting(false);
      return;
    }

    navigate('/accounts', { replace: true });
  };

  return (
    <Flex align="center" justify="center" style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Card style={{ width: 380 }}>
        <Typography.Title level={3} style={{ textAlign: 'center' }}>
          Фактурчо — админ
        </Typography.Title>
        {error ? (
          <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} />
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
            <Button type="primary" htmlType="submit" block loading={submitting}>
              Вход
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </Flex>
  );
}
