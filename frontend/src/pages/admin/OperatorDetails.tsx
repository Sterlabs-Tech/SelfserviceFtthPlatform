import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/apiClient';
import { ArrowLeft, Users, Clock, MapPin, TrendingUp, Edit, Trash2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import { PackagePlus, UserPlus, X, Camera } from 'lucide-react';

import { ServiceAreaMap } from '../../components/ServiceAreaMap';

export const OperatorDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [materials, setMaterials] = useState<any[]>([]);

    // Stock Form State
    const [showStockForm, setShowStockForm] = useState(false);
    const [editingStock, setEditingStock] = useState<string | null>(null);
    const [stockFormData, setStockFormData] = useState({
        tipo: 'ONT',
        manufacturer: '',
        modelCode: '',
        quantity: 0
    });

    // User Form State
    const [showUserForm, setShowUserForm] = useState(false);
    const [editingUser, setEditingUser] = useState<string | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [userFormData, setUserFormData] = useState({
        name: '',
        email: '',
        password: '',
        profile: 'DELIVERER',
        active: true,
        photoUrl: ''
    });

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setUserFormData({ ...userFormData, photoUrl: reader.result as string });
            reader.readAsDataURL(file);
        }
    };

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

    const loadMaterials = async () => {
        try {
            const res = await api.get('/api/materials');
            setMaterials(res.data);
        } catch (err) {
            console.error('Erro ao carregar materiais:', err);
        }
    };

    useEffect(() => {
        loadDetails();
        loadMaterials();
    }, [id]);

    // Stock Handlers
    const resetStockForm = () => {
        const filtered = materials.filter(m => m.tipo === 'ONT');
        setStockFormData({
            tipo: 'ONT',
            manufacturer: filtered[0]?.manufacturer || '',
            modelCode: filtered[0]?.modelCode || '',
            quantity: 0
        });
        setEditingStock(null);
        setShowStockForm(false);
    };

    const handleEditStock = (item: any) => {
        setStockFormData({
            tipo: item.tipo || 'ONT',
            manufacturer: item.manufacturer,
            modelCode: item.modelCode,
            quantity: item.quantity
        });
        setEditingStock(item.id);
        setShowStockForm(true);
    };

    const handleDeleteStock = async (stockId: string, model: string) => {
        if (!confirm(`Excluir estoque de ${model}?`)) return;
        try {
            await api.delete(`/api/stock/${stockId}`);
            loadDetails();
        } catch (err) {
            alert('Erro ao excluir estoque.');
        }
    };

    const handleStockSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                ...stockFormData,
                operatorId: id,
                quantity: Number(stockFormData.quantity)
            };
            if (editingStock) {
                await api.put(`/api/stock/${editingStock}`, payload);
            } else {
                await api.post('/api/stock', payload);
            }
            resetStockForm();
            loadDetails();
        } catch (err) {
            alert('Erro ao salvar estoque.');
        }
    };

    // User Handlers
    const resetUserForm = () => {
        setUserFormData({
            name: '',
            email: '',
            password: '',
            profile: 'DELIVERER',
            active: true,
            photoUrl: ''
        });
        setEditingUser(null);
        setShowUserForm(false);
    };

    const handleEditUser = (user: any) => {
        setUserFormData({
            name: user.name,
            email: user.email,
            password: '',
            profile: user.profile,
            active: user.active,
            photoUrl: user.photoUrl || ''
        });
        setEditingUser(user.id);
        setShowUserForm(true);
    };

    const handleDeleteUser = async (userId: string, name: string) => {
        if (!confirm(`Remover ${name} da equipe?`)) return;
        try {
            await api.delete(`/api/users/${userId}`);
            loadDetails();
        } catch (err) {
            alert('Erro ao remover usuário.');
        }
    };

    const handleUserSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload: any = {
                ...userFormData,
                logisticsOperatorId: id
            };
            if (!payload.password && !editingUser) payload.password = '123456';
            if (editingUser && !payload.password) delete payload.password;

            if (editingUser) {
                await api.put(`/api/users/${editingUser}`, payload);
            } else {
                await api.post('/api/users', payload);
            }
            resetUserForm();
            loadDetails();
        } catch (err) {
            alert('Erro ao salvar usuário.');
        }
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
            <p style={{ color: 'var(--text-secondary)', fontWeight: 500, fontSize: '1.1rem' }}>Sintonizando performance do operador...</p>
        </div>
    );

    if (!data) return <div style={{ padding: '2rem' }}>Operador não localizado.</div>;

    const op = data.operator;

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
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={() => navigate(-1)} className="btn-secondary" style={{ padding: '0.4rem', borderRadius: '8px', display: 'flex' }}>
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>{op.name}</h1>
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
                        onClick={() => setShowDeleteConfirm(true)} 
                        className="btn-danger"
                        style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
                    >
                        <Trash2 size={16} /> Excluir
                    </button>
                </div>
            </div>

            {/* Top Info Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
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
                                {op.complement ? ` - ${op.complement}` : ''}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                {op.neighborhood && `${op.neighborhood}, `}{op.city} - {op.state} {op.zipCode && `(${op.zipCode})`}
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
                            {op.active ? 'HABILITADO' : 'INATIVO'}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                            <Users size={14} /> <strong>{data.deliverers.length}</strong> membros
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
                                Prazo de Entrega: <strong>{op.slaHours}h</strong>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: 'auto' }}>
                        <DayBadge label="Sáb" active={op.workSaturdays} />
                        <DayBadge label="Dom" active={op.workSundays} />
                        <DayBadge label="Feriados" active={op.workHolidays} />
                    </div>
                </div>

                {/* Card 3: Atendimento */}
                <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Atendimento</span>
                        <TrendingUp size={18} color="var(--brand-primary)" />
                    </div>
                    
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Volume demandado</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{data.performance.reduce((acc: number, curr: any) => acc + curr.success + curr.risk + curr.delayed, 0)}</div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Volume entregue</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                                {data.performance.reduce((acc: number, curr: any) => acc + curr.success, 0)}
                                <span style={{ fontSize: '0.8rem', color: 'var(--brand-primary)', marginLeft: '0.5rem' }}>
                                    ({((data.performance.reduce((acc: number, curr: any) => acc + curr.success, 0) / (data.performance.reduce((acc: number, curr: any) => acc + curr.success + curr.risk + curr.delayed, 0) || 1)) * 100).toFixed(1)}%)
                                </span>
                            </div>
                        </div>

                        <div style={{ paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>% entregas dentro do SLA</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--brand-primary)' }}>
                                    {((data.performance.reduce((acc: number, curr: any) => acc + curr.success, 0) / (data.performance.reduce((acc: number, curr: any) => acc + curr.success + curr.risk + curr.delayed, 0) || 1)) * 100).toFixed(1)}%
                                </div>
                            </div>
                            <div style={{ height: '6px', background: 'rgba(0,0,0,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                                <div style={{ 
                                    height: '100%', 
                                    width: `${((data.performance.reduce((acc: number, curr: any) => acc + curr.success, 0) / (data.performance.reduce((acc: number, curr: any) => acc + curr.success + curr.risk + curr.delayed, 0) || 1)) * 100)}%`, 
                                    background: 'var(--brand-primary)',
                                    borderRadius: '10px'
                                }} />
                            </div>
                        </div>
                    </div>
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

            {/* Bottom Content: Stock and Team */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 0.8fr)', gap: '1.5rem', marginTop: '1.5rem' }}>
                {/* Regional Stock Card */}
                <div className="card" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Estoque Local</h3>
                        <button 
                            className="btn-primary" 
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                            onClick={() => { resetStockForm(); setShowStockForm(true); }}
                        >
                            <PackagePlus size={14} style={{ marginRight: '4px' }} /> Novo Tipo de Material
                        </button>
                    </div>

                    <div style={{ display: 'grid', gap: '2rem' }}>
                        {['ONT', 'MESH'].map(tipo => {
                            const items = (data.stocks || []).filter((s: any) => s.tipo === tipo);
                            if (items.length === 0) return null;

                            return (
                                <div key={tipo}>
                                    <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        {tipo === 'ONT' ? 'ONTs' : tipo}
                                        <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
                                    </h4>
                                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                                        {items.length > 0 ? items.map((s: any) => (
                                            <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.quantity < 20 ? '#ef4444' : '#10b981' }} />
                                                    <div style={{ fontSize: '0.9rem' }}>
                                                        <span style={{ fontWeight: 600 }}>{s.manufacturer}</span>
                                                        <span style={{ color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>| {s.modelCode}</span>
                                                    </div>
                                                </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <button 
                                                            onClick={() => handleEditStock(s)} 
                                                            style={{ border: 'none', background: 'transparent', color: 'var(--brand-primary)', cursor: 'pointer', padding: '0.2rem' }}
                                                        >
                                                            <Edit size={14} />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDeleteStock(s.id, s.modelCode)}
                                                            style={{ border: 'none', background: 'transparent', color: 'var(--danger)', cursor: 'pointer', padding: '0.2rem' }}
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                        <div style={{ textAlign: 'right' }}>
                                                            <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{s.quantity}</div>
                                                            <div style={{ fontSize: '0.65rem', color: s.quantity < 20 ? '#ef4444' : 'var(--text-secondary)', fontWeight: 600 }}>
                                                                {s.quantity < 20 ? 'ESTOQUE BAIXO' : 'NORMAL'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* Thermometer indicator */}
                                                    <div style={{ width: '40px', height: '6px', background: 'var(--bg-tertiary)', borderRadius: '10px', overflow: 'hidden' }}>
                                                        <div style={{ 
                                                            height: '100%', 
                                                            width: `${Math.min((s.quantity / 100) * 100, 100)}%`, 
                                                            background: s.quantity < 20 ? '#ef4444' : '#10b981'
                                                        }} />
                                                    </div>
                                                </div>
                                        )) : (
                                            <div style={{ padding: '1rem', border: '1px dashed var(--border-color)', borderRadius: '10px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                                                Nenhum item em estoque
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Team Card */}
                <div className="card" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Equipe de Logística</h3>
                        <button 
                            className="btn-primary" 
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                            onClick={() => { resetUserForm(); setShowUserForm(true); }}
                        >
                            <UserPlus size={14} style={{ marginRight: '4px' }} /> Novo Membro
                        </button>
                    </div>

                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                        {data.deliverers.map((u: any) => (
                            <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, color: 'var(--brand-primary)' }}>
                                        {u.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>{u.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{u.profile}</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <button 
                                        onClick={() => handleEditUser(u)}
                                        style={{ border: 'none', background: 'transparent', color: 'var(--brand-primary)', cursor: 'pointer', padding: '0.2rem' }}
                                    >
                                        <Edit size={14} />
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteUser(u.id, u.name)}
                                        style={{ border: 'none', background: 'transparent', color: 'var(--danger)', cursor: 'pointer', padding: '0.2rem' }}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '4px 10px', borderRadius: '20px', background: u.active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)' }}>
                                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: u.active ? '#10b981' : '#ef4444' }} />
                                        <span style={{ fontSize: '0.7rem', fontWeight: 600, color: u.active ? '#10b981' : '#ef4444' }}>
                                            {u.active ? 'ATIVO' : 'INATIVO'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {data.deliverers.length === 0 && (
                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                Nenhum membro vinculado a este operador.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modals for Management */}
            {showStockForm && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                    <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.2rem', margin: 0 }}>{editingStock ? 'Editar Estoque' : 'Cadastrar Novo Estoque'}</h2>
                            <button onClick={resetStockForm} style={{ color: 'var(--text-secondary)', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleStockSubmit} style={{ display: 'grid', gap: '1rem' }}>
                            <div className="input-group">
                                <label className="input-label">Tipo</label>
                                <select 
                                    className="input-field" 
                                    value={stockFormData.tipo} 
                                    onChange={e => {
                                        const newTipo = e.target.value;
                                        const filtered = materials.filter(m => m.tipo === newTipo);
                                        setStockFormData({ 
                                            ...stockFormData, 
                                            tipo: newTipo,
                                            manufacturer: filtered[0]?.manufacturer || '',
                                            modelCode: filtered[0]?.modelCode || ''
                                        });
                                    }} 
                                    required
                                >
                                    <option value="ONT">ONT</option>
                                    <option value="MESH">MESH</option>
                                </select>
                            </div>
                            <div className="input-group">
                                <label className="input-label">Material</label>
                                <select 
                                    className="input-field" 
                                    value={stockFormData.modelCode} 
                                    onChange={e => {
                                        const mat = materials.find(m => m.modelCode === e.target.value);
                                        setStockFormData({ ...stockFormData, modelCode: e.target.value, manufacturer: mat?.manufacturer || '' });
                                    }} 
                                    required
                                >
                                    <option value="" disabled>Selecione um material</option>
                                    {materials.filter(m => m.tipo === stockFormData.tipo).map(m => (
                                        <option key={m.id} value={m.modelCode}>{m.manufacturer} - {m.modelCode}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="input-group">
                                <label className="input-label">Quantidade</label>
                                <input type="number" className="input-field" value={stockFormData.quantity} onChange={e => setStockFormData({ ...stockFormData, quantity: Number(e.target.value) })} required min="0" />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                                <button type="button" className="btn-secondary" onClick={resetStockForm}>Cancelar</button>
                                <button type="submit" className="btn-primary">Salvar Estoque</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showUserForm && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                    <div className="glass-panel" style={{ width: '100%', maxWidth: '600px', padding: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.2rem', margin: 0 }}>{editingUser ? 'Editar Membro' : 'Novo Membro da Equipe'}</h2>
                            <button onClick={resetUserForm} style={{ color: 'var(--text-secondary)', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleUserSubmit} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 2fr)', gap: '2rem' }}>
                            {/* Photo Upload Section */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                <div
                                    style={{ width: '120px', height: '120px', borderRadius: '50%', backgroundColor: 'var(--bg-secondary)', border: '2px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', cursor: 'pointer', position: 'relative' }}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    {userFormData.photoUrl ? (
                                        <img src={userFormData.photoUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--text-secondary)' }}>
                                            <Camera size={24} style={{ marginBottom: '8px' }} />
                                            <span style={{ fontSize: '0.75rem' }}>Upload Foto</span>
                                        </div>
                                    )}
                                </div>
                                <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" style={{ display: 'none' }} />
                                {userFormData.photoUrl && (
                                    <button type="button" onClick={() => setUserFormData({ ...userFormData, photoUrl: '' })} style={{ fontSize: '0.8rem', color: 'var(--danger)', background: 'transparent', border: 'none', cursor: 'pointer' }}>Remover Foto</button>
                                )}

                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', fontSize: '0.9rem', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={userFormData.active} onChange={e => setUserFormData({ ...userFormData, active: e.target.checked })} style={{ width: '16px', height: '16px' }} />
                                    Usuário Ativo
                                </label>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="input-group" style={{ gridColumn: 'span 2' }}>
                                    <label className="input-label">Nome Completo</label>
                                    <input className="input-field" value={userFormData.name} onChange={e => setUserFormData({ ...userFormData, name: e.target.value })} required />
                                </div>
                            <div className="input-group">
                                <label className="input-label">E-mail</label>
                                <input type="email" className="input-field" value={userFormData.email} onChange={e => setUserFormData({ ...userFormData, email: e.target.value })} required />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Senha {editingUser && '(opcional)'}</label>
                                <input type="password" className="input-field" value={userFormData.password} onChange={e => setUserFormData({ ...userFormData, password: e.target.value })} placeholder={editingUser ? '••••••••' : 'Sugerida: 123456'} />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Perfil</label>
                                <select className="input-field" value={userFormData.profile} onChange={e => setUserFormData({ ...userFormData, profile: e.target.value })} required>
                                    <option value="DELIVERER">Entregador</option>
                                    <option value="LOGISTICS_OPERATOR">Operador Logístico</option>
                                    <option value="LOGISTICS_CONSULT">Consulta Logística</option>
                                </select>
                            </div>
                            <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                                <button type="button" className="btn-secondary" onClick={resetUserForm}>Cancelar</button>
                                <button type="submit" className="btn-primary">Salvar Usuário</button>
                            </div>
                        </div>
                    </form>
                    </div>
                </div>
            )}

            {/* Modal de Confirmação de Exclusão */}
            {showDeleteConfirm && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                    <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '2rem', textAlign: 'center' }}>
                        <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
                            <Trash2 size={30} />
                        </div>
                        <h2 style={{ fontSize: '1.25rem', margin: '0 0 1rem 0' }}>Excluir Operador?</h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem', lineHeight: '1.5' }}>
                            Confirma a exclusão de <strong>{op.name}</strong>? Esta ação não poderá ser desfeita.
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <button className="btn-secondary" onClick={() => setShowDeleteConfirm(false)}>
                                Cancelar
                            </button>
                            <button 
                                className="btn-danger" 
                                onClick={async () => {
                                    try {
                                        await api.delete(`/api/logistics/${id}`);
                                        navigate('/admin/logistics');
                                    } catch (err: any) {
                                        alert('Erro ao excluir: ' + (err.response?.data?.error || err.message));
                                        setShowDeleteConfirm(false);
                                    }
                                }}
                            >
                                Confirmar Exclusão
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
