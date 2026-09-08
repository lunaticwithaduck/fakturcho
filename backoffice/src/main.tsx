import '@ant-design/v5-patch-for-react-19';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { App } from './App';
import { store } from './store';

const container = document.getElementById('root');
if (container) {
  createRoot(container).render(
    <Provider store={store}>
      <App />
    </Provider>,
  );
}
