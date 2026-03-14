import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    ChevronLeft, 
    User, 
    MapPin, 
    Phone, 
    Clock, 
    Shield, 
    History,
    Truck,
    AlertCircle,
    Info
} from 'lucide-react';
import api from '../../services/apiClient';
import { getStatusLabel, STATUS_COLORS } from '../../utils/orderStatus';

export const OrderDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [mapUrl, setMapUrl] = useState('');

    useEffect(() => {
        api.get(`/api/orders/${id}`)
            .then(res => {
                setOrder(res.data);
                // Simple Geocoding using Nominatim
                const fullAddress = `${res.data.customerAddress}, ${res.data.customerNeighborhood || ''}, ${res.data.customerCity || ''}, ${res.data.customerState || ''}`;
                const encodedAddress = encodeURIComponent(fullAddress);
                
                fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`)
                    .then(response => response.json())
                    .then(data => {
                        if (data && data.length > 0) {
                            const lat = parseFloat(data[0].lat);
                            const lon = parseFloat(data[0].lon);
                            const delta = 0.0005; // Zoom Level
                            const bbox = `${lon - delta}%2C${lat - delta}%2C${lon + delta}%2C${lat + delta}`;
                            setMapUrl(`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lon}`);
                        } else {
                            // Default to SP if not found
                            setMapUrl(`https://www.openstreetmap.org/export/embed.html?bbox=-46.6805%2C-23.5605%2C-46.6795%2C-23.5595&layer=mapnik&marker=-23.56%2C-46.68`);
                        }
                    })
                    .catch(() => {
                        setMapUrl(`https://www.openstreetmap.org/export/embed.html?bbox=-46.6805%2C-23.5605%2C-46.6795%2C-23.5595&layer=mapnik&marker=-23.56%2C-46.68`);
                    });
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [id]);

    const formatDateTime = (dateStr: string) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleString('pt-BR');
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
            <div style={{ textAlign: 'center' }}>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '1.1rem', display: 'block' }}>Consultando OS...</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Buscando detalhes do pedido</span>
            </div>
        </div>
    );
    if (!order) return <div style={{ padding: '2rem' }}>Ordem não encontrada.</div>;

    const fullAddressLabel = `${order.customerAddress}${order.customerNeighborhood ? `, ${order.customerNeighborhood}` : ''}${order.customerCity ? ` - ${order.customerCity}` : ''}${order.customerState ? `/${order.customerState}` : ''}${order.customerZip ? ` - CEP: ${order.customerZip}` : ''}`;
    
    // Statuses that represent the end of the workflow
    const CLOSED_STATUSES = ['CANCELLED', 'COMPLETED'];
    
    // Statuses where the material is already in possession of the customer or logic prevents reassignment
    const POSSESSION_STATUSES = [
        'DELIVERY_CONFIRMED', 
        'ONT_ACTIVATION_STARTED', 
        'ONT_ASSOCIATION_FAILED', 
        'COMPLETED', 
        'SUPPORT_REQUIRED'
    ];

    return (
        <div style={{ paddingBottom: '3rem' }}>
            <div className="page-header" style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button 
                        onClick={() => navigate(-1)}
                        style={{ background: 'var(--bg-tertiary)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-primary)' }}
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <h1 className="page-title">{order.externalId || 'Ordem de Serviço'}</h1>
                            <span className="status-badge-pill" style={{ background: STATUS_COLORS[order.status] || '#6b7280' }}>
                                {getStatusLabel(order.status)}
                            </span>
                        </div>
                        <p className="page-subtitle">Detalhes completos e histórico da ordem</p>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="glass-panel" style={{ padding: '0', overflow: 'hidden', position: 'relative', minHeight: '300px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 450px', height: '100%', minHeight: '300px' }}>
                            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--bg-secondary)', zIndex: 2 }}>
                                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                                    <User size={18} color="var(--brand-primary)" /> Dados do Cliente
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div className="info-group">
                                        <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.1rem' }}>Subscriber ID</label>
                                        <div style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--text-primary)' }}>{order.subscriberId}</div>
                                    </div>
                                    <div className="info-group">
                                        <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.1rem' }}>Nome Completo</label>
                                        <div style={{ fontWeight: 600 }}>{order.customerName}</div>
                                    </div>
                                    <div className="info-group">
                                        <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.1rem' }}>Endereço de Instalação</label>
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                                            <MapPin size={16} style={{ marginTop: '3px', color: 'var(--text-secondary)' }} />
                                            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{fullAddressLabel}</div>
                                        </div>
                                    </div>
                                    <div className="info-group">
                                        <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.1rem' }}>Telefone de Contato</label>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Phone size={16} color="var(--text-secondary)" />
                                            <div style={{ fontWeight: 600 }}>{order.customerPhone}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div style={{ 
                                height: '100%', 
                                width: '100%',
                                borderLeft: '1px solid var(--border-color)',
                                position: 'relative'
                            }}>
                                <iframe 
                                    width="100%" 
                                    height="100%" 
                                    frameBorder="0" 
                                    src={mapUrl}
                                    style={{ border: 'none' }}
                                    title="Localização do Cliente"
                                ></iframe>
                            </div>
                        </div>
                    </div>

                    {/* Technical Info Card */}
                    <div className="glass-panel" style={{ padding: '1.5rem' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                            <Info size={18} color="var(--brand-primary)" /> Informações Técnicas
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div className="info-group">
                                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Tipo de Serviço</label>
                                <div style={{ fontWeight: 600 }}>Auto Troca de ONT</div>
                            </div>
                            <div className="info-group">
                                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Data de Abertura</label>
                                <div style={{ fontWeight: 600 }}>{formatDateTime(order.createdAt)}</div>
                            </div>
                            <div className="info-group">
                                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Canal de Origem</label>
                                <div style={{ fontWeight: 600 }}>{order.source}</div>
                            </div>
                            <div className="info-group">
                                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>SLA Acordado (Target)</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Clock size={16} color="#ef4444" />
                                    <div style={{ fontWeight: 600, color: '#ef4444' }}>{formatDateTime(order.slaTarget)}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Event History Timeline */}
                    <div className="glass-panel" style={{ padding: '1.5rem' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                            <History size={18} color="var(--brand-primary)" /> Trilha de Auditoria (Histórico)
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
                            {order.history && order.history.map((evt: any, idx: number) => {
                                // Since history is descending, the "End Time" of this event is the "Start Time" 
                                // of the previous event in the array (the one that came AFTER it in time).
                                const startTime = evt.timestamp;
                                const endTime = idx === 0 ? null : order.history[idx - 1].timestamp;
                                const statusKey = evt.newStatus || evt.eventType;
                                const statusLabel = getStatusLabel(statusKey);
                                const statusColor = STATUS_COLORS[statusKey] || 'var(--brand-primary)';

                                return (
                                    <div key={evt.id} style={{ display: 'flex', gap: '1.5rem', position: 'relative' }}>
                                        {/* Timeline Line */}
                                        {idx !== order.history.length - 1 && (
                                            <div style={{ 
                                                position: 'absolute', 
                                                left: '11px', 
                                                top: '24px', 
                                                bottom: '-24px', 
                                                width: '2px', 
                                                background: 'var(--border-color)',
                                                opacity: 0.5
                                            }} />
                                        )}
                                        {/* Status Dot */}
                                        <div style={{ 
                                            width: '24px', 
                                            height: '24px', 
                                            borderRadius: '50%', 
                                            background: statusColor, 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center',
                                            zIndex: 1,
                                            marginTop: '4px',
                                            boxShadow: idx === 0 ? `0 0 0 4px ${statusColor}33` : 'none'
                                        }}>
                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fff' }} />
                                        </div>
                                        {/* Event Details */}
                                        <div style={{ paddingBottom: '2.5rem', flex: 1 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                                <div>
                                                    <div style={{ 
                                                        fontWeight: 700, 
                                                        color: 'var(--text-primary)', 
                                                        fontSize: '1rem',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.5rem'
                                                    }}>
                                                        {statusLabel}
                                                        {idx === 0 && (
                                                            <span style={{ 
                                                                fontSize: '0.65rem', 
                                                                background: `${statusColor}22`, 
                                                                color: statusColor, 
                                                                padding: '2px 8px', 
                                                                borderRadius: '10px',
                                                                border: `1px solid ${statusColor}44`,
                                                                textTransform: 'uppercase'
                                                            }}>
                                                                Atual
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                                                        Responsável: <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{evt.responsibleName}</span>
                                                    </div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                        <span style={{ opacity: 0.7 }}>Início:</span> <span style={{ fontWeight: 600 }}>{formatDateTime(startTime)}</span>
                                                    </div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                                        <span style={{ opacity: 0.7 }}>Fim:</span> <span style={{ fontWeight: 600, color: !endTime ? 'var(--brand-primary)' : 'inherit' }}>
                                                            {endTime ? formatDateTime(endTime) : 'Em Andamento'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {evt.reason && (
                                                <div style={{ 
                                                    background: 'var(--bg-tertiary)', 
                                                    padding: '0.75rem', 
                                                    borderRadius: 'var(--radius-md)', 
                                                    fontSize: '0.85rem', 
                                                    borderLeft: `3px solid ${statusColor}`,
                                                    marginTop: '0.5rem',
                                                    color: 'var(--text-secondary)'
                                                }}>
                                                    {evt.reason}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* Partners Card */}
                    <div className="glass-panel" style={{ padding: '1.5rem' }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '1.25rem', color: 'var(--text-primary)' }}>Parceiros Envolvidos</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', background: '#fff', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                    {order.tenant?.logoUrl ? (
                                        <img src={order.tenant.logoUrl} alt={order.tenant.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                                    ) : (
                                        <Shield size={24} color="var(--brand-primary)" />
                                    )}
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Tenant</div>
                                    <div style={{ fontWeight: 600 }}>{order.tenant?.name}</div>
                                </div>
                            </div>

                            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Truck size={24} color="var(--text-secondary)" />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Operador Logístico</div>
                                        <div style={{ fontWeight: 600 }}>{order.operator?.name || '-'}</div>
                                    </div>
                                </div>
                            </div>

                            {order.deliverer && (
                                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <User size={24} color="var(--text-secondary)" />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Entregador</div>
                                            <div style={{ fontWeight: 600 }}>{order.deliverer.name}</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Action Card - Only visible for open orders */}
                    {!CLOSED_STATUSES.includes(order.status) && (
                        <div className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                            <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <AlertCircle size={18} /> Ações de Suporte
                            </h3>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                                Estas ações afetam o workflow da ordem e devem ser usadas com cautela.
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <button className="btn-secondary" style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.2)', width: '100%', justifyContent: 'center' }}>
                                    Cancelar Ordem
                                </button>
                                
                                {/* Only allow reassignment if material is not with customer yet */}
                                {!POSSESSION_STATUSES.includes(order.status) && (
                                    <button className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
                                        Reatribuir Operador
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
