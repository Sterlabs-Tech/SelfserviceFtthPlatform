import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedProfiles: string[];
}

/**
 * Determines the default home route for a given user profile.
 */
export const getHomeRoute = (profile: string): string => {
    switch (profile) {
        case 'ADMIN':
        case 'TENANT_MANAGER':
        case 'CUSTOMER_SUPPORT':
            return '/admin/home';
        case 'LOGISTICS_OPERATOR':
        case 'LOGISTICS_CONSULT':
            return '/operator/pipeline';
        case 'DELIVERER':
            return '/deliverer/entregas';
        default:
            return '/login';
    }
};

/**
 * Route guard that checks authentication AND profile authorization.
 * If the user is not logged in, redirects to /login.
 * If the user's profile is not in the allowedProfiles list, redirects to their module's home.
 */
export const ProtectedRoute = ({ children, allowedProfiles }: ProtectedRouteProps) => {
    const { user, loading } = useAuth();

    if (loading) {
        return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>Carregando...</div>;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (!allowedProfiles.includes(user.profile)) {
        return <Navigate to={getHomeRoute(user.profile)} replace />;
    }

    return <>{children}</>;
};
