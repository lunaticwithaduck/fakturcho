import { ConfigProvider } from 'antd';
import bgBG from 'antd/locale/bg_BG';
import { RouterProvider } from 'react-router';
import { router } from './router';
import { theme } from './theme';

export function App() {
  return (
    <ConfigProvider locale={bgBG} theme={theme}>
      <RouterProvider router={router} />
    </ConfigProvider>
  );
}
