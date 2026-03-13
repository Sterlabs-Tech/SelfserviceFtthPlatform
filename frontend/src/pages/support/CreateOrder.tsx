import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PackagePlus, Check, Loader, Search, AlertCircle, MapPin, Phone, User, Info, Settings, Home, PlusCircle } from 'lucide-react';
import api from '../../services/apiClient';

export const CreateOrder = () => {
    const navigate = useNavigate();
    const [tenants, setTenants] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(0); // 0: Service Type, 1: Eligibility, 2: Creation
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Eligibility Search State
    const [searchForm, setSearchForm] = useState({
        tenantId: '',
        subscriberId: ''
    });

    // Eligibility Result State
    const [eligibilityResult, setEligibilityResult] = useState<any>(null);

    // Order Creation Form State
    const [orderForm, setOrderForm] = useState({
        customerName: '',
        customerAddress: '',
        customerNumber: '',
        customerComplement: '',
        customerNeighborhood: '',
        customerCity: '',
        customerState: 'SP',
        customerZip: '',
        customerPhone: '',
    });

    useEffect(() => {
        api.get('/api/tenants').then(res => setTenants(res.data)).catch(console.error);
    }, []);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setSearchForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleOrderChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setOrderForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const selectService = (type: string) => {
        if (type !== 'REPARO') return; // Only Reparo is enabled
        setStep(1);
    };

    const handleCepBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
        const cep = e.target.value.replace(/\D/g, '');
        if (cep.length !== 8) return;

        setLoading(true);
        try {
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await response.json();
            
            if (!data.erro) {
                setOrderForm(prev => ({
                    ...prev,
                    customerAddress: data.logradouro || prev.customerAddress,
                    customerNeighborhood: data.bairro || prev.customerNeighborhood,
                    customerCity: data.localidade || prev.customerCity,
                    customerState: data.uf || prev.customerState
                }));
            }
        } catch (error) {
            console.error('Erro ao buscar CEP:', error);
        } finally {
            setLoading(false);
        }
    };

    const checkEligibility = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const res = await api.post('/api/auto-repair/eligibility/repair', searchForm);
            setEligibilityResult(res.data);
            if (res.data.eligible) {
                setStep(2);
            }
        } catch (err: any) {
            console.error('Erro na elegibilidade:', err);
            setError('Erro ao verificar elegibilidade. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const payload = {
                ...searchForm,
                ...orderForm,
                source: 'PORTAL',
                openingOrigin: 'MANUAL'
            };
            await api.post('/api/orders/create', payload);
            setSuccess(true);
            setTimeout(() => navigate('/admin/support'), 2000);
        } catch (err: any) {
            console.error('Erro ao criar pedido:', err);
            setError(err.response?.data?.reason || 'Erro ao criar pedido. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1.5rem' }}>
                <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.4)' }}>
                    <Check size={40} color="#fff" />
                </div>
                <div style={{ textAlign: 'center' }}>
                    <h2 style={{ color: 'var(--text-primary)', fontSize: '1.5rem', marginBottom: '0.5rem' }}>Pedido Aberto com Sucesso!</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>Workflow logístico iniciado automaticamente.</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Nova Ordem de Serviço</h1>
                    <p className="page-subtitle">Abertura de ordens de serviço via autosserviço</p>
                </div>
            </div>

            {/* Step 0: Service Type Selection */}
            {step === 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'center', marginBottom: '1rem' }}>Selecione o tipo de serviço desejado</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                        <button 
                            onClick={() => selectService('REPARO')}
                            className="glass-panel"
                            style={{ 
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', padding: '3rem 2rem', border: 'none', cursor: 'pointer', transition: 'all 0.3s ease',
                                background: '#ffffff',
                                borderBottom: '4px solid var(--brand-primary)'
                            }}
                        >
                            <div style={{ padding: '1.25rem', background: 'rgba(250, 196, 44, 0.1)', borderRadius: '20px', color: 'var(--brand-primary)' }}>
                                <Settings size={48} />
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Reparo</h4>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Auto-troca de equipamento (ONT)</p>
                            </div>
                        </button>

                        <button 
                            disabled
                            className="glass-panel"
                            style={{ 
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', padding: '3rem 2rem', border: 'none', cursor: 'not-allowed', opacity: 0.5, transition: 'all 0.3s ease',
                                background: 'rgba(0,0,0,0.05)'
                            }}
                        >
                            <div style={{ padding: '1.25rem', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '20px', color: 'var(--text-secondary)' }}>
                                <PlusCircle size={48} />
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Instalação</h4>
                                <span style={{ fontSize: '0.7rem', fontWeight: 600, background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>Em breve</span>
                            </div>
                        </button>

                        <button 
                            disabled
                            className="glass-panel"
                            style={{ 
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', padding: '3rem 2rem', border: 'none', cursor: 'not-allowed', opacity: 0.5, transition: 'all 0.3s ease',
                                background: 'rgba(0,0,0,0.05)'
                            }}
                        >
                            <div style={{ padding: '1.25rem', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '20px', color: 'var(--text-secondary)' }}>
                                <Home size={48} />
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Mudança de Endereço</h4>
                                <span style={{ fontSize: '0.7rem', fontWeight: 600, background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>Em breve</span>
                            </div>
                        </button>
                    </div>
                </div>
            )}

            {/* Step 1: Search & Eligibility Verification (Simplified) */}
            {step === 1 && (
                <div className="glass-panel" style={{ padding: '2.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                        <div style={{ padding: '0.75rem', background: 'var(--brand-primary)', borderRadius: '12px', color: 'var(--bg-primary)' }}>
                            <Search size={24} />
                        </div>
                        <div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>Passo 1: Verificar Elegibilidade</h3>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Consulte se o assinante está apto para o serviço de autosserviço</p>
                        </div>
                    </div>

                    <form onSubmit={checkEligibility} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', alignItems: 'end' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>Parceiro (Tenant) *</label>
                            <select name="tenantId" value={searchForm.tenantId} onChange={handleSearchChange} required
                                style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.9rem' }}
                            >
                                <option value="">Selecione um tenant</option>
                                {tenants.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>Subscriber ID *</label>
                            <input name="subscriberId" value={searchForm.subscriberId} onChange={handleSearchChange} required
                                style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.9rem' }}
                                placeholder="ID do Assinante"
                            />
                        </div>

                        <div style={{ gridColumn: 'span 2', display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                            <button type="button" onClick={() => setStep(0)} className="btn-ghost" style={{ flex: 1, height: '48px' }}>
                                Voltar
                            </button>
                            <button type="submit" className="btn-primary" disabled={loading}
                                style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', height: '48px', fontSize: '1rem' }}
                            >
                                {loading ? <Loader size={18} className="spin" /> : <Search size={18} />}
                                {loading ? 'Consultando...' : 'Consultar'}
                            </button>
                        </div>
                    </form>

                    {eligibilityResult && !eligibilityResult.eligible && (
                        <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid #ef4444', borderRadius: '8px', display: 'flex', gap: '1rem' }}>
                            <AlertCircle size={24} color="#ef4444" style={{ flexShrink: 0 }} />
                            <div>
                                <h4 style={{ color: '#ef4444', fontWeight: 700, marginBottom: '0.25rem' }}>Inelegível</h4>
                                <p style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>{eligibilityResult.reason}</p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Step 2: Confirmation & Enrollment */}
            {step === 2 && eligibilityResult && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {/* Eligibility Context Summary */}
                    <div className="glass-panel" style={{ padding: '1.5rem', background: 'linear-gradient(to right, rgba(16, 185, 129, 0.1), transparent)', borderLeft: '4px solid #10b981' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div style={{ padding: '0.5rem', background: '#10b981', borderRadius: '8px', color: '#fff' }}>
                                    <Check size={20} />
                                </div>
                                <div>
                                    <h4 style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Assinante Elegível</h4>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>ID: {searchForm.subscriberId}</p>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>SLA Estimado</span>
                                <p style={{ fontSize: '1.1rem', fontWeight: 800, color: '#10b981' }}>{eligibilityResult.slaEstimationHours} horas</p>
                            </div>
                        </div>
                        
                        <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <Info size={16} color="var(--brand-primary)" />
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Operador: <strong>{eligibilityResult.designatedOperatorName}</strong></span>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <Info size={16} color="var(--brand-primary)" />
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Estoque: <strong>{eligibilityResult.compatibleOntStock} un</strong></span>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <Info size={16} color="var(--brand-primary)" />
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>ONT Atual: <strong>{eligibilityResult.customerCurrentOnt?.model}</strong></span>
                            </div>
                        </div>
                    </div>

                    {/* Order Details Form */}
                    <div className="glass-panel" style={{ padding: '2.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                            <div style={{ padding: '0.75rem', background: 'var(--brand-primary)', borderRadius: '12px', color: 'var(--bg-primary)' }}>
                                <PackagePlus size={24} />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>Passo 2: Dados da Ordem</h3>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Preencha os dados do cliente para finalizar a abertura</p>
                            </div>
                        </div>

                        {error && (
                            <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', color: '#ef4444', fontSize: '0.85rem', border: '1px solid #ef4444' }}>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmitOrder} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
                                <div>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                                        <User size={14} /> Nome Completo *
                                    </label>
                                    <input name="customerName" value={orderForm.customerName} onChange={handleOrderChange} required
                                        style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.9rem' }}
                                        placeholder="Ex: João da Silva"
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                                        <Phone size={14} /> Telefone de Contato *
                                    </label>
                                    <input name="customerPhone" value={orderForm.customerPhone} onChange={handleOrderChange} required
                                        style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.9rem' }}
                                        placeholder="(11) 98888-7777"
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr', gap: '1.5rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>CEP *</label>
                                    <input name="customerZip" value={orderForm.customerZip} onChange={handleOrderChange} onBlur={handleCepBlur} required
                                        style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.9rem' }}
                                        placeholder="00000-000"
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>Número *</label>
                                    <input name="customerNumber" value={orderForm.customerNumber} onChange={handleOrderChange} required
                                        style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.9rem' }}
                                        placeholder="123"
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>Complemento</label>
                                    <input name="customerComplement" value={orderForm.customerComplement} onChange={handleOrderChange}
                                        style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.9rem' }}
                                        placeholder="Apto 45, Bloco B"
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                                    <MapPin size={14} /> Endereço (Rua/Logradouro) *
                                </label>
                                <input name="customerAddress" value={orderForm.customerAddress} onChange={handleOrderChange} required
                                    style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.9rem' }}
                                    placeholder="Ex: Avenida Paulista"
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 0.5fr', gap: '1.5rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>Bairro *</label>
                                    <input name="customerNeighborhood" value={orderForm.customerNeighborhood} onChange={handleOrderChange} required
                                        style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.9rem' }}
                                        placeholder="Ex: Cerqueira César"
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>Cidade *</label>
                                    <input name="customerCity" value={orderForm.customerCity} onChange={handleOrderChange} required
                                        style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.9rem' }}
                                        placeholder="Ex: São Paulo"
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>UF *</label>
                                    <input name="customerState" value={orderForm.customerState} onChange={handleOrderChange} required maxLength={2}
                                        style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.9rem' }}
                                        placeholder="SP"
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button type="button" onClick={() => setStep(1)} className="btn-ghost" style={{ flex: 1, padding: '0.85rem' }}>
                                    Voltar
                                </button>
                                <button type="submit" className="btn-primary" disabled={loading}
                                    style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.85rem', fontSize: '1rem' }}
                                >
                                    {loading ? <Loader size={18} className="spin" /> : <PackagePlus size={18} />}
                                    {loading ? 'Processando...' : 'Finalizar Abertura'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
