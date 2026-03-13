import { useState, useEffect } from 'react';
import api from '../../services/apiClient';
import { Truck, X, Edit, Trash2, MapPin } from 'lucide-react';

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
        regions: '',
        zipCode: '',
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: ''
    });

    const emptyForm = {
        name: '', active: true, slaHours: 24, businessHours: '08:00 às 18:00', regions: '',
        zipCode: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: ''
    };

    const loadOps = () => {
        api.get('/api/logistics').then(res => setOps(res.data)).catch(e => console.error(e));
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
            regions: op.regions,
            zipCode: op.zipCode || '',
            street: op.street || '',
            number: op.number || '',
            complement: op.complement || '',
            neighborhood: op.neighborhood || '',
            city: op.city || '',
            state: op.state || ''
        });
        setEditingId(op.id);
        setShowForm(true);
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Tem certeza que deseja excluir o operador ${name}?`)) return;
        try {
            await api.delete(`/api/logistics/${id}`);
            loadOps();
        } catch (err) {
            console.error(err);
            alert('Erro ao excluir operador logístico.');
        }
    };

    const handleCepBlur = async () => {
        const cep = formData.zipCode.replace(/\D/g, '');
        if (cep.length !== 8) return;
        try {
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await response.json();
            if (!data.erro) {
                setFormData(prev => ({
                    ...prev,
                    street: data.logradouro || prev.street,
                    neighborhood: data.bairro || prev.neighborhood,
                    city: data.localidade || prev.city,
                    state: data.uf || prev.state
                }));
            }
        } catch (err) {
            console.error('Erro ao consultar CEP:', err);
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
                await api.put(`/api/logistics/${editingId}`, payload);
            } else {
                await api.post('/api/logistics', payload);
            }

            setShowForm(false);
            setEditingId(null);
            setFormData(emptyForm);
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
                        setFormData(emptyForm);
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
                        {/* Basic Info */}
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

                        {/* Address Section */}
                        <div style={{ gridColumn: 'span 2', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                                <MapPin size={18} style={{ color: 'var(--brand-primary)' }} />
                                <h3 style={{ fontSize: '1rem', margin: 0, fontWeight: 600 }}>Endereço do Estoque Regional</h3>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '180px 120px 1fr', gap: '1rem' }}>
                                <div className="input-group">
                                    <label className="input-label">CEP</label>
                                    <input
                                        className="input-field"
                                        value={formData.zipCode}
                                        onChange={e => setFormData({ ...formData, zipCode: e.target.value })}
                                        onBlur={handleCepBlur}
                                        placeholder="00000-000"
                                        maxLength={9}
                                        style={{ background: 'var(--brand-primary-light)', fontWeight: 600 }}
                                    />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Número</label>
                                    <input className="input-field" value={formData.number} onChange={e => setFormData({ ...formData, number: e.target.value })} placeholder="Nº" />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Complemento</label>
                                    <input className="input-field" value={formData.complement} onChange={e => setFormData({ ...formData, complement: e.target.value })} placeholder="Sala, Galpão, etc." />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginTop: '1rem' }}>
                                <div className="input-group">
                                    <label className="input-label">Rua / Logradouro</label>
                                    <input className="input-field" value={formData.street} onChange={e => setFormData({ ...formData, street: e.target.value })} placeholder="Preenchido automaticamente pelo CEP" />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px', gap: '1rem', marginTop: '1rem' }}>
                                <div className="input-group">
                                    <label className="input-label">Bairro</label>
                                    <input className="input-field" value={formData.neighborhood} onChange={e => setFormData({ ...formData, neighborhood: e.target.value })} placeholder="Bairro" />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Cidade</label>
                                    <input className="input-field" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} placeholder="Cidade" />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">UF</label>
                                    <input className="input-field" value={formData.state} onChange={e => setFormData({ ...formData, state: e.target.value })} placeholder="UF" maxLength={2} />
                                </div>
                            </div>
                        </div>

                        {/* Regions */}
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

                        {/* Buttons */}
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
                            <th>Endereço</th>
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
                                <td style={{ fontSize: '0.8rem', maxWidth: '200px' }}>
                                    {o.city && o.state ? `${o.city}/${o.state}` : '-'}
                                </td>
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
                                <td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>
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
