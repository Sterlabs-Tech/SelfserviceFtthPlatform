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
        tipo: 'ONT',
        manufacturer: 'Nokia',
        modelCode: 'G-240W-C',
        quantity: 0
    });
    const [showOnlyCritical, setShowOnlyCritical] = useState(false);

    const [materials, setMaterials] = useState<any[]>([]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [stockRes, opsRes, matRes] = await Promise.all([
                api.get('/api/stock'),
                api.get('/api/logistics'),
                api.get('/api/materials')
            ]);
            setStock(stockRes.data);
            setOps(opsRes.data);
            setMaterials(matRes.data);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const resetForm = () => {
        const filtered = materials.filter(m => m.tipo === 'ONT');
        setFormData({ 
            operatorId: ops[0]?.id || '', 
            tipo: 'ONT', 
            manufacturer: filtered[0]?.manufacturer || '', 
            modelCode: filtered[0]?.modelCode || '', 
            quantity: 0 
        });
    };

    useEffect(() => {
        if (materials.length > 0) {
            const filtered = materials.filter(m => m.tipo === formData.tipo);
            if (filtered.length > 0) {
                // If current model doesn't belong to current type, reset to first available for type
                if (!filtered.find(m => m.modelCode === formData.modelCode)) {
                    setFormData(prev => ({ 
                        ...prev, 
                        manufacturer: filtered[0].manufacturer,
                        modelCode: filtered[0].modelCode 
                    }));
                }
            }
        }
    }, [formData.tipo, materials]);

    const manufacturers = Array.from(new Set(materials.filter(m => m.tipo === formData.tipo).map(m => m.manufacturer)));
    const models = materials.filter(m => m.tipo === formData.tipo && m.manufacturer === formData.manufacturer).map(m => m.modelCode);

    const handleEdit = (item: any) => {
        setFormData({
            operatorId: item.operatorId,
            tipo: item.tipo || 'ONT',
            manufacturer: item.manufacturer,
            modelCode: item.modelCode,
            quantity: item.quantity
        });
        // If it's a virtual item (not in DB), we set editingId to null to trigger a POST (create)
        setEditingId(item.isVirtual ? null : item.id);
        setShowForm(true);
    };

    const handleDelete = async (id: string, code: string) => {
        if (!confirm(`Tem certeza que deseja excluir o estoque do modelo ${code}?`)) return;
        try {
            await api.delete(`/api/stock/${id}`);
            loadData();
        } catch (err) {
            console.error(err);
            alert('Erro ao excluir estoque.');
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
            resetForm();
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
                    <h1 className="page-title">Gestão de Abastecimento</h1>
                    <p className="page-subtitle">Identifique operadores com baixo estoque e coordene a reposição de materiais.</p>
                </div>
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                    <label style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.5rem', 
                        cursor: 'pointer', 
                        fontSize: '0.85rem', 
                        color: showOnlyCritical ? 'var(--brand-primary)' : 'var(--text-secondary)',
                        fontWeight: showOnlyCritical ? 600 : 400,
                        background: showOnlyCritical ? 'rgba(245, 158, 11, 0.05)' : 'transparent',
                        padding: '0.5rem 1rem',
                        borderRadius: '8px',
                        border: `1px solid ${showOnlyCritical ? 'var(--brand-primary)' : 'var(--border-color)'}`,
                        transition: '0.2s all'
                    }}>
                        <input 
                            type="checkbox" 
                            checked={showOnlyCritical} 
                            onChange={e => setShowOnlyCritical(e.target.checked)} 
                            style={{ width: '16px', height: '16px', accentColor: 'var(--brand-primary)' }}
                        />
                        Apenas itens criticos / baixos
                    </label>
                    {!showForm && (
                        <div style={{ 
                            fontSize: '0.9rem', 
                            color: 'var(--text-secondary)', 
                            background: 'var(--bg-tertiary)', 
                            padding: '0.6rem 1.2rem', 
                            borderRadius: '8px',
                            border: '1px solid var(--border-color)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                             <Edit size={16} style={{ color: 'var(--brand-primary)' }} />
                            <span>Clique em uma linha para editar o estoque</span>
                        </div>
                    )}
                </div>
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
                                setFormData({ ...formData, operatorId: e.target.value });
                            }} required>
                                <option value="" disabled>Selecione um operador</option>
                                {ops.map(o => (
                                    <option key={o.id} value={o.id}>{o.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="input-group">
                            <label className="input-label">Tipo</label>
                            <select className="input-field" value={formData.tipo} onChange={e => {
                                setFormData({ 
                                    ...formData, 
                                    tipo: e.target.value
                                });
                            }} required>
                                <option value="ONT">ONT</option>
                                <option value="MESH">MESH</option>
                            </select>
                        </div>
                        <div className="input-group">
                            <label className="input-label">Fabricante</label>
                            <select className="input-field" value={formData.manufacturer} onChange={e => setFormData({ ...formData, manufacturer: e.target.value })} required>
                                {manufacturers.map(m => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                        </div>
                        <div className="input-group">
                            <label className="input-label">Modelo/Código</label>
                            <select className="input-field" value={formData.modelCode} onChange={e => setFormData({ ...formData, modelCode: e.target.value })} required>
                                {models.map(m => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
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
                            <th>Tipo</th>
                            <th>Material / Modelo</th>
                            <th>Quantidade</th>
                            <th>Status de Abastecimento</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan={6} style={{ textAlign: 'center', padding: '4rem' }}>
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
                                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Aguarde enquanto carregamos o estoque local</span>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ) : (() => {
                            // 1. Create a full matrix of all Operators x all MaterialItems
                            const fullMatrix: any[] = [];
                            ops.forEach(op => {
                                materials.forEach(mat => {
                                    const existing = stock.find(s => s.operatorId === op.id && s.modelCode === mat.modelCode);
                                    if (existing) {
                                        fullMatrix.push({ ...existing, isVirtual: false });
                                    } else {
                                        fullMatrix.push({
                                            id: `virtual-${op.id}-${mat.modelCode}`,
                                            operatorId: op.id,
                                            tipo: mat.tipo,
                                            manufacturer: mat.manufacturer,
                                            modelCode: mat.modelCode,
                                            quantity: 0,
                                            operator: op,
                                            isVirtual: true
                                        });
                                    }
                                });
                            });

                            const filteredStock = fullMatrix
                                .filter(s => !showOnlyCritical || s.quantity < 20)
                                .sort((a, b) => {
                                    // Primary sort: 0/Virtual first
                                    if (a.quantity === 0 && b.quantity !== 0) return -1;
                                    if (a.quantity !== 0 && b.quantity === 0) return 1;
                                    // Secondary sort: < 20 next
                                    if (a.quantity < 20 && b.quantity >= 20) return -1;
                                    if (a.quantity >= 20 && b.quantity < 20) return 1;
                                    // Final sort: quantity ascending
                                    return a.quantity - b.quantity;
                                });

                            if (filteredStock.length === 0) {
                                return (
                                    <tr>
                                        <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>
                                            {showOnlyCritical ? 'Nenhum item em estado crítico ou baixo.' : 'Estoque vazio ou não cadastrado.'}
                                        </td>
                                    </tr>
                                );
                            }

                            return filteredStock.map((s, idx) => (
                                <tr 
                                    key={idx} 
                                    onClick={() => handleEdit(s)}
                                    title={s.isVirtual ? 'Clique para cadastrar estoque' : 'Clique para editar estoque'}
                                    style={{ 
                                        background: s.quantity === 0 ? 'rgba(239, 68, 68, 0.05)' : s.quantity < 20 ? 'rgba(245, 158, 11, 0.05)' : 'inherit',
                                        cursor: 'pointer',
                                        transition: 'background 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = s.quantity === 0 ? 'rgba(239, 68, 68, 0.1)' : s.quantity < 20 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(0,0,0,0.02)' }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = s.quantity === 0 ? 'rgba(239, 68, 68, 0.05)' : s.quantity < 20 ? 'rgba(245, 158, 11, 0.05)' : 'inherit' }}
                                >
                                    <td style={{ fontWeight: 600 }}>{s.operator?.name || 'V.tal (Sede)'}</td>
                                    <td>
                                        <span style={{ fontSize: '0.75rem', padding: '2px 6px', background: 'var(--bg-tertiary)', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                                            {s.tipo || 'ONT'}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ fontSize: '0.9rem' }}>
                                            <strong>{s.manufacturer}</strong>
                                            <span style={{ color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>{s.modelCode}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <div style={{ width: '40px', height: '6px', background: 'var(--bg-tertiary)', borderRadius: '10px', overflow: 'hidden' }}>
                                                <div style={{ 
                                                    height: '100%', 
                                                    width: `${Math.min((s.quantity / 100) * 100, 100)}%`, 
                                                    background: s.quantity === 0 ? '#ef4444' : s.quantity < 20 ? '#f59e0b' : '#10b981'
                                                }} />
                                            </div>
                                            <strong>{s.quantity}</strong>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`badge ${s.quantity >= 20 ? 'badge-success' : 'badge-danger'}`} style={{ 
                                            background: s.quantity === 0 ? '#ef4444' : s.quantity < 20 ? '#f59e0b' : '',
                                            color: (s.quantity === 0 || s.quantity < 20) ? '#fff' : ''
                                        }}>
                                            {s.quantity === 0 ? (s.isVirtual ? 'NÃO CADASTRADO: SEM ESTOQUE' : 'CRÍTICO: SEM ESTOQUE') : s.quantity < 20 ? 'BAIXO: NECESSITA REPOSIÇÃO' : 'OK: ESTOQUE NORMAL'}
                                        </span>
                                    </td>
                                </tr>
                            ));
                        })()}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
