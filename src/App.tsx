import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './App.css';
import './i18n';
import { AppLayout } from './components/layout/AppLayout';
import { PrivateRoute } from './components/layout/PrivateRoute';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProductListPage } from './features/products';
import { SuppliersPage } from './pages/settings/SuppliersPage';
import { WarehousesPage } from './pages/settings/WarehousesPage';
import { RepsPage } from './pages/settings/RepsPage';
import { DriversPage } from './pages/settings/DriversPage';
import { ShopsPage } from './pages/settings/ShopsPage';
import { SettingsPage } from './pages/SettingsPage';
import { PurchasesPage } from './pages/purchases/PurchasesPage';
import { InventoryPage } from './pages/InventoryPage';
import { RepOrdersPage } from './pages/RepOrdersPage';
import { LoadingSheetsPage } from './pages/LoadingSheetsPage';
import { DeliveriesPage } from './pages/DeliveriesPage';
import { ReportsPage } from './pages/ReportsPage';
import { UsersPage } from './pages/UsersPage';
import { RolesPage } from './pages/RolesPage';
import { NotFoundPage } from './pages/NotFoundPage';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
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
            <Route index element={<DashboardPage />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="purchases" element={<PurchasesPage />} />
            <Route path="inventory" element={<InventoryPage />} />
            <Route path="sales" element={<RepOrdersPage />} />
            <Route path="loading" element={<LoadingSheetsPage />} />
            <Route path="deliveries" element={<DeliveriesPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="settings/products" element={<ProductListPage />} />
            <Route path="settings/suppliers" element={<SuppliersPage />} />
            <Route path="settings/warehouses" element={<WarehousesPage />} />
            <Route path="settings/reps" element={<RepsPage />} />
            <Route path="settings/drivers" element={<DriversPage />} />
            <Route path="settings/shops" element={<ShopsPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="roles" element={<RolesPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
