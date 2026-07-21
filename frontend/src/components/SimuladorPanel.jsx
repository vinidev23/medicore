import { useState } from "react";
import api from "../api/client";
import StatCard from "./StatCard";

const RECOMENDACAO_CONFIG = {
  substituir: {
    titulo: "Substituição tende a compensar",
    tone: "red",
  },
  manter: {
    titulo: "Manter o equipamento tende a compensar",
    tone: "teal",
  },
  dados_insuficientes: {
    titulo: "Dados insuficientes para uma recomendação confiável",
    tone: "amber",
  },
};

export default function SimuladorPanel({ equipamentos }) {
  const [equipamentoId, setEquipamentoId] = useState("");
  const [valorNovo, setValorNovo] = useState("");
  const [vidaUtil, setVidaUtil] = useState("");
  const [mesesHistorico, setMesesHistorico] = useState("12");
  const [resultado, setResultado] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);

  async function rodarSimulacao(evento) {
    evento.preventDefault();
    setErro(null);
    setResultado(null);

    if (!equipamentoId) {
      setErro("Selecione um equipamento.");
      return;
    }

    setCarregando(true);
    try {
      const resposta = await api.post(`/equipamentos/${equipamentoId}/simulacao`, {
        valor_equipamento_novo: Number(valorNovo),
        vida_util_estimada_anos: Number(vidaUtil),
        meses_historico: Number(mesesHistorico),
      });
      setResultado(resposta.data);
    } catch (e) {
      setErro(e.response?.data?.detail ?? "Erro ao rodar a simulação.");
    } finally {
      setCarregando(false);
    }
  }

  const config = resultado ? RECOMENDACAO_CONFIG[resultado.recomendacao] : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--line)",
          borderRadius: "var(--radius)",
          padding: 20,
        }}
      >
        <h3 style={{ fontSize: 16, marginBottom: 4 }}>Simulador: trocar vs. manter</h3>
        <p style={{ fontSize: 13, color: "var(--ink-muted)", marginTop: 0, marginBottom: 16 }}>
          Compara o custo projetado de manter o equipamento com o custo anualizado de
          substituí-lo por um novo. Use como apoio à decisão, não como veredito absoluto —
          fatores como valor de revenda e custo de parada operacional não entram na conta.
        </p>

        <form
          onSubmit={rodarSimulacao}
          style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 12 }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 12, color: "var(--ink-muted)" }}>Equipamento *</label>
            <select
              required
              value={equipamentoId}
              onChange={(e) => setEquipamentoId(e.target.value)}
            >
              <option value="">Selecione...</option>
              {equipamentos.map((eq) => (
                <option key={eq.id} value={eq.id}>
                  {eq.nome} (#{eq.numero_patrimonio})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 12, color: "var(--ink-muted)" }}>
              Valor de um novo (R$) *
            </label>
            <input
              required
              type="number"
              step="0.01"
              min="0"
              value={valorNovo}
              onChange={(e) => setValorNovo(e.target.value)}
              placeholder="Ex: 25000"
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 12, color: "var(--ink-muted)" }}>
              Vida útil estimada (anos) *
            </label>
            <input
              required
              type="number"
              step="0.5"
              min="0.5"
              value={vidaUtil}
              onChange={(e) => setVidaUtil(e.target.value)}
              placeholder="Ex: 8"
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 12, color: "var(--ink-muted)" }}>
              Histórico a considerar (meses)
            </label>
            <input
              type="number"
              min="1"
              value={mesesHistorico}
              onChange={(e) => setMesesHistorico(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={carregando}
            style={{
              gridColumn: "1 / -1",
              justifySelf: "start",
              background: "var(--teal)",
              color: "#fff",
              border: "none",
              borderRadius: "var(--radius)",
              padding: "10px 18px",
              fontWeight: 600,
              opacity: carregando ? 0.6 : 1,
            }}
          >
            {carregando ? "Calculando..." : "Simular"}
          </button>
        </form>

        {erro && <div style={{ color: "var(--red)", fontSize: 13, marginTop: 12 }}>{erro}</div>}
      </div>

      {resultado && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              padding: "14px 18px",
              borderRadius: "var(--radius)",
              background:
                config.tone === "red"
                  ? "var(--red-soft)"
                  : config.tone === "teal"
                  ? "var(--teal-soft)"
                  : "var(--amber-soft)",
              color:
                config.tone === "red"
                  ? "var(--red)"
                  : config.tone === "teal"
                  ? "var(--teal)"
                  : "var(--amber)",
              fontWeight: 600,
              fontSize: 15,
            }}
          >
            {config.titulo}
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <StatCard
              label={`Custo méd. mensal (${resultado.meses_analisados}m)`}
              value={resultado.custo_medio_mensal}
              unit="R$"
              tone="neutral"
            />
            <StatCard
              label="Projeção manter 12m"
              value={resultado.projecao_manter_12_meses}
              unit="R$"
              tone="amber"
            />
            <StatCard
              label="Custo anualizado substituir"
              value={resultado.custo_anualizado_substituir}
              unit="R$"
              tone="teal"
            />
            <StatCard
              label="% do valor original já gasto"
              value={resultado.percentual_do_valor_original_gasto}
              unit="%"
              tone="red"
            />
          </div>

          <div style={{ fontSize: 13, color: "var(--ink-muted)" }}>
            {resultado.quantidade_os_no_periodo} ordem(ns) de serviço com custo registrado
            no período analisado, totalizando{" "}
            <span className="mono">R$ {resultado.custo_total_periodo}</span>.
            {resultado.recomendacao === "dados_insuficientes" &&
              " Registre custos nas ordens de serviço corretivas para uma simulação mais precisa."}
          </div>
        </div>
      )}
    </div>
  );
}
