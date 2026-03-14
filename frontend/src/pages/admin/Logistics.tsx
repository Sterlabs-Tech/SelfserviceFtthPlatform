import { useState, useEffect } from 'react';
import api from '../../services/apiClient';
import { Truck, X, MapPin, Eye } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';



export const Logistics = () => {
    const navigate = useNavigate();
    const [ops, setOps] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        active: true,
        slaHours: 24,
        businessStart: '08:00',
        businessEnd: '18:00',
        workSaturdays: false,
        workSundays: false,
        workHolidays: false,
        regions: '',
        zipCode: '',
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: ''
    });
    const [municipalities, setMunicipalities] = useState<string[]>([]);
    const [isLoadingMuni, setIsLoadingMuni] = useState(false);

    const emptyForm = {
        name: '', active: true, slaHours: 24, 
        businessStart: '08:00', businessEnd: '18:00',
        workSaturdays: false, workSundays: false, workHolidays: false,
        regions: '',
        zipCode: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: ''
    };

    const loadData = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/api/logistics');
            setOps(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchMunicipalities = async (uf: string) => {
        if (!uf || uf.length !== 2) return;
        setIsLoadingMuni(true);
        try {
            const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`);
            const data = await response.json();
            setMunicipalities(data.map((m: any) => m.nome).sort());
        } catch (err) {
            console.error('Erro ao buscar municípios:', err);
        } finally {
            setIsLoadingMuni(false);
        }
    };

    const [searchParams, setSearchParams] = useSearchParams();

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        const editId = searchParams.get('edit');
        if (editId && ops.length > 0) {
            const opToEdit = ops.find(o => o.id === editId);
            if (opToEdit) {
                setEditingId(editId);
                setFormData({
                    ...opToEdit,
                    slaHours: opToEdit.slaHours || 24,
                    active: Boolean(opToEdit.active)
                });
                setShowForm(true);
                // Clear the param after handling it
                setSearchParams({}, { replace: true });
            }
        }
    }, [searchParams, ops]);

    useEffect(() => {
        if (showForm && formData.state && formData.state.length === 2) {
            fetchMunicipalities(formData.state);
        }
    }, [formData.state, showForm]);

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
            loadData();
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
                            <label className="input-label">Horário de Funcionamento</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <input type="time" className="input-field" value={formData.businessStart} onChange={e => setFormData({ ...formData, businessStart: e.target.value })} required />
                                <span style={{ color: 'var(--text-secondary)' }}>até</span>
                                <input type="time" className="input-field" value={formData.businessEnd} onChange={e => setFormData({ ...formData, businessEnd: e.target.value })} required />
                            </div>
                        </div>

                        {/* Working Days Flags */}
                        <div className="input-group" style={{ gridColumn: 'span 2' }}>
                            <label className="input-label">Dias de Funcionamento</label>
                            <div style={{ display: 'flex', gap: '2rem', background: 'var(--bg-primary)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={formData.workSaturdays} onChange={e => setFormData({ ...formData, workSaturdays: e.target.checked })} /> Sábados
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={formData.workSundays} onChange={e => setFormData({ ...formData, workSundays: e.target.checked })} /> Domingos
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={formData.workHolidays} onChange={e => setFormData({ ...formData, workHolidays: e.target.checked })} /> Feriados
                                </label>
                            </div>
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

                        {/* Regions (Municipalities) */}
                        <div className="input-group" style={{ gridColumn: 'span 2' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                                <label className="input-label" style={{ marginBottom: 0 }}>
                                    Municípios Atendidos (UF: {formData.state || '-'})
                                </label>
                                {municipalities.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const currentMunis = formData.regions ? formData.regions.split(',').filter(Boolean) : [];
                                            if (currentMunis.length === municipalities.length) {
                                                setFormData({ ...formData, regions: '' });
                                            } else {
                                                setFormData({ ...formData, regions: municipalities.join(',') });
                                            }
                                        }}
                                        style={{ fontSize: '0.75rem', color: 'var(--text-primary)', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 600, padding: 0, textDecoration: 'underline' }}
                                    >
                                        {formData.regions && formData.regions.split(',').filter(Boolean).length === municipalities.length ? 'Desmarcar Todos' : 'Marcar Todos'}
                                    </button>
                                )}
                            </div>
                            
                            {!formData.state ? (
                                <div style={{ padding: '1rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                    Informe o CEP para carregar a UF e os municípios disponíveis.
                                </div>
                            ) : isLoadingMuni ? (
                                <div style={{ padding: '1rem', textAlign: 'center' }}>Carregando municípios...</div>
                            ) : (
                                <div style={{ 
                                    display: 'grid', 
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', 
                                    gap: '0.5rem', 
                                    background: 'var(--bg-primary)', 
                                    borderRadius: 'var(--radius-md)', 
                                    padding: '1rem', 
                                    border: '1px solid var(--border-color)',
                                    maxHeight: '200px',
                                    overflowY: 'auto'
                                }}>
                                    {municipalities.map(muni => (
                                        <label key={muni} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                checked={formData.regions.split(',').includes(muni)}
                                                onChange={e => {
                                                    let munis = formData.regions ? formData.regions.split(',').map(s => s.trim()).filter(Boolean) : [];
                                                    if (e.target.checked) munis.push(muni);
                                                    else munis = munis.filter(s => s !== muni);
                                                    setFormData({ ...formData, regions: munis.join(',') });
                                                }}
                                                style={{ width: '14px', height: '14px', accentColor: '#000000' }}
                                            />
                                            {muni}
                                        </label>
                                    ))}
                                </div>
                            )}
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
                            <th>SLA</th>
                            <th>UF</th>
                            <th>Municípios Atendidos</th>
                            <th style={{ width: '100px', textAlign: 'center' }}>Detalhes</th>
                        </tr>
                    </thead>
                    <tbody>
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
                                            <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '1.1rem', display: 'block' }}>Localizando parceiros...</span>
                                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Carregando malha logística</span>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ) : ops.length > 0 ? (
                            ops.map((o, idx) => (
                                <tr key={idx}>
                                    <td>{o.name}</td>
                                    <td>
                                        <span className={`badge ${o.active ? 'badge-success' : 'badge-danger'}`}>
                                            {o.active ? 'Habilitado' : 'Desabilitado'}
                                        </span>
                                    </td>
                                    <td>{o.slaHours}h</td>
                                    <td>{o.state || '-'}</td>
                                    <td>
                                        <div style={{ maxHeight: '120px', overflowY: 'auto', padding: '0.5rem 0' }}>
                                            <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                {o.regions ? o.regions.split(',').map((m: string, i: number) => (
                                                    <li key={i} style={{ marginBottom: '2px' }}>{m.trim()}</li>
                                                )) : <li>Nenhum município</li>}
                                            </ul>
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                                        <button 
                                            onClick={() => navigate(`/admin/logistics/${o.id}`)} 
                                            style={{ color: 'var(--brand-primary)', padding: '0.4rem', background: 'rgba(255, 217, 25, 0.1)', borderRadius: '8px', display: 'inline-flex' }} 
                                            title="Visualizar Detalhes"
                                        >
                                            <Eye size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
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
