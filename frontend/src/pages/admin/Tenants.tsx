import { useState, useEffect } from 'react';
import api from '../../services/apiClient';
import { Plus, X, Edit, Trash2, AlertCircle } from 'lucide-react';

const SERVICE_OPTIONS = [
    { value: 'AUTO_INSTALL', label: 'Autoinstalação' },
    { value: 'REPAIR', label: 'Autotroca' },
    { value: 'ADDRESS_CHANGE', label: 'Auto Mudança de Endereço' }
];

const UF_OPTIONS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

export const Tenants: React.FC = () => {
    const [tenants, setTenants] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<{ id: string, name: string } | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        active: true,
        allowedServices: 'REPAIR',
        allowedUFs: 'SP,RJ',
        logoUrl: '' as string | null
    });

    const loadData = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/tenants');
            setTenants(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleEdit = (tenant: any) => {
        setFormData({
            name: tenant.name,
            active: tenant.active,
            allowedServices: tenant.allowedServices,
            allowedUFs: tenant.allowedUFs,
            logoUrl: tenant.logoUrl || ''
        });
        setEditingId(tenant.id);
        setShowForm(true);
    };

    const handleDelete = async () => {
        if (!confirmDelete) return;
        try {
            await api.delete(`/tenants/${confirmDelete.id}`);
            setTenants(tenants.filter(t => t.id !== confirmDelete.id));
            setConfirmDelete(null);
        } catch (error: any) {
            console.error('Error deleting tenant:', error);
            alert(error.response?.data?.error || 'Erro ao excluir tenant');
            setConfirmDelete(null);
        }
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        try {
            if (editingId) {
                await api.put(`/tenants/${editingId}`, formData);
            } else {
                await api.post('/api/tenants', formData);
            }
            setShowForm(false);
            setEditingId(null);
            setFormData({ name: '', active: true, allowedServices: 'REPAIR', allowedUFs: 'SP,RJ', logoUrl: '' });
            loadData();
        } catch (err) {
            console.error(err);
            alert('Erro ao salvar Tenant.');
        }
    };

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Tenants Habilitadas</h1>
                    <p className="page-subtitle">Gerencie as operadoras habilitadas no Autosserviço.</p>
                    <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--brand-accent)', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 500 }}>
                        <Edit size={14} /> Clique em qualquer linha para editar os dados da tenant.
                    </div>
                </div>
                {!showForm && (
                    <button className="btn-primary" onClick={() => {
                        setEditingId(null);
                        setFormData({ name: '', active: true, allowedServices: 'REPAIR', allowedUFs: 'SP,RJ', logoUrl: '' });
                        setShowForm(true);
                    }}>
                        <Plus size={18} /> Novo Tenant
                    </button>
                )}
            </div>

            {showForm && (
                <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.2rem', margin: 0 }}>{editingId ? 'Editar Tenant' : 'Cadastrar Novo Tenant'}</h2>
                        <button onClick={() => { setShowForm(false); setEditingId(null); }} style={{ color: 'var(--text-secondary)' }}>
                            <X size={20} />
                        </button>
                    </div>
                    <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="input-group">
                            <label className="input-label">Nome da Tenant</label>
                            <input className="input-field" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required placeholder="Ex: Operadora X" />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Status</label>
                            <select className="input-field" value={formData.active ? 'true' : 'false'} onChange={e => setFormData({ ...formData, active: e.target.value === 'true' })}>
                                <option value="true">Ativo</option>
                                <option value="false">Inativo</option>
                            </select>
                        </div>
                        <div className="input-group" style={{ gridColumn: 'span 2' }}>
                            <label className="input-label">Logo da Empresa (Opcional)</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                {formData.logoUrl ? (
                                    <div style={{ position: 'relative' }}>
                                        <img src={formData.logoUrl} alt="Logo preview" style={{ width: '64px', height: '64px', objectFit: 'contain', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: '#fff' }} />
                                        <button type="button" onClick={() => setFormData({ ...formData, logoUrl: '' })} style={{ position: 'absolute', top: '-8px', right: '-8px', background: 'var(--danger)', color: '#fff', borderRadius: '50%', padding: '2px' }}>
                                            <X size={12} />
                                        </button>
                                    </div>
                                ) : (
                                    <div style={{ width: '64px', height: '64px', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-accent)' }}>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Vazio</span>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="input-field"
                                    style={{ flex: 1 }}
                                    onChange={e => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            const reader = new FileReader();
                                            reader.onloadend = () => setFormData({ ...formData, logoUrl: reader.result as string });
                                            reader.readAsDataURL(file);
                                        }
                                    }}
                                />
                            </div>
                        </div>
                        <div className="input-group" style={{ gridColumn: 'span 2' }}>
                            <label className="input-label">Serviços Permitidos</label>
                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', padding: '1rem', border: '1px solid var(--border-color)' }}>
                                {SERVICE_OPTIONS.map(opt => (
                                    <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={formData.allowedServices.includes(opt.value)}
                                            onChange={e => {
                                                let services = formData.allowedServices ? formData.allowedServices.split(',').map(s => s.trim()).filter(Boolean) : [];
                                                if (e.target.checked) services.push(opt.value);
                                                else services = services.filter(s => s !== opt.value);
                                                setFormData({ ...formData, allowedServices: services.join(',') });
                                            }}
                                            style={{ width: '16px', height: '16px', accentColor: '#000000' }}
                                        />
                                        {opt.label}
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="input-group" style={{ gridColumn: 'span 2' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                                <label className="input-label" style={{ marginBottom: 0 }}>UFs Habilitadas</label>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const currentUfs = formData.allowedUFs ? formData.allowedUFs.split(',').filter(Boolean) : [];
                                        if (currentUfs.length === UF_OPTIONS.length) {
                                            setFormData({ ...formData, allowedUFs: '' });
                                        } else {
                                            setFormData({ ...formData, allowedUFs: UF_OPTIONS.join(',') });
                                        }
                                    }}
                                    style={{ fontSize: '0.75rem', color: 'var(--text-primary)', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 600, padding: 0, textDecoration: 'underline' }}
                                >
                                    {formData.allowedUFs && formData.allowedUFs.split(',').filter(Boolean).length === UF_OPTIONS.length ? 'Desmarcar Todas' : 'Marcar Todas'}
                                </button>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', padding: '1rem', border: '1px solid var(--border-color)' }}>
                                {UF_OPTIONS.map(uf => (
                                    <label key={uf} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer', width: '55px' }}>
                                        <input
                                            type="checkbox"
                                            checked={formData.allowedUFs.includes(uf)}
                                            onChange={e => {
                                                let ufs = formData.allowedUFs ? formData.allowedUFs.split(',').map(s => s.trim()).filter(Boolean) : [];
                                                if (e.target.checked) ufs.push(uf);
                                                else ufs = ufs.filter(s => s !== uf);
                                                setFormData({ ...formData, allowedUFs: ufs.join(',') });
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
                            <button type="submit" className="btn-primary">Salvar Tenant</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="glass-panel">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>Status</th>
                            <th>Serviços Permitidos</th>
                            <th>UFs Habilitadas</th>
                            <th style={{ width: '80px', textAlign: 'center' }}>Excluir</th>
                        </tr>
                    </thead>
                        {isLoading ? (
                            <tr>
                                <td colSpan={5} style={{ textAlign: 'center', padding: '4rem' }}>
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
                                            <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '1.1rem', display: 'block' }}>Configurando acessos...</span>
                                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Carregando tenants habilitadas</span>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ) : tenants.length > 0 ? (
                            tenants.map((t, idx) => (
                                <tr key={idx} onClick={() => handleEdit(t)} style={{ cursor: 'pointer' }}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            {t.logoUrl ? (
                                                <div style={{ width: '36px', height: '36px', background: '#fff', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                                    <img src={t.logoUrl} alt={t.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                                                </div>
                                            ) : (
                                                <div style={{ width: '36px', height: '36px', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-accent)', color: 'var(--text-secondary)', fontSize: '0.65rem', textAlign: 'center', lineHeight: 1 }}>
                                                    Sem<br />Logo
                                                </div>
                                            )}
                                            <span style={{ fontWeight: 500 }}>{t.name}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`badge ${t.active ? 'badge-success' : 'badge-danger'}`}>
                                            {t.active ? 'Ativo' : 'Inativo'}
                                        </span>
                                    </td>
                                    <td style={{ maxWidth: '200px', whiteSpace: 'normal', wordBreak: 'break-all', fontSize: '0.85rem' }}>{t.allowedServices}</td>
                                    <td style={{ maxWidth: '300px', whiteSpace: 'normal', wordBreak: 'break-all', fontSize: '0.85rem' }}>{t.allowedUFs}</td>
                                    <td style={{ textAlign: 'center' }}>
                                        <button onClick={(e) => { e.stopPropagation(); setConfirmDelete({ id: t.id, name: t.name }); }} style={{ color: 'var(--danger)', padding: '0.2rem' }}>
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>
                                    Nenhum Tenant cadastrado.
                                </td>
                            </tr>
                        )}
                </table>
            </div>

            {/* Custom Delete Confirmation Modal */}
            {confirmDelete && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '1rem'
                }}>
                    <div className="glass-panel" style={{ maxWidth: '400px', width: '100%', padding: '2rem', textAlign: 'center' }}>
                        <div style={{ 
                            width: '60px', 
                            height: '60px', 
                            background: 'var(--danger-light)', 
                            borderRadius: '50%', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            margin: '0 auto 1.5rem',
                            color: 'var(--danger)'
                        }}>
                            <AlertCircle size={32} />
                        </div>
                        <h3 style={{ margin: '0 0 1rem' }}>Confirmar Exclusão</h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                            Deseja realmente excluir a tenant <strong>{confirmDelete.name}</strong>? 
                            Esta ação não pode ser desfeita.
                        </p>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <button 
                                className="btn-secondary" 
                                onClick={() => setConfirmDelete(null)}
                                style={{ flex: 1 }}
                            >
                                Cancelar
                            </button>
                            <button 
                                className="btn-primary" 
                                onClick={handleDelete}
                                style={{ flex: 1, background: 'var(--danger)', borderColor: 'var(--danger)' }}
                            >
                                Excluir
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
