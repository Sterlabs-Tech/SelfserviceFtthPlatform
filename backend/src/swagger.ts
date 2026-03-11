import swaggerJsdoc from 'swagger-jsdoc';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Plataforma de Autosserviço V.tal API',
            version: '1.0.0',
            description: 'Documentação da API de Autosserviço para suporte técnico e integrações futuras.',
            contact: {
                name: 'Suporte Sterlabs',
            },
        },
        servers: [
            {
                url: 'http://localhost:3001',
                description: 'Servidor de Desenvolvimento Local',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
    },
    apis: ['./src/routes/*.ts', './src/index.ts'], // Caminho para os arquivos com anotações JSDoc
};

export const swaggerSpec = swaggerJsdoc(options);
