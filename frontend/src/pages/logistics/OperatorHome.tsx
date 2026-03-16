import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/apiClient';
import { Users, Clock, MapPin, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import { formatNumber } from '../../utils/formatters';
import { useAuth } from '../../contexts/AuthContext';
import { ServiceAreaMap } from '../../components/ServiceAreaMap';

export const OperatorHome = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);

    const loadDetails = async () => {
        if (!user?.logisticsOperatorId) {
            setLoading(false);
            return;
        }
        try {
            const res = await api.get(`/api/logistics/${user.logisticsOperatorId}/details`);
            setData(res.data);
        } catch (err) {
            console.error('Erro ao carregar dashboard do operador:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDetails();
    }, [user?.logisticsOperatorId]);

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

    if (!data) return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
            <h2 style={{ color: 'var(--text-secondary)' }}>Operador não vinculado ou sem dados.</h2>
            <p>Por favor, entre em contato com o administrador.</p>
        </div>
    );

    const op = data?.operator || {};
    const performance = data?.performance || [];
    const deliverers = data?.deliverers || [];
    const stocks = data?.stocks || [];

    const DayBadge = ({ label, active }: { label: string, active: boolean }) => (
        <span style={{ 
            fontSize: '0.7rem', 
            padding: '3px 10px', 
            background: active ? 'rgba(245, 217, 25, 0.15)' : 'rgba(0,0,0,0.05)', 
            color: active ? 'var(--brand-primary)' : 'var(--text-secondary)', 
            borderRadius: '6px',
            border: active ? '1px solid rgba(245, 217, 25, 0.3)' : '1px solid var(--border-color)',
            fontWeight: active ? 600 : 400
        }}>
            {label}
        </span>
    );

    return (
        <div className="page-container">
            <div className="page-header" style={{ marginBottom: '2rem' }}>
                <div>
                    <h1 className="page-title">Bem-vindo, {user?.name}</h1>
                    <p className="page-subtitle">Dashboard de performance operacional e logística para {op.name}.</p>
                </div>
            </div>

            {/* Top Info Cards */}
            <div className="grid-responsive-3" style={{ gap: '1.5rem', marginBottom: '2.5rem' }}>
                {/* Card 1: Address & Status */}
                <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                        <div style={{ 
                            padding: '8px', 
                            background: 'rgba(245, 217, 25, 0.1)', 
                            color: 'var(--brand-primary)', 
                            borderRadius: '10px' 
                        }}>
                            <MapPin size={20} />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Endereço da Operação</h3>
                            <div style={{ fontSize: '1rem', fontWeight: 600 }}>
                                {op.street && op.number ? `${op.street}, ${op.number}` : 'Endereço não informado'}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                {op.neighborhood && `${op.neighborhood}, `}{op.city} - {op.state}
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: 'auto' }}>
                        <span style={{ 
                            fontSize: '0.7rem', 
                            fontWeight: 700,
                            padding: '4px 10px', 
                            background: op.active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                            color: op.active ? '#10b981' : '#ef4444', 
                            borderRadius: '4px',
                            border: `1px solid ${op.active ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
                        }}>
                            {op.active ? 'OPERANDO' : 'INATIVO'}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                            <Users size={14} /> <strong>{formatNumber(deliverers.length)}</strong> entregadores
                        </div>
                    </div>
                </div>

                {/* Card 2: Schedule & SLA */}
                <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                        <div style={{ 
                            padding: '8px', 
                            background: 'rgba(59, 130, 246, 0.1)', 
                            color: '#3b82f6', 
                            borderRadius: '10px' 
                        }}>
                            <Clock size={20} />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Horário e SLA</h3>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                                {op.businessStart} às {op.businessEnd}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                Prazo Acordado: <strong>{op.slaHours}h</strong>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: 'auto' }}>
                        <DayBadge label="Sáb" active={op.workSaturdays} />
                        <DayBadge label="Dom" active={op.workSundays} />
                        <DayBadge label="Feriados" active={op.workHolidays} />
                    </div>
                </div>

                {/* Card 3: Performance Overview */}
                <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Saúde da Operação</span>
                        <TrendingUp size={18} color="var(--brand-primary)" />
                    </div>
                    
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Pedidos Recebidos</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{formatNumber(performance.reduce((acc: number, curr: any) => acc + (curr.success || 0) + (curr.risk || 0) + (curr.delayed || 0), 0))}</div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Entregas Realizadas</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                                {formatNumber(performance.reduce((acc: number, curr: any) => acc + (curr.success || 0), 0))}
                                <span style={{ fontSize: '0.8rem', color: 'var(--brand-primary)', marginLeft: '0.5rem' }}>
                                    ({((performance.reduce((acc: number, curr: any) => acc + (curr.success || 0), 0) / (performance.reduce((acc: number, curr: any) => acc + (curr.success || 0) + (curr.risk || 0) + (curr.delayed || 0), 0) || 1)) * 100).toFixed(1)}%)
                                </span>
                            </div>
                        </div>

                        <div style={{ paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Aderência ao SLA</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--brand-primary)' }}>
                                    {((performance.reduce((acc: number, curr: any) => acc + (curr.success || 0), 0) / (performance.reduce((acc: number, curr: any) => acc + (curr.success || 0) + (curr.risk || 0) + (curr.delayed || 0), 0) || 1)) * 100).toFixed(1)}%
                                </div>
                            </div>
                            <div style={{ height: '6px', background: 'rgba(0,0,0,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                                <div style={{ 
                                    height: '100%', 
                                    width: `${((performance.reduce((acc: number, curr: any) => acc + (curr.success || 0), 0) / (performance.reduce((acc: number, curr: any) => acc + (curr.success || 0) + (curr.risk || 0) + (curr.delayed || 0), 0) || 1)) * 100)}%`, 
                                    background: 'var(--brand-primary)',
                                    borderRadius: '10px'
                                }} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid-1-1" style={{ gap: '1.5rem' }}>
                {/* Performance Chart */}
                <div className="card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.1rem' }}>Volume de Pedidos Por Mes</h3>
                    <div style={{ height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={performance} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
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
                    <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.1rem' }}>Sua Área de Atendimento</h3>
                    <ServiceAreaMap state={op.state} regions={op.regions} />
                    <div style={{ marginTop: '1.5rem', maxHeight: '120px', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {op.regions ? op.regions.split(',').filter((r: string) => r.trim().length > 2).map((r: string) => (
                                <div key={r} style={{ 
                                    fontSize: '0.75rem', 
                                    padding: '4px 10px', 
                                    background: 'var(--bg-tertiary)', 
                                    color: 'var(--text-primary)', 
                                    borderRadius: '6px',
                                    border: '1px solid var(--border-color)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    fontWeight: 500
                                }}>
                                    {r.trim()}
                                </div>
                            )) : <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Nenhum município configurado</span>}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Content: Stock Summary */}
            <div className="card" style={{ padding: '1.5rem', marginTop: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Resumo de Estoque</h3>
                    <button 
                        className="btn-primary" 
                        style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}
                        onClick={() => navigate('/operator/stock')}
                    >
                        Ver Detalhes do Abastecimento
                    </button>
                </div>

                <div className="grid-responsive-2" style={{ gap: '2rem' }}>
                    {['ONT', 'MESH'].map(tipo => {
                        const items = stocks.filter((s: any) => s.tipo === tipo);
                        if (items.length === 0) return null;

                        return (
                            <div key={tipo}>
                                <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                    Equipamentos {tipo}
                                </h4>
                                <div style={{ display: 'grid', gap: '0.75rem' }}>
                                    {items.map((s: any) => (
                                        <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.quantity < 20 ? '#ef4444' : '#10b981' }} />
                                                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{s.manufacturer} {s.modelCode}</div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: '1.05rem', fontWeight: 800 }}>{formatNumber(s.quantity)}</div>
                                                <div style={{ fontSize: '0.6rem', color: s.quantity < 20 ? '#ef4444' : 'var(--text-secondary)', fontWeight: 700 }}>
                                                    {s.quantity < 20 ? 'CRÍTICO' : 'DISPONÍVEL'}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
