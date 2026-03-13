import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ProtectedRoute, getHomeRoute } from './components/ProtectedRoute';
import { Tenants } from './pages/admin/Tenants';
import { Logistics } from './pages/admin/Logistics';
import { Stock } from './pages/admin/Stock';
import { Users } from './pages/admin/Users';
import { OperatorDashboard } from './pages/logistics/OperatorDashboard';
import { DelivererDashboard } from './pages/logistics/DelivererDashboard';
import { SupportDashboard } from './pages/support/SupportDashboard';
import { DevSupport } from './pages/support/DevSupport';
import { CreateOrder } from './pages/support/CreateOrder';
import { OrderSearch } from './pages/support/OrderSearch';
import { OrderDetail } from './pages/support/OrderDetail';
import { AdminHome } from './pages/admin/AdminHome';
import { useAuth, AuthProvider } from './contexts/AuthContext';
import { Login } from './pages/auth/Login';

// Profile groups for each module
const GESTAO_PROFILES = ['ADMIN', 'TENANT_MANAGER', 'CUSTOMER_SUPPORT'];
const OPERATOR_PROFILES = ['ADMIN', 'LOGISTICS_OPERATOR', 'LOGISTICS_CONSULT'];
const DELIVERER_PROFILES = ['ADMIN', 'DELIVERER'];

/**
 * Smart redirect: sends user to their module's home based on profile.
 */
const SmartRedirect = () => {
    const { user, loading } = useAuth();
    if (loading) return <div>Carregando...</div>;
    if (!user) return <Navigate to="/login" replace />;
    return <Navigate to={getHomeRoute(user.profile)} replace />;
};

function AppRoutes() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<SmartRedirect />} />

            {/* ── Módulo Gestão ── */}
            <Route path="/admin" element={
                <ProtectedRoute allowedProfiles={GESTAO_PROFILES}>
                    <Layout module="gestao" />
                </ProtectedRoute>
            }>
                <Route index element={<Navigate to="home" replace />} />
                <Route path="home" element={<AdminHome />} />
                <Route path="tenants" element={<Tenants />} />
                <Route path="logistics" element={<Logistics />} />
                <Route path="stock" element={<Stock />} />
                <Route path="users" element={<Users />} />
                <Route path="support" element={<SupportDashboard />} />
                <Route path="orders/new" element={<CreateOrder />} />
                <Route path="orders/search" element={<OrderSearch />} />
                <Route path="orders/:id" element={<OrderDetail />} />
                <Route path="docs" element={<DevSupport />} />
            </Route>

            {/* ── Módulo Operador Logístico ── */}
            <Route path="/operator" element={
                <ProtectedRoute allowedProfiles={OPERATOR_PROFILES}>
                    <Layout module="operator" />
                </ProtectedRoute>
            }>
                <Route index element={<Navigate to="pipeline" replace />} />
                <Route path="stock" element={<Stock />} />
                <Route path="pipeline" element={<OperatorDashboard />} />
            </Route>

            {/* ── Módulo Entregador ── */}
            <Route path="/deliverer" element={
                <ProtectedRoute allowedProfiles={DELIVERER_PROFILES}>
                    <Layout module="deliverer" />
                </ProtectedRoute>
            }>
                <Route index element={<Navigate to="entregas" replace />} />
                <Route path="entregas" element={<DelivererDashboard />} />
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
