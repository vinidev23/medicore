import { useEffect, useState, useCallback } from "react";
import api from "./api/client";
import PulseLine from "./components/PulseLine";
import StatCard from "./components/StatCard";
import EquipmentTable from "./components/EquipmentTable";
import EquipmentForm from "./components/EquipmentForm";
import OrdemServicoPanel from "./components/OrdemServicoPanel";
import ChartsPanel from "./components/ChartsPanel";
import SimuladorPanel from "./components/SimuladorPanel";

const ABAS = [
  { id: "painel", label: "Painel" },
  { id: "equipamentos", label: "Equipamentos" },
  { id: "ordens", label: "Ordens de Serviço" },
  { id: "simulador", label: "Simulador" },
];

export default function App() {
  const [abaAtiva, setAbaAtiva] = useState("painel");
  const [equipamentos, setEquipamentos] = useState([]);
  const [ordens, setOrdens] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erroConexao, setErroConexao] = useState(false);

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
    carregarDados();
  }, [carregarDados]);

  const totalCorretivas = ordens.filter((os) => os.tipo === "corretiva").length;
  const totalAbertas = ordens.filter(
    (os) => os.status === "aberta" || os.status === "em_andamento"
  ).length;

  return (
    <div style={{ minHeight: "100%", padding: "0 0 60px" }}>
      <header
        style={{
          borderBottom: "1px solid var(--line)",
          background: "var(--surface)",
          padding: "20px 32px 0",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <h1 style={{ fontSize: 20, letterSpacing: "-0.01em" }}>MediCore</h1>
          <span style={{ fontSize: 13, color: "var(--ink-muted)" }}>
            Engenharia Clínica · Gestão de Parque Tecnológico
          </span>
        </div>

        <PulseLine
          className="mono"
          color="var(--teal)"
          style={{ width: "100%", height: 14, margin: "12px 0 0" }}
        />

        <nav style={{ display: "flex", gap: 4, marginTop: 4 }}>
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

      <main style={{ maxWidth: 980, margin: "0 auto", padding: "24px 32px" }}>
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
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <StatCard label="Equipamentos" value={equipamentos.length} tone="neutral" />
                  <StatCard label="OS Corretivas" value={totalCorretivas} tone="amber" />
                  <StatCard label="OS Em aberto" value={totalAbertas} tone="red" />
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
