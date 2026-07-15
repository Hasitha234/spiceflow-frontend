import { Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Spin, App as AntApp } from 'antd';
import './App.css';
import './i18n';
import { AppLayout } from './components/layout/AppLayout';
import { PrivateRoute } from './components/layout/PrivateRoute';
import { featureRoutes } from './routes/featureRoutes';
import { lazyWithRetry } from './utils/lazyWithRetry';

// Route-level code splitting via lazyWithRetry (auto-recovers from stale chunks after deploy)
const LoginPage = lazyWithRetry(() => import('./pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const DashboardPage = lazyWithRetry(() => import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const DaySummaryPage = lazyWithRetry(() => import('./pages/DaySummaryPage').then((m) => ({ default: m.DaySummaryPage })));
const WarehousesPage = lazyWithRetry(() => import('./pages/settings/WarehousesPage').then((m) => ({ default: m.WarehousesPage })));
const DriversPage = lazyWithRetry(() => import('./pages/settings/DriversPage').then((m) => ({ default: m.DriversPage })));
const CategoriesPage = lazyWithRetry(() => import('./pages/settings/CategoriesPage').then((m) => ({ default: m.CategoriesPage })));
const SettingsPage = lazyWithRetry(() => import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const PurchasesPage = lazyWithRetry(() => import('./pages/purchases/PurchasesPage').then((m) => ({ default: m.PurchasesPage })));
const CreatePurchasePage = lazyWithRetry(() => import('./pages/purchases/CreatePurchasePage').then((m) => ({ default: m.CreatePurchasePage })));
const InventoryPage = lazyWithRetry(() => import('./pages/InventoryPage').then((m) => ({ default: m.InventoryPage })));
const RepOrdersPage = lazyWithRetry(() => import('./pages/RepOrdersPage').then((m) => ({ default: m.RepOrdersPage })));
const CreateRepOrderPage = lazyWithRetry(() => import('./pages/CreateRepOrderPage').then((m) => ({ default: m.CreateRepOrderPage })));
const LoadingSheetsPage = lazyWithRetry(() => import('./pages/LoadingSheetsPage').then((m) => ({ default: m.LoadingSheetsPage })));
const DeliveriesPage = lazyWithRetry(() => import('./pages/DeliveriesPage').then((m) => ({ default: m.DeliveriesPage })));
const ReportsPage = lazyWithRetry(() => import('./pages/ReportsPage').then((m) => ({ default: m.ReportsPage })));
const UsersPage = lazyWithRetry(() => import('./pages/UsersPage').then((m) => ({ default: m.UsersPage })));
const RolesPage = lazyWithRetry(() => import('./pages/RolesPage').then((m) => ({ default: m.RolesPage })));
const EndOfDaySummaryPage = lazyWithRetry(() => import('./pages/EndOfDaySummaryPage').then((m) => ({ default: m.EndOfDaySummaryPage })));
const QrScanPage = lazyWithRetry(() => import('./pages/QrScanPage').then((m) => ({ default: m.QrScanPage })));
const NotFoundPage = lazyWithRetry(() => import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));

const queryClient = new QueryClient();

function PageLoader() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-900">
      <Spin size="large" />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AntApp>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/*"
              element={
                <PrivateRoute>
                  <AppLayout />
                </PrivateRoute>
              }
            >
              <Route index element={<Navigate to="day-summary" replace />} />
              <Route path="day-summary" element={<DaySummaryPage />} />
              <Route path="purchases" element={<PurchasesPage />} />
              <Route path="purchases/new" element={<CreatePurchasePage />} />
              <Route path="purchases/:id/edit" element={<CreatePurchasePage />} />
              <Route path="inventory" element={<InventoryPage />} />
              <Route path="sales" element={<RepOrdersPage />} />
              <Route path="sales/new" element={<CreateRepOrderPage />} />
              <Route path="loading" element={<LoadingSheetsPage />} />
              <Route path="deliveries" element={<DeliveriesPage />} />
              <Route path="qr-scan" element={<QrScanPage />} />
              {featureRoutes.map(({ metadata, element: FeatureComponent }) => (
                <Route key={metadata.id} path={metadata.path} element={<FeatureComponent />} />
              ))}
              <Route path="settings/warehouses" element={<WarehousesPage />} />
              <Route path="settings/drivers" element={<DriversPage />} />
              <Route path="settings/categories" element={<CategoriesPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
          </Suspense>
        </BrowserRouter>
      </AntApp>
    </QueryClientProvider>
  );
}

export default App;
