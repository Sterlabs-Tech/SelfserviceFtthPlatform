import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Home, Users, Truck, Package, PackagePlus, Search, LogOut, Menu, X as CloseIcon, Boxes, Building } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

type ModuleType = 'gestao' | 'operator' | 'deliverer';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    module: ModuleType;
}

const Sidebar = ({ isOpen, onClose, module }: SidebarProps) => {
    return (
        <>
            <div className={`sidebar-overlay ${isOpen ? 'active' : ''}`} onClick={onClose}></div>
            <div className={`sidebar ${isOpen ? 'mobile-open' : ''}`}>
                <div className="sidebar-header" style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '1.5rem 2rem', position: 'relative' }}>
                    <img src="/vtal-logo.png" alt="V.tal Logo" style={{ height: '36px', marginBottom: '4px' }} />
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {module === 'gestao' ? 'Autosserviço Admin' : module === 'operator' ? 'Operador Logístico' : 'Entregador'}
                    </span>
                    <button className="mobile-close-btn" onClick={onClose}>
                        <CloseIcon size={24} />
                    </button>
                </div>
                <nav className="sidebar-nav">
                    {/* ── Módulo Gestão ── */}
                    {module === 'gestao' && (
                        <>
                            <NavLink to="/admin/home" onClick={onClose} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                                <Home size={20} /> Início
                            </NavLink>

                            <div className="sidebar-section-title" style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', marginTop: '1.5rem', marginBottom: '0.5rem', padding: '0 1rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                Pedidos
                            </div>
                            <NavLink to="/admin/support" onClick={onClose} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                                <Boxes size={20} /> Em Andamento
                            </NavLink>
                            <NavLink to="/admin/orders/new" onClick={onClose} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                                <PackagePlus size={20} /> Criar Pedido
                            </NavLink>
                            <NavLink to="/admin/orders/search" onClick={onClose} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                                <Search size={20} /> Consultar Pedido
                            </NavLink>

                            <div className="sidebar-section-title" style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', marginTop: '1.5rem', marginBottom: '0.5rem', padding: '0 1rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                Administração
                            </div>
                            <NavLink to="/admin/stock" onClick={onClose} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                                <Package size={20} /> Abastecimento
                            </NavLink>
                            <NavLink to="/admin/logistics" onClick={onClose} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                                <Truck size={20} /> Operadores
                            </NavLink>
                            <NavLink to="/admin/tenants" onClick={onClose} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                                <Building size={20} /> Tenants
                            </NavLink>
                            <NavLink to="/admin/users" onClick={onClose} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                                <Users size={20} /> Usuários
                            </NavLink>
                        </>
                    )}

                    {/* ── Módulo Operador Logístico ── */}
                    {module === 'operator' && (
                        <>
                            <div className="sidebar-section-title" style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '1.5rem', marginBottom: '0.5rem', padding: '0 1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Operação
                            </div>
                            <NavLink to="/operator/stock" onClick={onClose} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                                <Package size={20} /> Estoque
                            </NavLink>
                            <NavLink to="/operator/pipeline" onClick={onClose} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                                <Package size={20} /> Esteira Despacho
                            </NavLink>
                        </>
                    )}

                    {/* ── Módulo Entregador ── */}
                    {module === 'deliverer' && (
                        <>
                            <div className="sidebar-section-title" style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '1.5rem', marginBottom: '0.5rem', padding: '0 1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Minhas Entregas
                            </div>
                            <NavLink to="/deliverer/entregas" onClick={onClose} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                                <Truck size={20} /> Entregas Pendentes
                            </NavLink>
                        </>
                    )}
                </nav>
            </div>
        </>
    );
};

export const Layout = ({ module = 'gestao' }: { module?: ModuleType }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="layout-container">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} module={module} />
            <div className="main-content">
                <header className="header" style={{ borderTop: '4px solid var(--brand-primary)' }}>
                    <button className="mobile-menu-btn" onClick={() => setIsSidebarOpen(true)}>
                        <Menu size={24} />
                    </button>
                    
                    <div className="header-user" style={{ marginLeft: 'auto' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div className="user-info-text" style={{ textAlign: 'right' }}>
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
                        <div className="header-divider" style={{ width: '1px', height: '32px', background: 'var(--border-color)' }}></div>
                        <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontWeight: 500, transition: '0.2s opacity' }} onMouseOver={e => e.currentTarget.style.opacity = '0.7'} onMouseOut={e => e.currentTarget.style.opacity = '1'}>
                            <LogOut size={18} /> <span className="logout-text">Sair</span>
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
