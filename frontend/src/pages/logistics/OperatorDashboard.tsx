import { useState, useEffect } from 'react';
import api from '../../services/apiClient';
import { Package, Truck, CheckCircle, Thermometer, UserCog } from 'lucide-react';
import { getStatusLabel } from '../../utils/orderStatus';
import { calculateSLARemaining } from '../../utils/slaUtils';

export const OperatorDashboard = () => {
    const [orders, setOrders] = useState<any[]>([]);

    const loadQueue = () => {
        // For MVP, we load all orders due to mock
        api.get('/api/orders?limit=1000').then(res => {
            setOrders(res.data.data.filter((o: any) =>
                ['AWAITING_DISPATCH', 'EQUIPMENT_SEPARATED', 'AWAITING_PICKUP', 'DISPATCHED_TO_DELIVERER'].includes(o.status)
            ));
        });
    };

    useEffect(() => { loadQueue(); }, []);

    const handleBindOnt = async (orderId: string) => {
        const serial = prompt("Digite o SERIAL da ONT escolhida do estoque:");
        if (!serial) return;
        await api.post('/api/logistics-portal/operator/bind-ont', {
            orderId, designatedOntModel: "NOKIA-G1425G", designatedOntSerial: serial, nfeNumber: "NFE-9999"
        });
        loadQueue();
    };

    const handleDispatch = async (orderId: string, delivererId?: string) => {
        const id = delivererId || prompt("Digite o ID do Entregador:", "entregador-mock-1");
        if (!id) return;
        await api.post('/api/logistics-portal/operator/dispatch', {
            orderId, delivererId: id
        });
        loadQueue();
    };

    const handleReassign = async (orderId: string) => {
        const id = prompt("Digite o NOVO ID do Entregador:");
        if (!id) return;
        await api.post('/api/logistics-portal/reassign-deliverer', {
            orderId, delivererId: id
        });
        loadQueue();
    };

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Fila do Operador Logístico</h1>
                    <p className="page-subtitle">Separação de ONTs e Despacho para Transporte</p>
                </div>
            </div>

            <div className="glass-panel" style={{ padding: '1rem' }}>
                {orders.length === 0 ? (
                    <p style={{ textAlign: 'center', padding: '2rem' }}>Nenhum pedido pendente na fila.</p>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Ordem / SLA</th>
                                <th>Cliente / Endereço</th>
                                <th>Status</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map((o) => (
                                <tr key={o.id}>
                                    <td>
                                        <strong>{o.externalId}</strong>
                                        {o.slaTarget && (() => {
                                            const sla = calculateSLARemaining(o.slaTarget);
                                            if (!sla) return null;
                                            const colors = {
                                                normal: 'var(--success)',
                                                warning: '#f59e0b',
                                                critical: '#ef4444',
                                                expired: '#7f1d1d'
                                            };
                                            return (
                                                <div style={{
                                                    fontSize: '0.75rem',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.2rem',
                                                    marginTop: '0.4rem',
                                                    color: colors[sla.level],
                                                    fontWeight: 600
                                                }}>
                                                    <Thermometer size={14} />
                                                    {sla.isExpired ? 'SLA Vencido: ' : 'Restam: '}
                                                    {sla.label}
                                                </div>
                                            );
                                        })()}
                                    </td>
                                    <td>
                                        <strong>{o.customerName}</strong><br />
                                        <small style={{ color: 'var(--text-secondary)' }}>{o.customerAddress}</small>
                                    </td>
                                    <td>
                                        <span className="badge badge-warning">{getStatusLabel(o.status)}</span>
                                        {o.deliverer ? (
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
                                                Entregador: <strong>{o.deliverer.name}</strong>
                                            </div>
                                        ) : o.delivererId && (
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
                                                Entregador: {o.delivererId}
                                            </div>
                                        )}
                                        {o.designatedOntSerial && (
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
                                                Serial ONT: <strong>{o.designatedOntSerial}</strong>
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        {o.status === 'AWAITING_DISPATCH' && (
                                            <button className="btn-primary" onClick={() => handleBindOnt(o.id)}>
                                                <Package size={16} /> Separar ONT
                                            </button>
                                        )}
                                        {o.status === 'EQUIPMENT_SEPARATED' && (
                                            <button className="btn-primary" style={{ background: 'var(--success)' }} onClick={() => handleDispatch(o.id)}>
                                                <Truck size={16} /> Despachar (Entregador)
                                            </button>
                                        )}
                                        {(o.status === 'AWAITING_PICKUP' || o.status === 'DISPATCHED_TO_DELIVERER') && (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                {o.status === 'DISPATCHED_TO_DELIVERER' && (
                                                    <span className="badge badge-success" style={{ width: 'fit-content' }}>
                                                        <CheckCircle size={14} /> Despachado
                                                    </span>
                                                )}
                                                <button className="btn-secondary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }} onClick={() => handleReassign(o.id)}>
                                                    <UserCog size={14} /> Alterar Entregador
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};
