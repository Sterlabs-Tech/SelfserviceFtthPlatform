import { useState, useEffect } from 'react';
import api from '../../services/apiClient';
import { PackagePlus, X, Edit, Trash2 } from 'lucide-react';

export const Stock = () => {
    const [stock, setStock] = useState<any[]>([]);
    const [ops, setOps] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        operatorId: '',
        region: 'SP',
        tipo: 'ONT',
        manufacturer: '',
        modelCode: '',
        quantity: 0
    });

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [stockRes, opsRes] = await Promise.all([
                api.get('/api/stock'),
                api.get('/api/logistics')
            ]);
            setStock(stockRes.data);
            setOps(opsRes.data);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleEdit = (item: any) => {
        setFormData({
            operatorId: item.operatorId,
            region: item.region,
            tipo: item.tipo || 'ONT',
            manufacturer: item.manufacturer,
            modelCode: item.modelCode,
            quantity: item.quantity
        });
        setEditingId(item.id);
        setShowForm(true);
    };

    const handleDelete = async (id: string, code: string) => {
        if (!confirm(`Tem certeza que deseja diminuir o estoque do modelo ${code}?`)) return;
        try {
            await api.delete(`/api/stock/${id}`);
            loadData();
        } catch (err) {
            console.error(err);
            alert('Erro ao retirar estoque.');
        }
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                quantity: Number(formData.quantity)
            };
            if (editingId) {
                await api.put(`/api/stock/${editingId}`, payload);
            } else {
                await api.post('/api/stock', payload);
            }
            setShowForm(false);
            setEditingId(null);
            setFormData({ operatorId: ops[0]?.id || '', region: 'SP', tipo: 'ONT', manufacturer: '', modelCode: '', quantity: 0 });
            loadData();
        } catch (err) {
            console.error(err);
            alert('Erro ao salvar estoque.');
        }
    };

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Inventário de Materiais</h1>
                    <p className="page-subtitle">Acompanhe disponibilidade por Operador e Região.</p>
                </div>
                {!showForm && (
                    <button className="btn-primary" onClick={() => {
                        setEditingId(null);
                        setFormData({ operatorId: ops[0]?.id || '', region: 'SP', tipo: 'ONT', manufacturer: '', modelCode: '', quantity: 0 });
                        setShowForm(true);
                    }}>
                        <PackagePlus size={18} /> Cadastrar
                    </button>
                )}
            </div>

            {showForm && (
                <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.2rem', margin: 0 }}>{editingId ? 'Editar Estoque' : 'Cadastrar Novo Estoque'}</h2>
                        <button onClick={() => { setShowForm(false); setEditingId(null); }} style={{ color: 'var(--text-secondary)' }}>
                            <X size={20} />
                        </button>
                    </div>
                    <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="input-group">
                            <label className="input-label">Operador Logístico</label>
                            <select className="input-field" value={formData.operatorId} onChange={e => {
                                const newOpId = e.target.value;
                                const op = ops.find(o => o.id === newOpId);
                                const allowedRegions = op && op.regions ? op.regions.split(',').map((r: string) => r.trim()).filter(Boolean) : [];
                                // If current region is not in the new allowed list, reset it
                                const newRegion = allowedRegions.length > 0 && !allowedRegions.includes(formData.region) ? allowedRegions[0] : formData.region;
                                setFormData({ ...formData, operatorId: newOpId, region: newRegion });
                            }} required>
                                <option value="" disabled>Selecione um operador</option>
                                {ops.map(o => (
                                    <option key={o.id} value={o.id}>{o.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="input-group">
                            <label className="input-label">Região Atendida (Município)</label>
                            <select className="input-field" value={formData.region} onChange={e => setFormData({ ...formData, region: e.target.value })} required disabled={!formData.operatorId}>
                                {(() => {
                                    const selectedOp = ops.find(o => o.id === formData.operatorId);
                                    if (!selectedOp || !selectedOp.regions) return <option value="" disabled>Selecione um operador primeiro</option>;
                                    const opMunis = selectedOp.regions.split(',').map((r: string) => r.trim()).filter(Boolean);
                                    return (
                                        <>
                                            <option value="" disabled>Selecione um município</option>
                                            {opMunis.map((muni: string) => (
                                                <option key={muni} value={muni}>{muni}</option>
                                            ))}
                                        </>
                                    );
                                })()}
                            </select>
                        </div>
                        <div className="input-group">
                            <label className="input-label">Tipo</label>
                            <select className="input-field" value={formData.tipo} onChange={e => setFormData({ ...formData, tipo: e.target.value })} required>
                                <option value="ONT">ONT</option>
                                <option value="MESH">MESH</option>
                            </select>
                        </div>
                        <div className="input-group">
                            <label className="input-label">Fabricante</label>
                            <input className="input-field" value={formData.manufacturer} onChange={e => setFormData({ ...formData, manufacturer: e.target.value })} required placeholder="Ex: Nokia, Huawei" />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Modelo/Código</label>
                            <input className="input-field" value={formData.modelCode} onChange={e => setFormData({ ...formData, modelCode: e.target.value })} required placeholder="Ex: G-240W-C" />
                        </div>
                        <div className="input-group" style={{ gridColumn: 'span 2' }}>
                            <label className="input-label">Quantidade em Estoque</label>
                            <input type="number" className="input-field" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: Number(e.target.value) })} required min="0" />
                        </div>
                        <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                            <button type="button" className="btn-secondary" onClick={() => { setShowForm(false); setEditingId(null); }}>Cancelar</button>
                            <button type="submit" className="btn-primary">Salvar Lançamento</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="glass-panel">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Operador</th>
                            <th>Região</th>
                            <th>Tipo</th>
                            <th>Fabricante</th>
                            <th>Modelo/Código</th>
                            <th>Quantidade</th>
                            <th style={{ width: '100px', textAlign: 'center' }}>Ações</th>
                        </tr>
                    </thead>
                        {isLoading ? (
                            <tr>
                                <td colSpan={7} style={{ textAlign: 'center', padding: '4rem' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
                                        <svg width="60" height="60" viewBox="0 0 100 100" className="fidget-spinner">
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
                                            <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '1.1rem', display: 'block' }}>Consultando inventário...</span>
                                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Aguarde enquanto carregamos o estoque regional</span>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ) : stock.length > 0 ? (
                            stock.map((s, idx) => (
                                <tr key={idx}>
                                    <td>{s.operator?.name || 'V.tal (Sede)'}</td>
                                    <td>{s.region}</td>
                                    <td>{s.tipo || 'ONT'}</td>
                                    <td>{s.manufacturer}</td>
                                    <td>{s.modelCode}</td>
                                    <td>
                                        <span className={`badge ${s.quantity > 0 ? 'badge-success' : 'badge-danger'}`}>
                                            {s.quantity} em estoque
                                        </span>
                                    </td>
                                    <td style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                        <button onClick={() => handleEdit(s)} style={{ color: 'var(--brand-primary)', padding: '0.2rem' }}>
                                            <Edit size={16} />
                                        </button>
                                        <button onClick={() => handleDelete(s.id, s.modelCode)} style={{ color: 'var(--danger)', padding: '0.2rem' }}>
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>
                                    Estoque vazio ou não cadastrado.
                                </td>
                            </tr>
                        )}
                </table>
            </div>
        </div>
    );
};
