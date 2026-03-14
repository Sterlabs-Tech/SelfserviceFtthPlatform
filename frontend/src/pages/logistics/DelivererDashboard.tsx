import { useState, useEffect } from 'react';
import api from '../../services/apiClient';
import { MapPin, CheckCircle, XCircle } from 'lucide-react';
import { getStatusLabel } from '../../utils/orderStatus';

export const DelivererDashboard = () => {
    const [orders, setOrders] = useState<any[]>([]);

    const loadQueue = () => {
        // For MVP, we load all orders due to mock
        api.get('/api/orders?limit=1000').then(res => {
            setOrders(res.data.data.filter((o: any) =>
                ['DISPATCHED_TO_DELIVERER', 'EN_ROUTE'].includes(o.status)
            ));
        });
    };

    useEffect(() => { loadQueue(); }, []);

    const updateStatus = async (orderId: string, status: string, reason?: string) => {
        await api.post('/api/logistics-portal/deliverer/update-status', {
            orderId, status, reason: reason || "Atualizado pelo App do Entregador"
        });
        loadQueue();
    };

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Rotas e Entregas (App Entregador)</h1>
                    <p className="page-subtitle">Confirme coleta, rota e entrega final de equipamentos.</p>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {orders.length === 0 ? (
                    <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>Não há rotas alocadas para você no momento.</div>
                ) : (
                    orders.map(o => (
                        <div key={o.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{o.customerName}</h3>
                                <p style={{ margin: '0.2rem 0', color: 'var(--text-secondary)' }}><MapPin size={14} /> {o.customerAddress}</p>
                                <p style={{ margin: 0, fontSize: '0.85rem' }}>Contato: {o.customerPhone} | OS: {o.externalId}</p>
                                <p style={{ margin: '0.5rem 0 0 0', fontWeight: 600, color: 'var(--brand-primary)' }}>
                                    Equipamento: {o.designatedOntModel} (SN: {o.designatedOntSerial})
                                </p>
                                <div style={{ marginTop: '0.5rem' }}>
                                    Status Atual: <span className="badge badge-warning">{getStatusLabel(o.status)}</span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {o.status === 'DISPATCHED_TO_DELIVERER' && (
                                    <button className="btn-primary" onClick={() => updateStatus(o.id, 'EN_ROUTE')}>
                                        Iniciar Rota
                                    </button>
                                )}
                                {o.status === 'EN_ROUTE' && (
                                    <>
                                        <button className="btn-primary" style={{ background: 'var(--success)' }} onClick={() => updateStatus(o.id, 'DELIVERY_CONFIRMED', 'Equipamento entregue em mãos.')}>
                                            <CheckCircle size={16} /> Confirmar Entrega
                                        </button>
                                        <button className="btn-secondary" style={{ color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.4)' }} onClick={() => updateStatus(o.id, 'DELIVERY_FAILED', 'Cliente Ausente')}>
                                            <XCircle size={16} /> Cliente Ausente
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
