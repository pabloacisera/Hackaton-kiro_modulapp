import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from './views/DashboardLayout';
import { LoginPage } from './views/LoginPage';
import { RegisterInitiatePage } from './views/RegisterInitiatePage';
import { RegisterVerifyPage } from './views/RegisterVerifyPage';
import { OrdersPage } from './views/OrdersPage';
import { QuotesPage } from './views/QuotesPage';
import { SuppliesPage } from './views/SuppliesPage';
import { ComplaintsPage } from './views/ComplaintsPage';
import { ExcelImportWizard } from './views/ExcelImportWizard';
import { CatalogImportWizard } from './views/CatalogImportWizard';
import { DeliveriesPage } from './views/DeliveriesPage';
import { CatalogPage } from './views/CatalogPage';
import { SettingsPage } from './views/SettingsPage';
import { useAuth } from './controllers/useAuth';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { accessToken } = useAuth();
  if (!accessToken) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterInitiatePage />} />
        <Route path="/register/verify" element={<RegisterVerifyPage />} />

        {/* Protected routes */}
        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/catalog" replace />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/catalog/import" element={<CatalogImportWizard />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/quotes" element={<QuotesPage />} />
          <Route path="/supplies" element={<SuppliesPage />} />
          <Route path="/supplies/import" element={<ExcelImportWizard />} />
          <Route path="/complaints" element={<ComplaintsPage />} />
          <Route path="/deliveries" element={<DeliveriesPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
