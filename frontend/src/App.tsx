import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Tenants } from './pages/admin/Tenants';
import { Logistics } from './pages/admin/Logistics';
import { Stock } from './pages/admin/Stock';
import { Users } from './pages/admin/Users';
import { OperatorDashboard } from './pages/logistics/OperatorDashboard';
import { DelivererDashboard } from './pages/logistics/DelivererDashboard';
import { SupportDashboard } from './pages/support/SupportDashboard';

import { useAuth, AuthProvider } from './contexts/AuthContext';
import { Login } from './pages/auth/Login';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Carregando...</div>;
  return user ? children : <Navigate to="/login" replace />;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to="/admin/tenants" replace />} />

      {/* Protected Routes */}
      <Route path="/admin" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route path="tenants" element={<Tenants />} />
        <Route path="logistics" element={<Logistics />} />
        <Route path="stock" element={<Stock />} />
        <Route path="users" element={<Users />} />
        <Route path="operator" element={<OperatorDashboard />} />
        <Route path="deliverer" element={<DelivererDashboard />} />
        <Route path="support" element={<SupportDashboard />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
