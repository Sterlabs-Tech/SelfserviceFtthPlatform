import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Eye, Search } from 'lucide-react';
import api from '../../services/apiClient';
import { getStatusLabel, STATUS_COLORS } from '../../utils/orderStatus';

export const StatusOrders = () => {
    const { status } = useParams();
    const navigate = useNavigate();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 50;

    useEffect(() => {
        loadData();
    }, [status]);

    const loadData = async () => {
        setLoading(true);
        try {
            // Fetch all orders and filter by status on frontend for simplicity 
            // (matching previous modal behavior which likely used the dashboard state)
            const res = await api.get('/api/orders?limit=1000');
            const filtered = res.data.data.filter((o: any) => o.status === status);
            setOrders(filtered);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const formatSLA = (slaTarget: string) => {
        if (!slaTarget) return { text: '-', color: 'var(--text-secondary)', emoji: '⚪' };
        const now = new Date();
        const target = new Date(slaTarget);
        const diff = target.getTime() - now.getTime();
        const isExpired = diff < 0;
        const absDiff = Math.abs(diff);
        const hours = Math.floor(absDiff / (1000 * 60 * 60));
        const mins = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60));
        const text = `${isExpired ? '-' : ''}${hours}h ${mins}m`;
        
        if (isExpired) return { text, color: '#ef4444', emoji: '🔥' };
        if (hours < 24) return { text, color: '#f59e0b', emoji: '⚠️' };
        return { text, color: '#10b981', emoji: '✅' };
    };

    const filteredOrders = orders.filter(o => 
        o.externalId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.subscriberId?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
    const paginatedOrders = filteredOrders.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const handleSearchChange = (val: string) => {
        setSearchTerm(val);
        setCurrentPage(1);
    };

    if (loading) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', gap: '1.5rem' }}>
            <svg width="80" height="80" viewBox="0 0 100 100" className="fidget-spinner">
                <circle cx="50" cy="50" r="10" fill="var(--text-primary)" />
                <g fill="var(--brand-primary)">
                    <circle cx="50" cy="20" r="15" />
                    <rect x="42" y="20" width="16" height="30" />
                    <circle cx="24" cy="65" r="15" />
                    <path d="M50 50 L24 65" stroke="var(--brand-primary)" strokeWidth="16" strokeLinecap="round" />
                    <circle cx="76" cy="65" r="15" />
                    <path d="M50 50 L76 65" stroke="var(--brand-primary)" strokeWidth="16" strokeLinecap="round" />
                </g>
                <circle cx="50" cy="20" r="5" fill="#333" />
                <circle cx="24" cy="65" r="5" fill="#333" />
                <circle cx="76" cy="65" r="5" fill="#333" />
            </svg>
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Carregando pedidos...</span>
        </div>
    );

    return (
        <div style={{ paddingBottom: '3rem' }}>
            <div className="page-header" style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button 
                        onClick={() => navigate('/admin/support')}
                        style={{ background: 'var(--bg-tertiary)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-primary)' }}
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <h1 className="page-title">Pedidos: {getStatusLabel(status || '')}</h1>
                            <span className="status-badge-pill" style={{ background: STATUS_COLORS[status || ''] || '#6b7280' }}>
                                {filteredOrders.length} pedido(s)
                            </span>
                        </div>
                        <div style={{ marginTop: '0.4rem', fontSize: '0.85rem', color: 'var(--brand-accent)', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 500 }}>
                            <Eye size={14} /> Clique em qualquer linha para ver detalhes
                        </div>
                    </div>
                </div>
            </div>

            <div className="glass-panel" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                    <input 
                        type="text" 
                        className="input-field" 
                        placeholder="Filtrar por OS, Cliente ou Subscriber ID..." 
                        style={{ paddingLeft: '2.5rem', marginBottom: 0 }}
                        value={searchTerm}
                        onChange={e => handleSearchChange(e.target.value)}
                    />
                </div>
            </div>

            <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>OS</th>
                            <th>SLA / Risco</th>
                            <th>Tenant</th>
                            <th>Cliente</th>
                            <th>Endereço</th>
                            <th>Operador</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedOrders.length > 0 ? (
                            paginatedOrders.map(o => (
                                <tr key={o.id} onClick={() => navigate(`/admin/orders/${o.id}`)} style={{ cursor: 'pointer' }}>
                                    <td><strong>{o.externalId || '-'}</strong></td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{ fontSize: '1.2rem' }}>{formatSLA(o.slaTarget).emoji}</span>
                                            <span style={{ fontWeight: 600, color: formatSLA(o.slaTarget).color, whiteSpace: 'nowrap' }}>
                                                {formatSLA(o.slaTarget).text}
                                            </span>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', background: '#fff', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                            {o.tenant?.logoUrl ? (
                                                <img src={o.tenant.logoUrl} alt={o.tenant.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                                            ) : (
                                                <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>{o.tenant?.name?.substring(0, 3)}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td>{o.customerName}</td>
                                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{o.customerAddress}</td>
                                    <td>{o.operator?.name || '-'}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                                    Nenhum pedido encontrado.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1.5rem', marginTop: '2rem' }}>
                    <button 
                        className="btn-secondary" 
                        disabled={currentPage === 1}
                        onClick={() => { setCurrentPage(prev => prev - 1); window.scrollTo(0, 0); }}
                        style={{ padding: '0.5rem 1.5rem' }}
                    >
                        Anterior
                    </button>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        Página {currentPage} de {totalPages}
                    </span>
                    <button 
                        className="btn-secondary" 
                        disabled={currentPage === totalPages}
                        onClick={() => { setCurrentPage(prev => prev + 1); window.scrollTo(0, 0); }}
                        style={{ padding: '0.5rem 1.5rem' }}
                    >
                        Próximo
                    </button>
                </div>
            )}
        </div>
    );
};
