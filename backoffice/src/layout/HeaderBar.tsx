import { Button, Layout, Typography } from 'antd';
import { useNavigate } from 'react-router';
import { authClient } from '../auth/authClient';

const { Header } = Layout;

export function HeaderBar() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await authClient.signOut();
    navigate('/login', { replace: true });
  };

  return (
    <Header
      style={{
        background: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
      }}
    >
      <Typography.Text strong>Администраторски панел</Typography.Text>
      <Button onClick={handleLogout}>Изход</Button>
    </Header>
  );
}
