import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/apiClient';
import { ArrowLeft, Users, Package, Clock, MapPin, TrendingUp, Edit, Trash2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';

import { ServiceAreaMap } from '../../components/ServiceAreaMap';

export const OperatorDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        const loadDetails = async () => {
            try {
                const res = await api.get(`/api/logistics/${id}/details`);
                setData(res.data);
            } catch (err) {
                console.error('Erro ao carregar detalhes:', err);
                alert('Erro ao carregar detalhes do operador.');
            } finally {
                setLoading(false);
            }
        };
        loadDetails();
    }, [id]);

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
            <p style={{ color: 'var(--text-secondary)', fontWeight: 500, fontSize: '1.1rem' }}>Sintonizando performance do operador...</p>
        </div>
    );

    if (!data) return <div style={{ padding: '2rem' }}>Operador não localizado.</div>;

    const op = data.operator;

    return (
        <div className="page-container">
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={() => navigate(-1)} className="btn-secondary" style={{ padding: '0.4rem', borderRadius: '8px', display: 'flex' }}>
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>{op.name}</h1>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                            <MapPin size={14} /> {op.city}, {op.state} • Operador Ativo
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button 
                        onClick={() => navigate(`/admin/logistics?edit=${id}`)} 
                        className="btn-primary"
                        style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
                    >
                        <Edit size={16} /> Editar
                    </button>
                    <button 
                        onClick={async () => {
                            if (window.confirm('Tem certeza que deseja excluir este operador?')) {
                                try {
                                    await api.delete(`/api/logistics/${id}`);
                                    navigate('/admin/logistics');
                                } catch (err: any) {
                                    alert('Erro ao excluir: ' + (err.response?.data?.error || err.message));
                                }
                            }
                        }} 
                        className="btn-danger"
                        style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
                    >
                        <Trash2 size={16} /> Excluir
                    </button>
                </div>
            </div>

            {/* Quick Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div className="card" style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <Users size={20} color="var(--brand-primary)" />
                        <span style={{ fontSize: '0.75rem', padding: '2px 8px', background: 'rgba(52, 211, 153, 0.1)', color: '#10b981', borderRadius: '20px' }}>Ativos</span>
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{data.deliverers.length}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Entregadores vinculados</div>
                </div>
                <div className="card" style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <Package size={20} color="#3b82f6" />
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{data.totalDeliveries}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total de ordens atendidas</div>
                </div>
                <div className="card" style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <Clock size={20} color="#f59e0b" />
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{op.slaHours}h</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>SLA Contratual médio</div>
                </div>
                <div className="card" style={{ padding: '1.25rem', background: 'var(--brand-primary)', color: 'white' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <TrendingUp size={20} />
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>98.2%</div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Taxa de sucesso acumulada</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>
                {/* Performance Visualizer */}
                <div className="card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.1rem' }}>Volume de Pedidos Por Mes</h3>
                    <div style={{ height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.performance} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
                                <Tooltip 
                                    contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '12px', boxShadow: '0 10px 15px rgba(0,0,0,0.3)' }}
                                    itemStyle={{ fontSize: '12px' }}
                                    cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                                />
                                <Bar dataKey="success" stackId="a" fill="#10b981" barSize={40} />
                                <Bar dataKey="risk" stackId="a" fill="#f59e0b" />
                                <Bar dataKey="delayed" stackId="a" fill="#ef4444" radius={[6, 6, 0, 0]}>
                                    {/* Total Label on top of the stack */}
                                    <LabelList 
                                        dataKey={(entry: any) => (entry.success || 0) + (entry.risk || 0) + (entry.delayed || 0)} 
                                        position="top" 
                                        style={{ fill: 'var(--text-primary)', fontSize: '12px', fontWeight: 600 }} 
                                        offset={10}
                                    />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', marginTop: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem' }}>
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981' }} /> No Prazo
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem' }}>
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }} /> Em Risco
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem' }}>
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }} /> Atrasado
                        </div>
                    </div>
                </div>

                {/* Map & Regions */}
                <div className="card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.1rem' }}>Regiões Atendidas</h3>
                    
                    <ServiceAreaMap state={op.state} regions={op.regions} />

                    <div style={{ marginTop: '1.5rem', maxHeight: '120px', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {op.regions ? op.regions.split(',').map((r: string) => (
                                <div key={r} style={{ 
                                    fontSize: '0.7rem', 
                                    padding: '4px 10px', 
                                    background: 'rgba(245, 158, 11, 0.05)', 
                                    color: '#f59e0b', 
                                    borderRadius: '6px',
                                    border: '1px solid rgba(245, 158, 11, 0.1)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                }}>
                                    <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#f59e0b' }} />
                                    {r.trim()}
                                </div>
                            )) : <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Nenhum município configurado</span>}
                        </div>
                    </div>
                </div>
            </div>

            {/* Deliverers Section */}
            <div className="card" style={{ marginTop: '1.5rem', padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Equipe de Logística</h3>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{data.deliverers.length} membros registrados</span>
                </div>
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Nome</th>
                                <th>Email</th>
                                <th>Perfil</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.deliverers.map((u: any) => (
                                <tr key={u.id}>
                                    <td style={{ fontWeight: 500 }}>{u.name}</td>
                                    <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                                    <td>
                                        <span style={{ fontSize: '0.75rem', padding: '2px 8px', background: 'var(--bg-tertiary)', borderRadius: '4px' }}>
                                            {u.profile}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: u.active ? '#10b981' : '#ef4444' }} />
                                            {u.active ? 'Em operação' : 'Inativo'}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {data.deliverers.length === 0 && (
                                <tr>
                                    <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                                        Nenhum entregador vinculado a este operador.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
