import { ExternalLink } from 'lucide-react';

export const DevSupport = () => {
    // In production, this will be served from the same host under /api-docs.
    // In local dev via Vite proxy, it will also be accessible via /api-docs.
    const swaggerUrl = '/api-docs';

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Suporte ao Desenvolvedor</h1>
                    <p className="page-subtitle">Documentação técnica e especificações da API (Swagger/OpenAPI)</p>
                </div>
                <a
                    href={swaggerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary"
                    style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <ExternalLink size={18} /> Abrir Swagger em Nova Aba
                </a>
            </div>

            <div className="glass-panel" style={{ height: 'calc(100vh - 250px)', padding: 0, overflow: 'hidden' }}>
                <iframe
                    src={swaggerUrl}
                    title="Swagger UI"
                    style={{ width: '100%', height: '100%', border: 'none' }}
                />
            </div>
        </div>
    );
};
