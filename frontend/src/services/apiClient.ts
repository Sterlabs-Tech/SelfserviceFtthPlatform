import axios from 'axios';

// Em produção (Vite/Cloud Run), a API está no mesmo host. Em dev local, pode estar em outra porta.
// A configuração do Vite agora lida com o proxy local, mas no Cloud Run, os caminhos relativos puros
// são a melhor prática. Centralizar a instância permite adicionar interceptors depois.

const api = axios.create({
  baseURL: import.meta.env.PROD ? '' : '', // O fallback é '/' relativo, mas o Vite proxy lidará com '/api'
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

export default api;
