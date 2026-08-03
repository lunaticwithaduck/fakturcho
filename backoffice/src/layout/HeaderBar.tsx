import { Button, Layout, Typography } from 'antd';
import { useNavigate } from 'react-router';
import { clearAuthenticated } from '../auth/authStorage';

const { Header } = Layout;

export function HeaderBar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAuthenticated();
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
