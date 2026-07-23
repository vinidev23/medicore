import { useEffect, useState, useCallback } from "react";
import api from "./api/client";
import PulseLine from "./components/PulseLine";
import StatCard from "./components/StatCard";
import EquipmentTable from "./components/EquipmentTable";
import EquipmentForm from "./components/EquipmentForm";
import OrdemServicoPanel from "./components/OrdemServicoPanel";
import ChartsPanel from "./components/ChartsPanel";
import SimuladorPanel from "./components/SimuladorPanel";
import LoginPage from "./components/LoginPage";

const ABAS = [
  { id: "painel", label: "Painel" },
  { id: "equipamentos", label: "Equipamentos" },
  { id: "ordens", label: "Ordens de Serviço" },
  { id: "simulador", label: "Simulador" },
];

export default function App() {
  const [usuario, setUsuario] = useState(() => {
    const salvo = localStorage.getItem("medicore_usuario");
    return salvo ? JSON.parse(salvo) : null;
  });
  const [abaAtiva, setAbaAtiva] = useState("painel");
  const [equipamentos, setEquipamentos] = useState([]);
  const [ordens, setOrdens] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erroConexao, setErroConexao] = useState(false);

  function fazerLogout() {
    localStorage.removeItem("medicore_token");
    localStorage.removeItem("medicore_usuario");
    setUsuario(null);
  }

  const [baixandoRelatorio, setBaixandoRelatorio] = useState(false);

  async function baixarRelatorioPDF() {
    setBaixandoRelatorio(true);
    try {
      const resposta = await api.get("/relatorios/parque-tecnologico", {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([resposta.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "relatorio-parque-tecnologico.pdf");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (erro) {
      console.error("Erro ao baixar relatório", erro);
      alert("Não foi possível gerar o relatório.");
    } finally {
      setBaixandoRelatorio(false);
    }
  }

  const carregarDados = useCallback(async () => {
    try {
      const [respEquipamentos, respOrdens] = await Promise.all([
        api.get("/equipamentos"),
        api.get("/ordens-servico"),
      ]);
      setEquipamentos(respEquipamentos.data);
      setOrdens(respOrdens.data);
      setErroConexao(false);
    } catch (erro) {
      console.error("Erro ao carregar dados", erro);
      setErroConexao(true);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    if (usuario) {
      carregarDados();
    }
  }, [carregarDados, usuario]);

  const totalCorretivas = ordens.filter((os) => os.tipo === "corretiva").length;
  const totalAbertas = ordens.filter(
    (os) => os.status === "aberta" || os.status === "em_andamento"
  ).length;

  if (!usuario) {
    return <LoginPage onLoginSucesso={setUsuario} />;
  }

  return (
    <div style={{ minHeight: "100%", padding: "0 0 60px" }}>
      <header
        style={{
          borderBottom: "1px solid var(--line)",
          background: "var(--surface)",
          padding: "20px clamp(12px, 4vw, 32px) 0",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, justifyContent: "space-between", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
            <h1 style={{ fontSize: 20, letterSpacing: "-0.01em" }}>MediCore</h1>
            <span style={{ fontSize: 13, color: "var(--ink-muted)" }}>
              Engenharia Clínica · Gestão de Parque Tecnológico
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 13, color: "var(--ink-muted)" }}>{usuario.nome}</span>
            <button
              onClick={fazerLogout}
              style={{
                border: "1px solid var(--line)",
                background: "transparent",
                color: "var(--ink-muted)",
                borderRadius: "var(--radius)",
                padding: "6px 12px",
                fontSize: 13,
              }}
            >
              Sair
            </button>
          </div>
        </div>

        <PulseLine
          className="mono"
          color="var(--teal)"
          style={{ width: "100%", height: 14, margin: "12px 0 0" }}
        />

        <nav style={{ display: "flex", gap: 4, marginTop: 4, overflowX: "auto", whiteSpace: "nowrap" }}>
          {ABAS.map((aba) => (
            <button
              key={aba.id}
              onClick={() => setAbaAtiva(aba.id)}
              style={{
                border: "none",
                background: "transparent",
                padding: "10px 14px",
                fontSize: 14,
                fontWeight: 500,
                color: abaAtiva === aba.id ? "var(--teal)" : "var(--ink-muted)",
                borderBottom:
                  abaAtiva === aba.id
                    ? "2px solid var(--teal)"
                    : "2px solid transparent",
              }}
            >
              {aba.label}
            </button>
          ))}
        </nav>
      </header>

      <main style={{ maxWidth: 980, margin: "0 auto", padding: "24px clamp(12px, 4vw, 32px)" }}>
        {erroConexao && (
          <div
            style={{
              background: "var(--red-soft)",
              color: "var(--red)",
              padding: "12px 16px",
              borderRadius: "var(--radius)",
              marginBottom: 20,
              fontSize: 14,
            }}
          >
            Não foi possível conectar à API. Confirme que o servidor está rodando em{" "}
            <code>http://localhost:8000</code> (comando: <code>uvicorn app.main:app --reload</code>).
          </div>
        )}

        {carregando ? (
          <p style={{ color: "var(--ink-muted)" }}>Carregando...</p>
        ) : (
          <>
            {abaAtiva === "painel" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 12,
                  }}
                >
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <StatCard label="Equipamentos" value={equipamentos.length} tone="neutral" />
                    <StatCard label="OS Corretivas" value={totalCorretivas} tone="amber" />
                    <StatCard label="OS Em aberto" value={totalAbertas} tone="red" />
                  </div>
                  <button
                    onClick={baixarRelatorioPDF}
                    disabled={baixandoRelatorio}
                    style={{
                      border: "1px solid var(--teal)",
                      background: "transparent",
                      color: "var(--teal)",
                      borderRadius: "var(--radius)",
                      padding: "8px 14px",
                      fontSize: 13,
                      fontWeight: 600,
                      opacity: baixandoRelatorio ? 0.6 : 1,
                      alignSelf: "flex-start",
                    }}
                  >
                    {baixandoRelatorio ? "Gerando PDF..." : "⬇ Baixar relatório PDF"}
                  </button>
                </div>
                <ChartsPanel equipamentos={equipamentos} ordens={ordens} />
                <div>
                  <h3 style={{ fontSize: 16, marginBottom: 12 }}>Equipamentos cadastrados</h3>
                  <EquipmentTable equipamentos={equipamentos} onRefresh={carregarDados} />
                </div>
              </div>
            )}

            {abaAtiva === "equipamentos" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                <EquipmentForm onCriado={carregarDados} />
                <div>
                  <h3 style={{ fontSize: 16, marginBottom: 12 }}>Equipamentos cadastrados</h3>
                  <EquipmentTable equipamentos={equipamentos} onRefresh={carregarDados} />
                </div>
              </div>
            )}

            {abaAtiva === "ordens" && (
              <OrdemServicoPanel
                equipamentos={equipamentos}
                ordens={ordens}
                onRefresh={carregarDados}
              />
            )}

            {abaAtiva === "simulador" && <SimuladorPanel equipamentos={equipamentos} />}
          </>
        )}
      </main>
    </div>
  );
}
