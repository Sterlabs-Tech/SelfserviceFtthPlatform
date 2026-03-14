import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/apiClient';
import { Search, CheckCircle, Truck, XCircle, AlertTriangle, Eye, X, ShieldCheck, Flame } from 'lucide-react';
import { getStatusLabel, PIPELINE_STATUS_ORDER, STATUS_COLORS } from '../../utils/orderStatus';

export const SupportDashboard = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState<any[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<any[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);

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
        setIsLoading(true);
        api.get('/api/orders?limit=1000')
            .then(res => setOrders(res.data.data))
            .finally(() => setIsLoading(false));
    };

    useEffect(() => {
        loadQueue();
        api.get('/api/tenants').then(res => setTenants(res.data));
        const interval = setInterval(loadQueue, 15000);
        return () => clearInterval(interval);
    }, []);

    // ── KPIs (SLA based) ──
    const kpis = useMemo(() => {
        const now = new Date();
        const TWO_HOURS = 2 * 60 * 60 * 1000;

        // In-progress = all non-COMPLETED, non-CANCELLED
        const inProgressOrders = orders.filter(o => o.status !== 'COMPLETED' && o.status !== 'CANCELLED');
        const inProgress = inProgressOrders.length;

        let noPrazo = 0;
        let risco = 0;
        let vencido = 0;

        inProgressOrders.forEach(o => {
            if (!o.slaTarget) {
                noPrazo++; // No SLA target = assume on time
                return;
            }
            const target = new Date(o.slaTarget);
            const diffMs = target.getTime() - now.getTime();
            if (diffMs < 0) {
                vencido++;
            } else if (diffMs < TWO_HOURS) {
                risco++;
            } else {
                noPrazo++;
            }
        });

        return { inProgress, noPrazo, risco, vencido };
    }, [orders]);

    // ── Operator SLA breakdown ──
    const operatorSla = useMemo(() => {
        const now = new Date();
        const TWO_HOURS = 2 * 60 * 60 * 1000;
        const inProgressOrders = orders.filter(o => o.status !== 'COMPLETED' && o.status !== 'CANCELLED');

        const opMap: Record<string, { name: string, total: number, noPrazo: number, risco: number, vencido: number }> = {};

        inProgressOrders.forEach(o => {
            const opName = o.operator?.name || 'Sem Operador';
            const opId = o.logisticsOperatorId || 'none';
            if (!opMap[opId]) {
                opMap[opId] = { name: opName, total: 0, noPrazo: 0, risco: 0, vencido: 0 };
            }
            opMap[opId].total++;

            if (!o.slaTarget) {
                opMap[opId].noPrazo++;
                return;
            }
            const diffMs = new Date(o.slaTarget).getTime() - now.getTime();
            if (diffMs < 0) {
                opMap[opId].vencido++;
            } else if (diffMs < TWO_HOURS) {
                opMap[opId].risco++;
            } else {
                opMap[opId].noPrazo++;
            }
        });

        return Object.values(opMap).sort((a, b) => b.total - a.total);
    }, [orders]);

    // ── Pipeline drilldown ──
    const pipelineData = useMemo(() => {
        const statusCounts: Record<string, number> = {};
        orders.forEach(o => {
            // Map OPEN to AWAITING_DISPATCH as per "First status is Separar materiais"
            let s = o.status;
            if (s === 'OPEN') s = 'AWAITING_DISPATCH';
            
            statusCounts[s] = (statusCounts[s] || 0) + 1;
        });

        const totalOrders = orders.filter(o => o.status !== 'COMPLETED' && o.status !== 'CANCELLED').length;

        return PIPELINE_STATUS_ORDER.map(status => ({
            status,
            label: getStatusLabel(status),
            color: STATUS_COLORS[status] || '#6b7280',
            count: statusCounts[status] || 0,
            pct: totalOrders > 0 ? ((statusCounts[status] || 0) / totalOrders * 100) : 0,
        }));
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


    return (
        <div>
            {/* ── HEADER ── */}
            <div className="page-header" style={{ position: 'relative' }}>
                <div>
                    <h1 className="page-title">Pedidos em Andamento</h1>
                    <p className="page-subtitle">Painel de controle e acompanhamento de pedidos.</p>
                    <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--brand-accent)', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 500 }}>
                        <Eye size={14} /> Clique em qualquer linha da tabela de status para ver o detalhamento dos pedidos.
                    </div>
                </div>
                {isLoading && (
                    <div style={{ position: 'absolute', top: '10px', right: '0' }}>
                        <svg width="40" height="40" viewBox="0 0 100 100" className="fidget-spinner">
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
                    </div>
                )}
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
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                                    {searchResults.length} resultado(s) encontrado(s)
                                </p>
                                <span style={{ fontSize: '0.8rem', color: 'var(--brand-accent)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                    <Eye size={14} /> Clique em qualquer linha para ver detalhes
                                </span>
                            </div>
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
                                            <tr key={o.id} onClick={() => navigate(`/admin/orders/${o.id}`)} style={{ cursor: 'pointer' }}>
                                                <td><strong>{o.externalId || '-'}</strong></td>
                                                <td>{o.tenant?.name || '-'}</td>
                                                <td>{o.customerName}</td>
                                                <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{o.customerAddress}</td>
                                                <td>
                                                    <span className="status-badge-pill" style={{ background: STATUS_COLORS[o.status] || '#6b7280' }}>
                                                        {getStatusLabel(o.status)}
                                                    </span>
                                                </td>
                                                <td style={{ fontSize: '0.8rem' }}>{new Date(o.createdAt).toLocaleString('pt-BR')}</td>
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

            {/* ── KPI SUMMARY CARDS (SLA-based) ── */}
            <div className="summary-cards">
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
                    <div className="summary-card-icon" style={{ background: '#ecfdf5' }}>
                        <ShieldCheck size={26} color="#10b981" />
                    </div>
                    <div className="summary-card-info">
                        <span className="summary-card-value">{kpis.noPrazo.toLocaleString('pt-BR')}</span>
                        <span className="summary-card-label">No Prazo</span>
                    </div>
                </div>
                <div className="summary-card">
                    <div className="summary-card-icon" style={{ background: '#fffbeb' }}>
                        <AlertTriangle size={26} color="#f59e0b" />
                    </div>
                    <div className="summary-card-info">
                        <span className="summary-card-value">{kpis.risco.toLocaleString('pt-BR')}</span>
                        <span className="summary-card-label">Risco</span>
                    </div>
                </div>
                <div className="summary-card">
                    <div className="summary-card-icon" style={{ background: '#fef2f2' }}>
                        <Flame size={26} color="#ef4444" />
                    </div>
                    <div className="summary-card-info">
                        <span className="summary-card-value">{kpis.vencido.toLocaleString('pt-BR')}</span>
                        <span className="summary-card-label">Vencido</span>
                    </div>
                </div>
            </div>

            {/* ── STATUS DRILLDOWN ── */}
            <div className="glass-panel">
                <div className="drilldown-header">
                    <div>
                        <h2 className="drilldown-title">Status dos Pedidos</h2>
                        <p className="drilldown-subtitle">Detalhamento por etapa do fluxo</p>
                    </div>
                </div>

                {/* Column headers */}
                <div className="drilldown-row" style={{ background: 'var(--bg-accent)', fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-secondary)', padding: '0.6rem 1.5rem' }}>
                    <div style={{ textAlign: 'center' }}>#</div>
                    <div>Status</div>
                    <div style={{ textAlign: 'right' }}>Qtd.</div>
                    <div>Percentual</div>
                    <div style={{ textAlign: 'right' }}>%</div>
                </div>

                {pipelineData.length === 0 && (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        Nenhum pedido em andamento no momento.
                    </div>
                )}

                {pipelineData.map((row, idx) => (
                    <div 
                        className="drilldown-row" 
                        key={row.status} 
                        onClick={() => navigate(`/admin/orders/status/${row.status}`)}
                        style={{ cursor: 'pointer' }}
                    >
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
                    </div>
                ))}
            </div>

            {/* ── OPERATOR SLA BREAKDOWN ── */}
            <div className="glass-panel" style={{ marginTop: '1.5rem' }}>
                <div className="drilldown-header">
                    <div>
                        <h2 className="drilldown-title">Desempenho por Operador Logístico</h2>
                        <p className="drilldown-subtitle">SLA dos pedidos em andamento por operador</p>
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'var(--bg-accent)', fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' as const }}>
                                <th style={{ textAlign: 'left', padding: '0.75rem 1.5rem', fontWeight: 600 }}>Operador</th>
                                <th style={{ textAlign: 'center', padding: '0.75rem', fontWeight: 600 }}>Total</th>
                                <th style={{ textAlign: 'center', padding: '0.75rem', fontWeight: 600 }}>🛡️ No Prazo</th>
                                <th style={{ textAlign: 'center', padding: '0.75rem', fontWeight: 600 }}>⚠️ Risco</th>
                                <th style={{ textAlign: 'center', padding: '0.75rem', fontWeight: 600 }}>🔥 Vencido</th>
                                <th style={{ textAlign: 'center', padding: '0.75rem', fontWeight: 600 }}>Saúde</th>
                            </tr>
                        </thead>
                        <tbody>
                            {operatorSla.map((op, idx) => {
                                const pctNoPrazo = op.total > 0 ? (op.noPrazo / op.total * 100) : 0;
                                const pctRisco = op.total > 0 ? (op.risco / op.total * 100) : 0;
                                const pctVencido = op.total > 0 ? (op.vencido / op.total * 100) : 0;
                                return (
                                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <td style={{ padding: '0.85rem 1.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>{op.name}</td>
                                        <td style={{ textAlign: 'center', padding: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>{op.total}</td>
                                        <td style={{ textAlign: 'center', padding: '0.85rem' }}>
                                            <span style={{ fontWeight: 600, color: '#10b981' }}>{op.noPrazo}</span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: '0.25rem' }}>({pctNoPrazo.toFixed(0)}%)</span>
                                        </td>
                                        <td style={{ textAlign: 'center', padding: '0.85rem' }}>
                                            <span style={{ fontWeight: 600, color: '#f59e0b' }}>{op.risco}</span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: '0.25rem' }}>({pctRisco.toFixed(0)}%)</span>
                                        </td>
                                        <td style={{ textAlign: 'center', padding: '0.85rem' }}>
                                            <span style={{ fontWeight: 600, color: '#ef4444' }}>{op.vencido}</span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: '0.25rem' }}>({pctVencido.toFixed(0)}%)</span>
                                        </td>
                                        <td style={{ textAlign: 'center', padding: '0.85rem', width: '200px' }}>
                                            <div style={{ display: 'flex', height: '10px', borderRadius: '5px', overflow: 'hidden', background: 'var(--bg-tertiary)' }}>
                                                <div style={{ width: `${pctNoPrazo}%`, background: '#10b981', transition: 'width 0.3s' }} />
                                                <div style={{ width: `${pctRisco}%`, background: '#f59e0b', transition: 'width 0.3s' }} />
                                                <div style={{ width: `${pctVencido}%`, background: '#ef4444', transition: 'width 0.3s' }} />
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {operatorSla.length === 0 && (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        Nenhum operador com pedidos em andamento.
                    </div>
                )}
            </div>
        </div>
    );
};
