import { useState, useEffect } from 'react';
import api from '../../services/apiClient';
import { Package, Truck, CheckCircle, Thermometer, UserCog, X, User, ChevronRight } from 'lucide-react';
import { getStatusLabel } from '../../utils/orderStatus';
import { calculateSLARemaining } from '../../utils/slaUtils';
import { useAuth } from '../../contexts/AuthContext';

export const OperatorDashboard = () => {
    const { user } = useAuth();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [deliverers, setDeliverers] = useState<any[]>([]);
    const [isLoadingDeliverers, setIsLoadingDeliverers] = useState(false);
    const [showSelectionModal, setShowSelectionModal] = useState(false);
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

    const loadQueue = () => {
        setLoading(true);
        api.get('/api/orders?limit=1000').then(res => {
            const data = res.data?.data || [];
            const filtered = data.filter((o: any) =>
                ['AWAITING_DISPATCH', 'EQUIPMENT_SEPARATED', 'AWAITING_PICKUP', 'DISPATCHED_TO_DELIVERER'].includes(o.status)
            );
            // If user is a logistics operator, filter by their ID
            if (user?.profile === 'LOGISTICS_OPERATOR' && user.logisticsOperatorId) {
                setOrders(filtered.filter((o: any) => o.logisticsOperatorId === user.logisticsOperatorId));
            } else {
                setOrders(filtered);
            }
        })
        .catch(err => console.error('Erro ao carregar fila:', err))
        .finally(() => setLoading(false));
    };

    const loadDeliverers = async () => {
        if (!user?.logisticsOperatorId) return;
        setIsLoadingDeliverers(true);
        try {
            const res = await api.get(`/api/logistics/${user.logisticsOperatorId}/details`);
            const devs = res.data?.deliverers || [];
            setDeliverers(devs.filter((d: any) => d.active));
        } catch (err) {
            console.error('Erro ao carregar entregadores:', err);
        } finally {
            setIsLoadingDeliverers(false);
        }
    };

    useEffect(() => { 
        if (user?.logisticsOperatorId) {
            loadQueue(); 
            loadDeliverers();
        } else if (user) {
            // If admin or other, still load queue but maybe no deliverers needed here
            loadQueue();
        } else {
            setLoading(false);
        }
    }, [user?.logisticsOperatorId]);

    const handleBindOnt = async (orderId: string) => {
        const serial = prompt("Digite o SERIAL da ONT escolhida do estoque:");
        if (!serial) return;
        await api.post('/api/logistics-portal/operator/bind-ont', {
            orderId, designatedOntModel: "NOKIA-G1425G", designatedOntSerial: serial, nfeNumber: "NFE-9999"
        });
        loadQueue();
    };

    const handleDispatch = async (orderId: string, delivererId: string) => {
        try {
            await api.post('/api/logistics-portal/operator/dispatch', {
                orderId, delivererId
            });
            setShowSelectionModal(false);
            setSelectedOrderId(null);
            loadQueue();
        } catch (err) {
            console.error('Erro ao despachar pedido:', err);
            alert('Erro ao despachar o pedido. Verifique a conexão.');
        }
    };

    const handleReassign = async (orderId: string) => {
        const id = prompt("Digite o NOVO ID do Entregador:");
        if (!id) return;
        await api.post('/api/logistics-portal/reassign-deliverer', {
            orderId, delivererId: id
        });
        loadQueue();
    };

    if (loading) return (
        <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '80vh',
            gap: '1.5rem'
        }}>
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
            <p style={{ color: 'var(--text-secondary)', fontWeight: 500, fontSize: '1.1rem' }}>Sintonizando sua performance...</p>
        </div>
    );

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
                                            } as any;
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
                                            <button 
                                                className="btn-primary" 
                                                style={{ background: 'var(--success)' }} 
                                                onClick={() => {
                                                    setSelectedOrderId(o.id);
                                                    setShowSelectionModal(true);
                                                }}
                                            >
                                                <Truck size={16} /> Escolher Entregador
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

            {/* Selection Modal */}
            {showSelectionModal && (
                <div className="modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                    padding: '20px'
                }}>
                    <div className="card" style={{ width: '100%', maxWidth: '500px', padding: '2rem', animation: 'slideUp 0.3s ease' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Escolher Entregador</h2>
                            <button onClick={() => setShowSelectionModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                        </div>

                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                            Selecione um entregador ativo para realizar o despacho deste pedido.
                        </p>

                        <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'grid', gap: '0.75rem', paddingRight: '0.5rem' }}>
                            {isLoadingDeliverers ? (
                                <div style={{ textAlign: 'center', padding: '2rem' }}>Carregando entregadores...</div>
                            ) : deliverers.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>Nenhum entregador ativo disponível.</div>
                            ) : deliverers.map(d => (
                                <div 
                                    key={d.id}
                                    onClick={() => selectedOrderId && handleDispatch(selectedOrderId, d.id)}
                                    className="deliverer-item"
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '1rem',
                                        padding: '1rem', background: 'var(--bg-tertiary)',
                                        borderRadius: '12px', border: '1px solid var(--border-color)',
                                        cursor: 'pointer', transition: '0.2s all'
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.borderColor = 'var(--brand-primary)';
                                        e.currentTarget.style.background = 'rgba(245, 217, 25, 0.05)';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.borderColor = 'var(--border-color)';
                                        e.currentTarget.style.background = 'var(--bg-tertiary)';
                                    }}
                                >
                                    <div style={{ 
                                        width: '40px', height: '40px', borderRadius: '50%',
                                        background: 'var(--brand-primary)', color: '#000',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <User size={20} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600 }}>{d.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{d.vehicle || 'Moto'} • Ativo</div>
                                    </div>
                                    <ChevronRight size={18} color="var(--text-tertiary)" />
                                </div>
                            ))}
                        </div>

                        <button 
                            className="btn-secondary" 
                            style={{ width: '100%', marginTop: '1.5rem' }}
                            onClick={() => setShowSelectionModal(false)}
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
