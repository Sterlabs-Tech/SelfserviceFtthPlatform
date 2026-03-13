# Estágio 1: Build do Frontend (React/Vite)
FROM node:20-slim AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Estágio 2: Build do Backend (Node/Express/Prisma)
FROM node:20-slim
WORKDIR /app

# Instala dependências do sistema necessárias para o Prisma
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# Copia e instala dependências do backend
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm install

# Copia o código fonte do backend
COPY backend/ ./
# Gera o cliente Prisma
RUN npx prisma generate
# Compila o TypeScript do backend
RUN npx tsc

# Copia os artefatos compilados do frontend para que o backend possa servi-los estaticamente
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# Define variáveis de ambiente
ENV PORT=8080
ENV NODE_ENV=production
EXPOSE 8080

# Inicia o servidor backend a partir do código transpilado
CMD ["node", "dist/index.js"]
