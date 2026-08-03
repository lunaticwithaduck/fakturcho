import { Layout } from 'antd';
import { Outlet } from 'react-router';
import { HeaderBar } from './HeaderBar';
import { SideMenu } from './SideMenu';

const { Sider, Content } = Layout;

export function AppLayout() {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider breakpoint="lg" collapsedWidth={0}>
        <div style={{ color: '#fff', textAlign: 'center', padding: 16, fontWeight: 600 }}>
          Фактурчо
        </div>
        <SideMenu />
      </Sider>
      <Layout>
        <HeaderBar />
        <Content style={{ margin: 24 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
