import { useState, useEffect, useMemo } from 'react';
import api from '../../services/apiClient';
import { Plus, Search, CheckCircle, Truck, XCircle, AlertTriangle, Eye, X } from 'lucide-react';
import { getStatusLabel, PIPELINE_STATUS_ORDER, STATUS_COLORS } from '../../utils/orderStatus';

export const SupportDashboard = () => {
    const [orders, setOrders] = useState<any[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<any[] | null>(null);
    const [modalStatus, setModalStatus] = useState<string | null>(null);

    // Form states (kept from original)
    const [tenants, setTenants] = useState<any[]>([]);
    const [tenantId, setTenantId] = useState('');
    const [subscriberId, setSubscriberId] = useState('');
    const [eligibility, setEligibility] = useState<any>(null);
    const [customerName, setCustomerName] = useState('');
    const [customerAddress, setCustomerAddress] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [orderState, setOrderState] = useState<{ loading?: boolean, success?: boolean, msg?: string }>({});

    const loadQueue = () => {
        api.get('/api/orders').then(res => setOrders(res.data));
    };

    useEffect(() => {
        loadQueue();
        api.get('/api/tenants').then(res => setTenants(res.data));
        const interval = setInterval(loadQueue, 15000);
        return () => clearInterval(interval);
    }, []);

    // ── KPIs ──
    const kpis = useMemo(() => {
        const delivered = orders.filter(o => o.status === 'DELIVERY_CONFIRMED' || o.status === 'COMPLETED').length;
        const cancelled = orders.filter(o => o.status === 'CANCELLED').length;
        const support = orders.filter(o => o.status === 'SUPPORT_REQUIRED').length;
        const inProgress = orders.length - delivered - cancelled;
        return { delivered, cancelled, support, inProgress };
    }, [orders]);

    // ── Pipeline drilldown ──
    const pipelineData = useMemo(() => {
        const statusCounts: Record<string, number> = {};
        orders.forEach(o => {
            statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
        });

        const nonDelivered = orders.filter(o => o.status !== 'DELIVERY_CONFIRMED' && o.status !== 'COMPLETED' && o.status !== 'CANCELLED');
        const totalNonDelivered = nonDelivered.length;

        return PIPELINE_STATUS_ORDER.map(status => ({
            status,
            label: getStatusLabel(status),
            color: STATUS_COLORS[status] || '#6b7280',
            count: statusCounts[status] || 0,
            pct: totalNonDelivered > 0 ? ((statusCounts[status] || 0) / totalNonDelivered * 100) : 0,
        })).filter(row => row.count > 0);
    }, [orders]);

    // ── Search ──
    const handleSearch = () => {
        if (!searchTerm.trim()) { setSearchResults(null); return; }
        const term = searchTerm.toLowerCase();
        const results = orders.filter(o =>
            (o.customerName || '').toLowerCase().includes(term) ||
            (o.customerAddress || '').toLowerCase().includes(term) ||
            (o.subscriberId || '').toLowerCase().includes(term) ||
            (o.externalId || '').toLowerCase().includes(term) ||
            (o.customerPhone || '').toLowerCase().includes(term) ||
            (o.tenant?.name || '').toLowerCase().includes(term)
        );
        setSearchResults(results);
    };

    // ── Order creation (kept logic from original) ──
    const checkEligibility = async (e: any) => {
        e.preventDefault();
        setEligibility(null);
        setOrderState({});
        try {
            const res = await api.post('/api/auto-repair/eligibility', {
                subscriberId, tenantId, hcRegion: 'SP'
            });
            setEligibility(res.data);
        } catch (err) {
            console.error(err);
            setEligibility({ eligible: false, reason: "Erro ao consultar HC." });
        }
    };

    const createOrder = async (e: any) => {
        e.preventDefault();
        setOrderState({ loading: true });
        try {
            const payload = {
                tenantId, subscriberId, customerName, customerAddress, customerPhone,
                externalId: "OS-" + Math.floor(Math.random() * 100000),
                source: "PORTAL", hcRegion: 'SP'
            };
            const res = await api.post('/api/orders/create', payload);
            setOrderState({ success: true, msg: `Pedido criado com sucesso (ID: ${res.data.orderId})` });
            loadQueue();
            setTimeout(() => {
                setShowForm(false);
                setOrderState({});
                setEligibility(null);
                setSubscriberId('');
                setTenantId('');
            }, 2000);
        } catch (err: any) {
            setOrderState({ success: false, msg: err.response?.data?.reason || "Falha na criação do pedido" });
        }
    };

    const resetForm = () => {
        setShowForm(false);
        setEligibility(null);
        setSubscriberId('');
        setTenantId('');
        setCustomerName('');
        setCustomerAddress('');
        setCustomerPhone('');
        setOrderState({});
    };

    const formatDate = (d: string) => {
        if (!d) return '-';
        return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    // Orders filtered by a given status (for modal)
    const getOrdersByStatus = (status: string) => orders.filter(o => o.status === status);

    return (
        <div>
            {/* ── HEADER ── */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Gestão de Pedidos</h1>
                    <p className="page-subtitle">Painel de controle e acompanhamento de pedidos.</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn-secondary" onClick={() => { setShowSearch(!showSearch); setSearchResults(null); setSearchTerm(''); }}>
                        <Search size={18} /> Consultar OS
                    </button>
                    <button className="btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>
                        <Plus size={18} /> Criar Pedido
                    </button>
                </div>
            </div>

            {/* ── SEARCH PANEL ── */}
            {showSearch && (
                <div className="search-panel">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1rem' }}>Consultar Ordem de Serviço</h3>
                        <button onClick={() => { setShowSearch(false); setSearchResults(null); }} style={{ color: 'var(--text-secondary)', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                            <X size={18} />
                        </button>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'end' }}>
                        <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                            <label className="input-label">Buscar por Nome, Endereço, Subscriber ID, OS, Telefone ou Tenant</label>
                            <input
                                className="input-field"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                                placeholder="Digite qualquer informação do pedido..."
                            />
                        </div>
                        <button className="btn-primary" onClick={handleSearch} style={{ padding: '0.75rem 1.5rem' }}>
                            <Search size={18} /> Buscar
                        </button>
                    </div>

                    {searchResults !== null && (
                        <div style={{ marginTop: '1.5rem' }}>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                                {searchResults.length} resultado(s) encontrado(s)
                            </p>
                            {searchResults.length > 0 && (
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>OS</th>
                                            <th>Tenant</th>
                                            <th>Cliente</th>
                                            <th>Endereço</th>
                                            <th>Status</th>
                                            <th>Data</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {searchResults.map(o => (
                                            <tr key={o.id}>
                                                <td><strong>{o.externalId || '-'}</strong></td>
                                                <td>{o.tenant?.name || '-'}</td>
                                                <td>{o.customerName}</td>
                                                <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{o.customerAddress}</td>
                                                <td>
                                                    <span className="status-badge-pill" style={{ background: STATUS_COLORS[o.status] || '#6b7280' }}>
                                                        {getStatusLabel(o.status)}
                                                    </span>
                                                </td>
                                                <td style={{ fontSize: '0.8rem' }}>{formatDate(o.createdAt)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* ── CREATE ORDER FORM (kept from original) ── */}
            {showForm && (
                <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Abrir Novo Pedido</h2>
                        <button onClick={resetForm} style={{ color: 'var(--text-secondary)', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.5rem' }}>&times;</button>
                    </div>

                    <div style={{ background: 'var(--bg-primary)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-primary)' }}>Informe os Dados do HC</label>
                        <form onSubmit={checkEligibility} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '1rem', alignItems: 'end' }}>
                            <div className="input-group" style={{ marginBottom: 0 }}>
                                <label className="input-label">Tenant Origem</label>
                                <select className="input-field" value={tenantId} onChange={(e) => setTenantId(e.target.value)} required>
                                    <option value="">Selecione...</option>
                                    {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>
                            <div className="input-group" style={{ marginBottom: 0 }}>
                                <label className="input-label">Subscriber ID / HC</label>
                                <input className="input-field" value={subscriberId} onChange={e => setSubscriberId(e.target.value)} required placeholder="Ex: HC-12345" />
                            </div>
                            <button type="submit" className="btn-primary" style={{ padding: '0.75rem 1.5rem' }}>
                                <Search size={18} /> Consultar
                            </button>
                        </form>
                    </div>

                    {eligibility && (
                        <div style={{ marginTop: '2rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                                {eligibility.eligible ? (
                                    <><CheckCircle color="var(--success)" size={24} /> <h3 style={{ margin: 0, color: 'var(--success)' }}>Elegível para Abertura</h3></>
                                ) : (
                                    <><XCircle color="var(--danger)" size={24} /> <h3 style={{ margin: 0, color: 'var(--danger)' }}>Não Elegível</h3></>
                                )}
                            </div>

                            {!eligibility.eligible && (
                                <p style={{ color: 'var(--text-secondary)' }}><b>Motivo:</b> {eligibility.reason}</p>
                            )}

                            {eligibility.eligible && (
                                <form onSubmit={createOrder}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div className="input-group">
                                            <label className="input-label">Nome do Cliente</label>
                                            <input className="input-field" value={customerName} onChange={e => setCustomerName(e.target.value)} required />
                                        </div>
                                        <div className="input-group">
                                            <label className="input-label">Telefone de Contato</label>
                                            <input className="input-field" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} required />
                                        </div>
                                        <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                                            <label className="input-label">Endereço de Entrega</label>
                                            <input className="input-field" value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} required />
                                        </div>
                                    </div>
                                    <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'flex-end' }}>
                                        <button type="submit" className="btn-primary" disabled={orderState.loading}>
                                            {orderState.loading ? 'Enviando...' : 'Confirmar e Abrir Pedido'}
                                        </button>
                                        {orderState.msg && (
                                            <span style={{ color: orderState.success ? 'var(--success)' : 'var(--danger)', fontWeight: 500 }}>
                                                {orderState.msg}
                                            </span>
                                        )}
                                    </div>
                                </form>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* ── KPI SUMMARY CARDS ── */}
            <div className="summary-cards">
                <div className="summary-card">
                    <div className="summary-card-icon" style={{ background: '#ecfdf5' }}>
                        <CheckCircle size={26} color="#10b981" />
                    </div>
                    <div className="summary-card-info">
                        <span className="summary-card-value">{kpis.delivered.toLocaleString('pt-BR')}</span>
                        <span className="summary-card-label">Entregues</span>
                    </div>
                </div>
                <div className="summary-card">
                    <div className="summary-card-icon" style={{ background: '#eff6ff' }}>
                        <Truck size={26} color="#3b82f6" />
                    </div>
                    <div className="summary-card-info">
                        <span className="summary-card-value">{kpis.inProgress.toLocaleString('pt-BR')}</span>
                        <span className="summary-card-label">Em Andamento</span>
                    </div>
                </div>
                <div className="summary-card">
                    <div className="summary-card-icon" style={{ background: '#fef2f2' }}>
                        <XCircle size={26} color="#ef4444" />
                    </div>
                    <div className="summary-card-info">
                        <span className="summary-card-value">{kpis.cancelled.toLocaleString('pt-BR')}</span>
                        <span className="summary-card-label">Cancelados</span>
                    </div>
                </div>
                <div className="summary-card">
                    <div className="summary-card-icon" style={{ background: '#fffbeb' }}>
                        <AlertTriangle size={26} color="#f59e0b" />
                    </div>
                    <div className="summary-card-info">
                        <span className="summary-card-value">{kpis.support.toLocaleString('pt-BR')}</span>
                        <span className="summary-card-label">Suporte Necessário</span>
                    </div>
                </div>
            </div>

            {/* ── STATUS DRILLDOWN ── */}
            <div className="glass-panel">
                <div className="drilldown-header">
                    <div>
                        <h2 className="drilldown-title">Status dos Pedidos Não Entregues</h2>
                        <p className="drilldown-subtitle">Detalhamento por etapa do fluxo logístico</p>
                    </div>
                </div>

                {/* Column headers */}
                <div className="drilldown-row" style={{ background: 'var(--bg-accent)', fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-secondary)', padding: '0.6rem 1.5rem' }}>
                    <div style={{ textAlign: 'center' }}>#</div>
                    <div>Status</div>
                    <div style={{ textAlign: 'right' }}>Qtd.</div>
                    <div>Percentual</div>
                    <div style={{ textAlign: 'right' }}>%</div>
                    <div style={{ textAlign: 'center' }}>Ações</div>
                </div>

                {pipelineData.length === 0 && (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        Nenhum pedido em andamento no momento.
                    </div>
                )}

                {pipelineData.map((row, idx) => (
                    <div className="drilldown-row" key={row.status}>
                        <div className="drilldown-num">{idx + 1}</div>
                        <div>
                            <span className="status-badge-pill" style={{ background: row.color }}>
                                {row.label}
                            </span>
                        </div>
                        <div className="drilldown-qty">{row.count.toLocaleString('pt-BR')}</div>
                        <div className="bar-container">
                            <div className="bar-fill" style={{ width: `${row.pct}%`, background: row.color }} />
                        </div>
                        <div className="drilldown-pct">{row.pct.toFixed(2)}%</div>
                        <div className="drilldown-action">
                            <button onClick={() => setModalStatus(row.status)} title="Ver pedidos neste status">
                                <Eye size={14} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── STATUS DETAIL MODAL ── */}
            {modalStatus && (
                <div className="modal-overlay" onClick={() => setModalStatus(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <span className="status-badge-pill" style={{ background: STATUS_COLORS[modalStatus] || '#6b7280' }}>
                                    {getStatusLabel(modalStatus)}
                                </span>
                                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                    {getOrdersByStatus(modalStatus).length} pedido(s)
                                </span>
                            </div>
                            <button className="modal-close" onClick={() => setModalStatus(null)}>
                                <X size={22} />
                            </button>
                        </div>
                        <div style={{ padding: '0' }}>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>OS</th>
                                        <th>Tenant</th>
                                        <th>Cliente</th>
                                        <th>Endereço</th>
                                        <th>Subscriber ID</th>
                                        <th>Data de Abertura</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {getOrdersByStatus(modalStatus).map(o => (
                                        <tr key={o.id}>
                                            <td><strong>{o.externalId || '-'}</strong></td>
                                            <td>{o.tenant?.name || '-'}</td>
                                            <td>{o.customerName}</td>
                                            <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{o.customerAddress}</td>
                                            <td>{o.subscriberId}</td>
                                            <td style={{ fontSize: '0.8rem' }}>{formatDate(o.createdAt)}</td>
                                        </tr>
                                    ))}
                                    {getOrdersByStatus(modalStatus).length === 0 && (
                                        <tr>
                                            <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>Nenhum pedido encontrado.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
