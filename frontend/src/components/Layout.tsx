import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Truck, Package, Building2, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Sidebar = () => {
    return (
        <div className="sidebar">
            <div className="sidebar-header" style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '1.5rem 2rem' }}>
                <img src="/vtal-logo.png" alt="V.tal Logo" style={{ height: '36px', marginBottom: '4px' }} />
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Autosserviço
                </span>
            </div>
            <nav className="sidebar-nav">
                <NavLink
                    to="/admin/users"
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                    <Users size={20} /> Usuários
                </NavLink>
                <NavLink
                    to="/admin/tenants"
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                    <Building2 size={20} /> Tenants
                </NavLink>
                <NavLink
                    to="/admin/logistics"
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                    <Truck size={20} /> Rel. de Logística
                </NavLink>
                <NavLink
                    to="/admin/stock"
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                    <Package size={20} /> Estoque
                </NavLink>
                <NavLink to="/admin/support" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    <LayoutDashboard size={20} /> Gestão de Pedidos
                </NavLink>

                <NavLink to="/admin/operator" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    <Package size={20} /> Fila do Operador
                </NavLink>
                <NavLink to="/admin/deliverer" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    <Truck size={20} /> Entregador App
                </NavLink>

                <div style={{ margin: '1rem 0', borderTop: '1px solid var(--border-color)', opacity: 0.3 }}></div>

                <NavLink to="/admin/docs" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} style={{ color: 'var(--brand-primary)' }}>
                    <LayoutDashboard size={20} /> Documentação API
                </NavLink>
            </nav>
        </div>
    );
};

export const Layout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="layout-container">
            <Sidebar />
            <div className="main-content">
                <header className="header" style={{ borderTop: '4px solid var(--brand-primary)', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', padding: '1rem 2rem' }}>
                    <div className="header-user" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{user?.name || 'Admin'}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{user?.profile?.replace('_', ' ') || 'SYSTEM'}</div>
                            </div>
                            {user?.photoUrl ? (
                                <img src={user.photoUrl} alt="Avatar" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                            ) : (
                                <div className="user-avatar" style={{ width: '40px', height: '40px', fontSize: '1rem' }}>
                                    {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
                                </div>
                            )}
                        </div>
                        <div style={{ width: '1px', height: '32px', background: 'var(--border-color)' }}></div>
                        <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontWeight: 500, transition: '0.2s opacity' }} onMouseOver={e => e.currentTarget.style.opacity = '0.7'} onMouseOut={e => e.currentTarget.style.opacity = '1'}>
                            <LogOut size={18} /> Sair
                        </button>
                    </div>
                </header>
                <main className="page-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};
