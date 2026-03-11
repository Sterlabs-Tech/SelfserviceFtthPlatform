# Estágio 1: Build do Frontend (React/Vite)
FROM node:20 AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Estágio 2: Build do Backend (Node/Express/Prisma)
FROM node:20
WORKDIR /app

# Copia e instala dependências do backend
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm install

# Copia o código fonte do backend e o banco SQLite
COPY backend/ ./
# Gera o cliente Prisma
RUN npx prisma generate

# Copia os artefatos compilados do frontend para que o backend possa servi-los estaticamente
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# Expõe a porta que o Cloud Run exige
ENV PORT=8080
ENV NODE_ENV=production
EXPOSE 8080

# Inicia o servidor backend
CMD ["npx", "tsx", "src/index.ts"]
