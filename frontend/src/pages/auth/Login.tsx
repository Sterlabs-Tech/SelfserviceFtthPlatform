import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { getHomeRoute } from '../../components/ProtectedRoute';

export const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const userData = await login(email.trim(), password.trim());
            navigate(getHomeRoute(userData?.profile || 'ADMIN'));
        } catch (err: any) {
            setError(err.response?.data?.error || 'Erro ao fazer login.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ 
            height: '100vh', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            background: 'var(--bg-primary)',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Subtle background decoration similar to layout */}
            <div style={{
                position: 'absolute',
                top: '-10%',
                left: '-5%',
                width: '40vw',
                height: '40vw',
                background: 'radial-gradient(circle, rgba(230,22,125,0.05) 0%, rgba(0,0,0,0) 70%)',
                borderRadius: '50%',
                zIndex: 0
            }}></div>
            
            <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem', zIndex: 1 }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <img src="/vtal-logo.png" alt="V.tal Logo" style={{ height: '48px', marginBottom: '1rem' }} />
                    <h1 style={{ fontSize: '1.5rem', margin: 0, color: 'var(--text-primary)' }}>Acesso Restrito</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>Entre com suas credenciais do Autosserviço.</p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div className="input-group" style={{ marginBottom: 0 }}>
                        <label className="input-label">E-mail Corporativo</label>
                        <input
                            type="email"
                            className="input-field"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="seu.nome@vtal.com"
                            required
                            autoFocus
                        />
                    </div>

                    <div className="input-group" style={{ marginBottom: 0 }}>
                        <label className="input-label">Senha</label>
                        <input
                            type="password"
                            className="input-field"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    {error && (
                        <div style={{ color: 'var(--danger)', fontSize: '0.9rem', textAlign: 'center', background: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: '4px' }}>
                            {error}
                        </div>
                    )}

                    <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }} disabled={loading}>
                        {loading ? 'Autenticando...' : <><LogIn size={18} /> Entrar</>}
                    </button>
                    <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                        <a href="#" style={{ color: 'var(--brand-primary)', fontSize: '0.85rem', textDecoration: 'none' }}>Esqueceu a senha?</a>
                    </div>
                </form>
            </div>
        </div>
    );
};
