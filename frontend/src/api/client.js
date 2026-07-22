import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor de REQUISIÇÃO: antes de cada chamada sair, anexa o token
// (se existir) no cabeçalho Authorization, sem precisar fazer isso
// manualmente em cada componente.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("medicore_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor de RESPOSTA: se a API responder 401 (não autorizado),
// significa que o token expirou ou é inválido — limpamos o login
// e forçamos a pessoa a entrar de novo.
api.interceptors.response.use(
  (resposta) => resposta,
  (erro) => {
    if (erro.response?.status === 401) {
      localStorage.removeItem("medicore_token");
      localStorage.removeItem("medicore_usuario");
      window.location.reload();
    }
    return Promise.reject(erro);
  }
);

export default api;
