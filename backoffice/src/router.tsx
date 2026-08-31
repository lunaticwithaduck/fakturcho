import { createBrowserRouter, Navigate } from 'react-router';
import { RequireAuth } from './auth/RequireAuth';
import { AppLayout } from './layout/AppLayout';
import { AccountsScreen } from './screens/accounts/AccountsScreen';
import { DocumentsScreen } from './screens/documents/DocumentsScreen';
import { LoginScreen } from './screens/login/LoginScreen';
import { TurnoverReportScreen } from './screens/reports/TurnoverReportScreen';
import { UsageScreen } from './screens/usage/UsageScreen';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginScreen /> },
  {
    path: '/',
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Navigate to="/accounts" replace /> },
      { path: 'accounts', element: <AccountsScreen /> },
      { path: 'documents', element: <DocumentsScreen /> },
      { path: 'usage', element: <UsageScreen /> },
      { path: 'reports', element: <TurnoverReportScreen /> },
    ],
  },
  { path: '*', element: <Navigate to="/accounts" replace /> },
]);
