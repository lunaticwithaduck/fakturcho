import type { MenuProps } from 'antd';
import { Menu } from 'antd';
import { useLocation, useNavigate } from 'react-router';

type MenuItem = NonNullable<MenuProps['items']>[number];

const ITEMS: MenuItem[] = [
  { key: '/accounts', label: 'Абонати' },
  { key: '/documents', label: 'Документи' },
  { key: '/subscriptions', label: 'Абонаменти' },
  { key: '/usage', label: 'Използване' },
  { key: '/reports', label: 'Справки' },
];

export function SideMenu() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <Menu
      theme="dark"
      mode="inline"
      selectedKeys={[location.pathname]}
      items={ITEMS}
      onClick={({ key }) => navigate(key)}
    />
  );
}
