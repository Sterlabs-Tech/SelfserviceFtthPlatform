import { useState, useEffect } from 'react';
import api from '../../services/apiClient';
import { Activity, Clock, Plus, Search, CheckCircle, XCircle } from 'lucide-react';
import { getStatusLabel } from '../../utils/orderStatus';

export const SupportDashboard = () => {
    const [orders, setOrders] = useState<any[]>([]);
    const [showForm, setShowForm] = useState(false);

    // Form states
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
        const interval = setInterval(loadQueue, 5000);
        return () => clearInterval(interval);
    }, []);

    const checkEligibility = async (e: any) => {
        e.preventDefault();
        setEligibility(null);
        setOrderState({});
        try {
            const res = await api.post('/api/auto-repair/eligibility', {
                subscriberId, tenantId, hcRegion: 'SP' // Padrão
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

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Gestão de Pedidos</h1>
                    <p className="page-subtitle">Acompanhe e gerencie pedidos de clientes.</p>
                </div>
                {!showForm && (
                    <button className="btn-primary" onClick={() => setShowForm(true)}>
                        <Plus size={18} /> Criar Pedido
                    </button>
                )}
            </div>

            {showForm && (
                <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Abrir Novo Pedido</h2>
                        <button onClick={() => { setShowForm(false); setEligibility(null); }} style={{ color: 'var(--text-secondary)', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.5rem' }}>&times;</button>
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

            <div className="glass-panel" style={{ padding: '1rem' }}>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>OS / Tenant</th>
                            <th>Cliente</th>
                            <th>Equipamento (SN)</th>
                            <th>Status Geral</th>
                            <th>Progresso (Logística)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map((o) => (
                            <tr key={o.id}>
                                <td>
                                    <strong>{o.externalId}</strong><br />
                                    <small style={{ color: 'var(--text-secondary)' }}>{o.tenant?.name}</small>
                                </td>
                                <td>{o.customerName}</td>
                                <td>{o.designatedOntSerial || 'Pendente'}</td>
                                <td>
                                    <span className={`badge ${o.status === 'DELIVERY_CONFIRMED' ? 'badge-success' : 'badge-warning'}`}>
                                        {getStatusLabel(o.status)}
                                    </span>
                                </td>
                                <td>
                                    {o.status === 'DELIVERY_CONFIRMED' ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)' }}>
                                            <Activity size={16} /> Ativação Liberada
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                                            <Clock size={16} /> Aguardando Entrega...
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {orders.length === 0 && (
                            <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>Nenhum pedido encontrado.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
