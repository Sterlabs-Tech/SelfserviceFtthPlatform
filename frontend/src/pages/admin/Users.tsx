import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { UserPlus, X, Edit, Trash2, Camera } from 'lucide-react';

const PROFILE_OPTIONS = ['ADMIN', 'LOGISTICS_CONSULT', 'LOGISTICS_OPERATOR', 'DELIVERER', 'TENANT_OPERATOR', 'TENANT_MANAGER', 'CUSTOMER_SUPPORT'];

export const Users = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [tenants, setTenants] = useState<any[]>([]);
    const [ops, setOps] = useState<any[]>([]);

    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        profile: 'TENANT_OPERATOR',
        tenantId: '',
        logisticsOperatorId: '',
        photoUrl: '',
        active: true
    });

    const loadData = async () => {
        try {
            const [uRes, tRes, oRes] = await Promise.all([
                axios.get('http://localhost:3001/api/users'),
                axios.get('http://localhost:3001/api/tenants'),
                axios.get('http://localhost:3001/api/logistics')
            ]);
            setUsers(uRes.data);
            setTenants(tRes.data);
            setOps(oRes.data);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const resetForm = () => {
        setFormData({ name: '', email: '', password: '', profile: 'TENANT_OPERATOR', tenantId: '', logisticsOperatorId: '', photoUrl: '', active: true });
        setEditingId(null);
        setShowForm(false);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setFormData({ ...formData, photoUrl: reader.result as string });
            reader.readAsDataURL(file);
        }
    };

    const handleEdit = (user: any) => {
        setFormData({
            name: user.name,
            email: user.email,
            password: '', // Don't transmit old password
            profile: user.profile,
            tenantId: user.tenantId || '',
            logisticsOperatorId: user.logisticsOperatorId || '',
            photoUrl: user.photoUrl || '',
            active: user.active
        });
        setEditingId(user.id);
        setShowForm(true);
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Tem certeza que deseja remover o usuário ${name}?`)) return;
        try {
            await axios.delete(`http://localhost:3001/api/users/${id}`);
            loadData();
        } catch (err) {
            console.error(err);
            alert('Erro ao excluir usuário.');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = { ...formData };
            if (!payload.password && !editingId) {
                payload.password = '123456'; // Default fallback just in case
            }
            if (editingId && !payload.password) {
                delete (payload as any).password; // Don't update if blank on edit
            }

            // Clean associations based on profile
            if (payload.profile === 'ADMIN' || payload.profile === 'CUSTOMER_SUPPORT') {
                payload.tenantId = '';
                payload.logisticsOperatorId = '';
            } else if (payload.profile.includes('TENANT')) {
                payload.logisticsOperatorId = '';
            } else if (payload.profile.includes('LOGISTICS') || payload.profile === 'DELIVERER') {
                payload.tenantId = '';
            }

            // Treat empty strings as null for relations
            const finalPayload = {
                ...payload,
                tenantId: payload.tenantId || null,
                logisticsOperatorId: payload.logisticsOperatorId || null
            };

            if (editingId) {
                await axios.put(`http://localhost:3001/api/users/${editingId}`, finalPayload);
            } else {
                await axios.post('http://localhost:3001/api/users', finalPayload);
            }

            resetForm();
            loadData();
        } catch (err) {
            console.error(err);
            alert('Erro ao salvar usuário.');
        }
    };

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Gestão de Acessos</h1>
                    <p className="page-subtitle">Usuários e entidades autorizadas (RBAC).</p>
                </div>
                {!showForm && (
                    <button className="btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>
                        <UserPlus size={18} /> Novo Usuário
                    </button>
                )}
            </div>

            {showForm && (
                <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.2rem', margin: 0 }}>{editingId ? 'Editar Usuário' : 'Novo Usuário'}</h2>
                        <button onClick={resetForm} style={{ color: 'var(--text-secondary)', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>

                        {/* Avatar Col */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                            <div
                                style={{ width: '120px', height: '120px', borderRadius: '50%', backgroundColor: 'var(--bg-secondary)', border: '2px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', cursor: 'pointer', position: 'relative' }}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {formData.photoUrl ? (
                                    <img src={formData.photoUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--text-secondary)' }}>
                                        <Camera size={24} style={{ marginBottom: '8px' }} />
                                        <span style={{ fontSize: '0.75rem' }}>Upload Foto</span>
                                    </div>
                                )}
                            </div>
                            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" style={{ display: 'none' }} />
                            {formData.photoUrl && (
                                <button type="button" onClick={() => setFormData({ ...formData, photoUrl: '' })} style={{ fontSize: '0.8rem', color: 'var(--danger)', background: 'transparent', border: 'none', cursor: 'pointer' }}>Remover Foto</button>
                            )}

                            {editingId && (
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', fontSize: '0.9rem', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={formData.active} onChange={e => setFormData({ ...formData, active: e.target.checked })} style={{ width: '16px', height: '16px' }} />
                                    Usuário Ativo
                                </label>
                            )}
                        </div>

                        {/* Form Col */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="input-group" style={{ gridColumn: 'span 2' }}>
                                <label className="input-label">Nome Completo</label>
                                <input className="input-field" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                            </div>

                            <div className="input-group">
                                <label className="input-label">E-mail (Login)</label>
                                <input type="email" className="input-field" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
                            </div>

                            <div className="input-group">
                                <label className="input-label">Senha {editingId && <span style={{ fontSize: '0.75rem', fontWeight: 400 }}>(Mantenha branco para não alterar)</span>}</label>
                                <input type="password" className="input-field" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required={!editingId} placeholder={!editingId ? 'Mínimo 6 caracteres' : '••••••••'} />
                            </div>

                            <div className="input-group" style={{ gridColumn: 'span 2' }}>
                                <label className="input-label">Perfil de Acesso</label>
                                <select className="input-field" value={formData.profile} onChange={e => setFormData({ ...formData, profile: e.target.value, tenantId: '', logisticsOperatorId: '' })} required>
                                    {PROFILE_OPTIONS.map(p => <option key={p} value={p}>{p.replace('_', ' ')}</option>)}
                                </select>
                            </div>

                            {formData.profile.includes('TENANT') && (
                                <div className="input-group" style={{ gridColumn: 'span 2' }}>
                                    <label className="input-label">Vincular à Tenant</label>
                                    <select className="input-field" value={formData.tenantId} onChange={e => setFormData({ ...formData, tenantId: e.target.value })} required>
                                        <option value="" disabled>Selecione uma Tenant</option>
                                        {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>
                                </div>
                            )}

                            {(formData.profile.includes('LOGISTICS') || formData.profile === 'DELIVERER') && (
                                <div className="input-group" style={{ gridColumn: 'span 2' }}>
                                    <label className="input-label">Vincular a Operador Logístico</label>
                                    <select className="input-field" value={formData.logisticsOperatorId} onChange={e => setFormData({ ...formData, logisticsOperatorId: e.target.value })} required>
                                        <option value="" disabled>Selecione um Operador</option>
                                        {ops.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                                    </select>
                                </div>
                            )}

                            <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                                <button type="button" className="btn-secondary" onClick={resetForm}>Cancelar</button>
                                <button type="submit" className="btn-primary">Salvar Usuário</button>
                            </div>
                        </div>
                    </form>
                </div>
            )}

            <div className="glass-panel">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Usuário</th>
                            <th>E-mail</th>
                            <th>Perfil / Associação</th>
                            <th>Status</th>
                            <th style={{ width: '100px', textAlign: 'center' }}>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((u, idx) => (
                            <tr key={u.id || idx}>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        {u.photoUrl ? (
                                            <img src={u.photoUrl} alt="Avatar" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                                        ) : (
                                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                                                {u.name.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <strong style={{ fontWeight: 500 }}>{u.name}</strong>
                                    </div>
                                </td>
                                <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                                <td>
                                    <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{u.profile.replace('_', ' ')}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                        {u.tenant?.name || u.logisticsOperator?.name || 'V.tal (Interno)'}
                                    </div>
                                </td>
                                <td>
                                    <span className={`badge ${u.active ? 'badge-success' : 'badge-danger'}`}>
                                        {u.active ? 'Ativo' : 'Inativo'}
                                    </span>
                                </td>
                                <td style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                    <button onClick={() => handleEdit(u)} style={{ color: 'var(--brand-primary)', padding: '0.2rem', cursor: 'pointer', background: 'transparent', border: 'none' }}>
                                        <Edit size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(u.id, u.name)} style={{ color: 'var(--danger)', padding: '0.2rem', cursor: 'pointer', background: 'transparent', border: 'none' }}>
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {users.length === 0 && (
                            <tr>
                                <td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>
                                    Nenhum usuário localizado.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
