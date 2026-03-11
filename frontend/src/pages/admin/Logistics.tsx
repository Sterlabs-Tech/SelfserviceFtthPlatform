import { useState, useEffect } from 'react';
import axios from 'axios';
import { Truck, X, Edit, Trash2 } from 'lucide-react';

const UF_OPTIONS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

export const Logistics = () => {
    const [ops, setOps] = useState<any[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        active: true,
        slaHours: 24,
        businessHours: '08:00 às 18:00',
        regions: ''
    });

    const loadOps = () => {
        axios.get('http://localhost:3001/api/logistics').then(res => setOps(res.data)).catch(e => console.error(e));
    };

    useEffect(() => {
        loadOps();
    }, []);

    const handleEdit = (op: any) => {
        setFormData({
            name: op.name,
            active: op.active,
            slaHours: op.slaHours,
            businessHours: op.businessHours,
            regions: op.regions
        });
        setEditingId(op.id);
        setShowForm(true);
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Tem certeza que deseja excluir o operador ${name}?`)) return;
        try {
            await axios.delete(`http://localhost:3001/api/logistics/${id}`);
            loadOps();
        } catch (err) {
            console.error(err);
            alert('Erro ao excluir operador logístico.');
        }
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                slaHours: Number(formData.slaHours)
            };

            if (editingId) {
                await axios.put(`http://localhost:3001/api/logistics/${editingId}`, payload);
            } else {
                await axios.post('http://localhost:3001/api/logistics', payload);
            }

            setShowForm(false);
            setEditingId(null);
            setFormData({ name: '', active: true, slaHours: 24, businessHours: '08:00 às 18:00', regions: '' });
            loadOps();
        } catch (err) {
            console.error(err);
            alert('Erro ao salvar operador.');
        }
    };

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Operadores Logísticos</h1>
                    <p className="page-subtitle">Controle os parceiros responsáveis pelo despacho e entrega das ONTs.</p>
                </div>
                {!showForm && (
                    <button className="btn-primary" onClick={() => {
                        setEditingId(null);
                        setFormData({ name: '', active: true, slaHours: 24, businessHours: '08:00 às 18:00', regions: '' });
                        setShowForm(true);
                    }}>
                        <Truck size={18} /> Novo Operador
                    </button>
                )}
            </div>

            {showForm && (
                <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.2rem', margin: 0 }}>{editingId ? 'Editar Operador' : 'Cadastrar Novo Operador'}</h2>
                        <button onClick={() => { setShowForm(false); setEditingId(null); }} style={{ color: 'var(--text-secondary)' }}>
                            <X size={20} />
                        </button>
                    </div>
                    <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="input-group">
                            <label className="input-label">Nome da Empresa</label>
                            <input className="input-field" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required placeholder="Ex: Logística Rápida" />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Status</label>
                            <select className="input-field" value={formData.active ? 'true' : 'false'} onChange={e => setFormData({ ...formData, active: e.target.value === 'true' })}>
                                <option value="true">Habilitado</option>
                                <option value="false">Desabilitado</option>
                            </select>
                        </div>
                        <div className="input-group">
                            <label className="input-label">SLA de Entrega (Horas)</label>
                            <input type="number" className="input-field" value={formData.slaHours} onChange={e => setFormData({ ...formData, slaHours: Number(e.target.value) })} required min="1" />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Horário Útil</label>
                            <input className="input-field" value={formData.businessHours} onChange={e => setFormData({ ...formData, businessHours: e.target.value })} required placeholder="Ex: 08:00 às 18:00" />
                        </div>
                        <div className="input-group" style={{ gridColumn: 'span 2' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                                <label className="input-label" style={{ marginBottom: 0 }}>Regiões Atendidas (UFs)</label>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const currentUfs = formData.regions ? formData.regions.split(',').filter(Boolean) : [];
                                        if (currentUfs.length === UF_OPTIONS.length) {
                                            setFormData({ ...formData, regions: '' });
                                        } else {
                                            setFormData({ ...formData, regions: UF_OPTIONS.join(',') });
                                        }
                                    }}
                                    style={{ fontSize: '0.75rem', color: 'var(--text-primary)', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 600, padding: 0, textDecoration: 'underline' }}
                                >
                                    {formData.regions && formData.regions.split(',').filter(Boolean).length === UF_OPTIONS.length ? 'Desmarcar Todas' : 'Marcar Todas'}
                                </button>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', padding: '1rem', border: '1px solid var(--border-color)' }}>
                                {UF_OPTIONS.map(uf => (
                                    <label key={uf} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer', width: '55px' }}>
                                        <input
                                            type="checkbox"
                                            checked={formData.regions.includes(uf)}
                                            onChange={e => {
                                                let ufs = formData.regions ? formData.regions.split(',').map(s => s.trim()).filter(Boolean) : [];
                                                if (e.target.checked) ufs.push(uf);
                                                else ufs = ufs.filter(s => s !== uf);
                                                setFormData({ ...formData, regions: ufs.join(',') });
                                            }}
                                            style={{ width: '16px', height: '16px', accentColor: '#000000' }}
                                        />
                                        {uf}
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                            <button type="button" className="btn-secondary" onClick={() => { setShowForm(false); setEditingId(null); }}>Cancelar</button>
                            <button type="submit" className="btn-primary">Salvar Operador</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="glass-panel">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Operador</th>
                            <th>Status</th>
                            <th>SLA (horas)</th>
                            <th>Horário Útil</th>
                            <th>Regiões Atendidas</th>
                            <th style={{ width: '100px', textAlign: 'center' }}>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ops.map((o, idx) => (
                            <tr key={idx}>
                                <td>{o.name}</td>
                                <td>
                                    <span className={`badge ${o.active ? 'badge-success' : 'badge-danger'}`}>
                                        {o.active ? 'Habilitado' : 'Desabilitado'}
                                    </span>
                                </td>
                                <td>{o.slaHours}h</td>
                                <td>{o.businessHours}</td>
                                <td>{o.regions}</td>
                                <td style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                    <button onClick={() => handleEdit(o)} style={{ color: 'var(--brand-primary)', padding: '0.2rem' }}>
                                        <Edit size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(o.id, o.name)} style={{ color: 'var(--danger)', padding: '0.2rem' }}>
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {ops.length === 0 && (
                            <tr>
                                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>
                                    Nenhum Operador cadastrado.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
