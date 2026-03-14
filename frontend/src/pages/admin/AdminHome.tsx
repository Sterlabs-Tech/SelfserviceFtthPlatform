import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LayoutDashboard, Package, Users, Truck, ArrowRight, TrendingUp, BarChart3, Map as MapIcon, Calendar } from 'lucide-react';
import api from '../../services/apiClient';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Legend
} from 'recharts';
import { BrazilMap } from '../../components/BrazilMap';

export const AdminHome = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.get('/api/dashboard/stats');
                setData(res.data);
            } catch (err) {
                console.error('Erro ao carregar dados do dashboard:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading && !data) {
        return (
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
                <p style={{ color: 'var(--text-secondary)', fontWeight: 500, fontSize: '1.1rem' }}>Sintonizando indicadores operacionais...</p>
            </div>
        );
    }

    const cards = [
        { icon: <LayoutDashboard size={28} />, label: 'Pedidos Abertos', value: data.totalOpenOrders, color: '#e6167d', route: '/admin/support' },
        { icon: <Package size={28} />, label: 'ONT em Estoque', value: data.totalStock, color: '#10b981', route: '/admin/stock' },
        { icon: <Truck size={28} />, label: 'Operadores', value: data.totalOperators, color: '#f59e0b', route: '/admin/logistics' },
        { icon: <Users size={28} />, label: 'Usuários', value: data.totalUsers, color: '#8b5cf6', route: '/admin/users' },
    ];

    return (
        <div>
            <div className="page-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 className="page-title">Dashboard Operacional</h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                        Bem-vindo, <strong>{user?.name || 'Admin'}</strong>. Indicadores de performance da plataforma.
                    </p>
                </div>
                <div style={{ 
                    display: 'flex', 
                    gap: '0.5rem', 
                    alignItems: 'center', 
                    fontSize: '0.85rem', 
                    color: 'var(--text-secondary)', 
                    background: 'var(--bg-primary)', 
                    padding: '0.5rem 1rem', 
                    borderRadius: 'var(--radius-md)', 
                    border: '1px solid var(--border-color)',
                    whiteSpace: 'nowrap'
                }}>
                    <Calendar size={16} />
                    Último log: {new Date().toLocaleDateString('pt-BR')}
                </div>
            </div>

            {/* Stat Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '1.5rem',
                marginBottom: '2rem'
            }}>
                {cards.map((card, i) => (
                    <div
                        key={i}
                        className="glass-panel"
                        onClick={() => navigate(card.route)}
                        style={{
                            padding: '1.5rem',
                            cursor: 'pointer',
                            borderLeft: `4px solid ${card.color}`,
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <div style={{ color: card.color, marginBottom: '0.75rem' }}>{card.icon}</div>
                                <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)' }}>{card.value}</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{card.label}</div>
                            </div>
                            <ArrowRight size={18} style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Charts Row */}
            <div className="grid-2-1" style={{ marginBottom: '2rem' }}>
                {/* 30 Day Daily Orders */}
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                        <TrendingUp size={20} style={{ color: 'var(--brand-primary)' }} />
                        <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Histórico de 30 Dias (Abertas vs Encerradas)</h3>
                    </div>
                    <div style={{ height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data.dailyOrders}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                                <XAxis dataKey="date" hide />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
                                <Tooltip 
                                    contentStyle={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}
                                    itemStyle={{ fontSize: '12px' }}
                                />
                                <Legend verticalAlign="top" align="right" height={36}/>
                                <Line type="monotone" dataKey="opened" name="Abertas" stroke="#3b82f6" strokeWidth={2} dot={false} />
                                <Line type="monotone" dataKey="closed" name="Encerradas" stroke="#10b981" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* SLA Compliance */}
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                        <BarChart3 size={20} style={{ color: 'var(--brand-primary)' }} />
                        <h3 style={{ fontSize: '1.1rem', margin: 0 }}>SLA Compliance (6 Meses)</h3>
                    </div>
                    <div style={{ height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.slaCompliance} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border-color)" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="month" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} width={60} />
                                <Tooltip 
                                    formatter={(value: any) => `${(value as number).toFixed(1)}%`}
                                    contentStyle={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}
                                />
                                <Legend verticalAlign="top" align="right" iconType="circle" />
                                <Bar dataKey="withinSla" name="No Prazo" stackId="a" fill="#10b981" />
                                <Bar dataKey="overdue" name="Atrasadas" stackId="a" fill="#ef4444" />
                                <Bar dataKey="cancelled" name="Canceladas" stackId="a" fill="#94a3b8" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Maps Row */}
            <div className="grid-1-1">
                {/* Demand Heatmap */}
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                        <MapIcon size={20} style={{ color: 'var(--brand-primary)' }} />
                        <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Densidade de Pedidos por UF</h3>
                    </div>
                    <BrazilMap data={data.ufDistribution} type="heat" />
                </div>

                {/* Operator Pins */}
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                        <Truck size={20} style={{ color: 'var(--brand-primary)' }} />
                        <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Localização dos Operadores</h3>
                    </div>
                    <BrazilMap data={data.ufDistribution} operators={data.operators} type="pins" />
                </div>
            </div>
        </div>
    );
};
