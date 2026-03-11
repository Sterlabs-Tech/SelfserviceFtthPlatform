import { useState, useEffect } from 'react';
import axios from 'axios';
import { Package, Truck, CheckCircle } from 'lucide-react';
import { getStatusLabel } from '../../utils/orderStatus';

export const OperatorDashboard = () => {
    const [orders, setOrders] = useState<any[]>([]);

    const loadQueue = () => {
        // For MVP, we load all orders due to mock
        axios.get('http://localhost:3001/api/orders').then(res => {
            setOrders(res.data.filter((o: any) =>
                ['AWAITING_DISPATCH', 'EQUIPMENT_SEPARATED', 'AWAITING_PICKUP', 'DISPATCHED_TO_DELIVERER'].includes(o.status)
            ));
        });
    };

    useEffect(() => { loadQueue(); }, []);

    const handleBindOnt = async (orderId: string) => {
        const serial = prompt("Digite o SERIAL da ONT escolhida do estoque:");
        if (!serial) return;
        await axios.post('http://localhost:3001/api/logistics-portal/operator/bind-ont', {
            orderId, designatedOntModel: "NOKIA-G1425G", designatedOntSerial: serial, nfeNumber: "NFE-9999"
        });
        loadQueue();
    };

    const handleDispatch = async (orderId: string) => {
        await axios.post('http://localhost:3001/api/logistics-portal/operator/dispatch', {
            orderId, delivererId: "entregador-mock-1"
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
                                <th>Ordem</th>
                                <th>Cliente / Endereço</th>
                                <th>Status</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map((o) => (
                                <tr key={o.id}>
                                    <td>{o.externalId}</td>
                                    <td>
                                        <strong>{o.customerName}</strong><br />
                                        <small style={{ color: 'var(--text-secondary)' }}>{o.customerAddress}</small>
                                    </td>
                                    <td>
                                        <span className="badge badge-warning">{getStatusLabel(o.status)}</span>
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
                                        {o.status === 'DISPATCHED_TO_DELIVERER' && (
                                            <span className="badge badge-success"><CheckCircle size={14} /> Despachado</span>
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
