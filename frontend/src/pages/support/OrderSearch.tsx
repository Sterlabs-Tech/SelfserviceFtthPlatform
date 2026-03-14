import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Eye } from 'lucide-react';
import api from '../../services/apiClient';
import { getStatusLabel, STATUS_COLORS } from '../../utils/orderStatus';

export const OrderSearch = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<any[] | null>(null);
    const [pagination, setPagination] = useState<any>(null);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);

    const handleSearch = async (targetPage = 1) => {
        if (!searchTerm.trim()) return;
        setLoading(true);
        setPage(targetPage);
        try {
            const res = await api.get(`/api/orders?q=${encodeURIComponent(searchTerm)}&page=${targetPage}&limit=20`);
            setResults(res.data.data);
            setPagination(res.data.pagination);
        } catch (err) {
            console.error('Erro na busca:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Consultar Pedido</h1>
                    <p className="page-subtitle">Busque por nome, endereço, subscriber ID ou código do pedido.</p>
                </div>
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <input
                        type="text"
                        placeholder="Digite o termo de busca..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSearch(1)}
                        style={{
                            flex: 1,
                            minWidth: '200px',
                            padding: '0.75rem 1rem',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-md)',
                            background: 'var(--bg-primary)',
                            color: 'var(--text-primary)',
                            fontSize: '0.9rem',
                        }}
                    />
                    <button className="btn-primary" onClick={() => handleSearch(1)} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Search size={16} /> {loading ? 'Buscando...' : 'Buscar'}
                    </button>
                    {results && (
                        <button className="btn-secondary" onClick={() => { setResults(null); setSearchTerm(''); setPagination(null); }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <X size={16} /> Limpar
                        </button>
                    )}
                </div>
            </div>

            {results !== null && (
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>
                                {pagination?.total || 0} resultado(s) encontrado(s)
                            </h3>
                            <span style={{ fontSize: '0.85rem', color: 'var(--brand-accent)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                <Eye size={16} /> Clique para ver detalhes
                            </span>
                        </div>
                        
                        {pagination && pagination.pages > 1 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <button 
                                    className="btn-secondary" 
                                    disabled={loading || page <= 1} 
                                    onClick={() => handleSearch(page - 1)}
                                    style={{ padding: '4px 12px', fontSize: '0.8rem' }}
                                >
                                    Anterior
                                </button>
                                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                    Página <strong>{page}</strong> de {pagination.pages}
                                </span>
                                <button 
                                    className="btn-secondary" 
                                    disabled={loading || page >= pagination.pages} 
                                    onClick={() => handleSearch(page + 1)}
                                    style={{ padding: '4px 12px', fontSize: '0.8rem' }}
                                >
                                    Próxima
                                </button>
                            </div>
                        )}
                    </div>
                    {results.length === 0 ? (
                        <p style={{ color: 'var(--text-secondary)' }}>Nenhum pedido encontrado para "{searchTerm}".</p>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr>
                                        <th style={{ textAlign: 'left', padding: '0.75rem', borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Cliente</th>
                                        <th style={{ textAlign: 'left', padding: '0.75rem', borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Subscriber ID</th>
                                        <th style={{ textAlign: 'left', padding: '0.75rem', borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Status</th>
                                        <th style={{ textAlign: 'left', padding: '0.75rem', borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Endereço</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {results.map((order: any) => (
                                        <tr key={order.id} onClick={() => navigate(`/admin/orders/${order.id}`)} style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer' }}>
                                            <td style={{ padding: '0.75rem', color: 'var(--text-primary)' }}>{order.customerName}</td>
                                            <td style={{ padding: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{order.subscriberId}</td>
                                            <td style={{ padding: '0.75rem' }}>
                                                <span className="status-badge-pill" style={{ 
                                                    background: STATUS_COLORS[order.status] || 'var(--brand-primary)', 
                                                    color: (order.status === 'AWAITING_PICKUP') ? '#000' : '#fff',
                                                    padding: '4px 10px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 600,
                                                    borderRadius: 'var(--radius-full)',
                                                    display: 'inline-block',
                                                    whiteSpace: 'nowrap'
                                                }}>
                                                    {getStatusLabel(order.status)}
                                                </span>
                                            </td>
                                            <td style={{ padding: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: '350px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {`${order.customerAddress}${order.customerNeighborhood ? `, ${order.customerNeighborhood}` : ''}${order.customerCity ? ` - ${order.customerCity}` : ''}${order.customerState ? `/${order.customerState}` : ''}`}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
