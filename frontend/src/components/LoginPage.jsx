import { useState } from "react";
import axios from "axios";
import PulseLine from "./PulseLine";
import imagem_teladelogin from "../assets/imagem_teladelogin.png"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function LoginPage({ onLoginSucesso }) {
  const [modo, setModo] = useState("login");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);

  async function entrar(evento) {
    evento.preventDefault();
    setErro(null);
    setCarregando(true);

    try {
      const corpo = new URLSearchParams();
      corpo.append("username", email);
      corpo.append("password", senha);

      const resposta = await axios.post(`${API_URL}/auth/login`, corpo, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      localStorage.setItem("medicore_token", resposta.data.access_token);
      localStorage.setItem("medicore_usuario", JSON.stringify(resposta.data.usuario));
      onLoginSucesso(resposta.data.usuario);
    } catch (e) {
      setErro(e.response?.data?.detail ?? "E-mail ou senha incorretos.");
    } finally {
      setCarregando(false);
    }
  }

  async function registrar(evento) {
    evento.preventDefault();
    setErro(null);
    setCarregando(true);

    try {
      await axios.post(`${API_URL}/auth/registrar`, {
        nome,
        email,
        senha,
      });
      await entrar(evento);
    } catch (e) {
      setErro(e.response?.data?.detail ?? "Erro ao criar conta.");
      setCarregando(false);
    }
  }

  return (
    <div className="login-page">
      <style>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          background: var(--bg);
        }

        .login-illustration {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--surface-sunken);
        }

        .login-formside {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          padding: 0 64px;
        }

        .login-card {
          width: min(360px, 90vw);
          background: var(--surface);
          border: 1px solid var(--line);
          border-radius: 0;
          padding: 28px;
        }

        /* Celular / telas estreitas: some com a ilustração e centraliza a caixa */
        @media (max-width: 768px) {
          .login-illustration {
            display: none;
          }

          .login-formside {
            flex: 1;
            justify-content: center;
            padding: 24px;
          }
        }
      `}</style>

      {/* Lado esquerdo: reservado para a ilustração/imagem animada (some no celular) */}
      <div className="login-illustration">
        {
          <img
            src={imagem_teladelogin}
            alt="Ilustração"
            style={{ maxWidth: "80%", maxHeight: "80%", objectFit: "contain" }}
          />
        }
      </div>

      {/* Lado direito: caixa de login/registro. No desktop, fica encostada à direita; no celular, centralizada */}
      <div className="login-formside">
        <div className="login-card">
          <h1 style={{ fontSize: 20, marginBottom: 2 }}>MediCore</h1>
          <p style={{ fontSize: 13, color: "var(--ink-muted)", marginTop: 0 }}>
            Engenharia Clínica · Gestão de Parque Tecnológico
          </p>

          <PulseLine color="var(--teal)" style={{ width: "100%", height: 12, margin: "12px 0 20px" }} />

          <form
            onSubmit={modo === "login" ? entrar : registrar}
            style={{ display: "flex", flexDirection: "column", gap: 12 }}
          >
            {modo === "registrar" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 12, color: "var(--ink-muted)" }}>Nome</label>
                <input required value={nome} onChange={(e) => setNome(e.target.value)} />
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 12, color: "var(--ink-muted)" }}>E-mail</label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 12, color: "var(--ink-muted)" }}>Senha</label>
              <input
                required
                type="password"
                minLength={6}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
            </div>

            {erro && <div style={{ color: "var(--red)", fontSize: 13 }}>{erro}</div>}

            <button
              type="submit"
              disabled={carregando}
              style={{
                background: "var(--teal)",
                color: "#fff",
                border: "none",
                borderRadius: "var(--radius)",
                padding: "10px 16px",
                fontWeight: 600,
                opacity: carregando ? 0.6 : 1,
                marginTop: 4,
              }}
            >
              {carregando
                ? "Aguarde..."
                : modo === "login"
                ? "Entrar"
                : "Criar conta e entrar"}
            </button>
          </form>

          <button
            onClick={() => {
              setErro(null);
              setModo(modo === "login" ? "registrar" : "login");
            }}
            style={{
              background: "none",
              border: "none",
              color: "var(--ink-muted)",
              fontSize: 13,
              marginTop: 14,
              textDecoration: "underline",
            }}
          >
            {modo === "login" ? "Não tem conta? Criar uma agora" : "Já tenho conta, entrar"}
          </button>
        </div>
      </div>
    </div>
  );
}
