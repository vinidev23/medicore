import { useState } from "react";
import api from "../api/client";

const TIPO_OPCOES = [
  { value: "corretiva", label: "Corretiva" },
  { value: "preventiva", label: "Preventiva" },
  { value: "calibracao", label: "Calibração" },
];

const STATUS_LABELS = {
  aberta: { label: "Aberta", tone: "amber" },
  em_andamento: { label: "Em andamento", tone: "teal" },
  concluida: { label: "Concluída", tone: "neutral" },
  cancelada: { label: "Cancelada", tone: "red" },
};

const TONE_COLORS = {
  red: { bg: "var(--red-soft)", fg: "var(--red)" },
  amber: { bg: "var(--amber-soft)", fg: "var(--amber)" },
  teal: { bg: "var(--teal-soft)", fg: "var(--teal)" },
  neutral: { bg: "var(--surface-sunken)", fg: "var(--ink-muted)" },
};

function StatusBadge({ status }) {
  const config = STATUS_LABELS[status] ?? STATUS_LABELS.aberta;
  const colors = TONE_COLORS[config.tone];
  return (
    <span
      className="mono"
      style={{
        fontSize: 11,
        fontWeight: 600,
        textTransform: "uppercase",
        padding: "4px 8px",
        borderRadius: 4,
        background: colors.bg,
        color: colors.fg,
      }}
    >
      {config.label}
    </span>
  );
}

export default function OrdemServicoPanel({ equipamentos, ordens, onRefresh }) {
  const [form, setForm] = useState({
    equipamento_id: "",
    tipo: "corretiva",
    descricao_problema: "",
    tecnico_responsavel: "",
    custo: "",
  });
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState(null);

  function nomeEquipamento(id) {
    return equipamentos.find((eq) => eq.id === id)?.nome ?? `Equipamento #${id}`;
  }

  async function abrirOS(evento) {
    evento.preventDefault();
    setErro(null);

    if (!form.equipamento_id) {
      setErro("Selecione um equipamento.");
      return;
    }

    setEnviando(true);
    try {
      await api.post("/ordens-servico", {
        ...form,
        equipamento_id: Number(form.equipamento_id),
        custo: form.custo ? Number(form.custo) : null,
      });
      setForm({
        equipamento_id: "",
        tipo: "corretiva",
        descricao_problema: "",
        tecnico_responsavel: "",
        custo: "",
      });
      onRefresh();
    } catch (e) {
      setErro(e.response?.data?.detail ?? "Erro ao abrir ordem de serviço.");
    } finally {
      setEnviando(false);
    }
  }

  async function mudarStatus(osId, novoStatus) {
    try {
      await api.patch(`/ordens-servico/${osId}`, { status: novoStatus });
      onRefresh();
    } catch (e) {
      alert("Não foi possível atualizar o status.");
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <form
        onSubmit={abrirOS}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          background: "var(--surface)",
          border: "1px solid var(--line)",
          borderRadius: "var(--radius)",
          padding: 20,
        }}
      >
        <h3 style={{ fontSize: 16 }}>Abrir ordem de serviço</h3>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 12, color: "var(--ink-muted)" }}>Equipamento *</label>
            <select
              required
              value={form.equipamento_id}
              onChange={(e) => setForm((f) => ({ ...f, equipamento_id: e.target.value }))}
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
            <label style={{ fontSize: 12, color: "var(--ink-muted)" }}>Tipo *</label>
            <select
              value={form.tipo}
              onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))}
            >
              {TIPO_OPCOES.map((opcao) => (
                <option key={opcao.value} value={opcao.value}>
                  {opcao.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontSize: 12, color: "var(--ink-muted)" }}>
            Descrição do problema
          </label>
          <textarea
            rows={2}
            value={form.descricao_problema}
            onChange={(e) => setForm((f) => ({ ...f, descricao_problema: e.target.value }))}
            placeholder="Ex: Equipamento apresentando erro E04 intermitente"
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontSize: 12, color: "var(--ink-muted)" }}>
            Técnico responsável
          </label>
          <input
            value={form.tecnico_responsavel}
            onChange={(e) => setForm((f) => ({ ...f, tecnico_responsavel: e.target.value }))}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontSize: 12, color: "var(--ink-muted)" }}>
            Custo (R$) — se já souber
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={form.custo}
            onChange={(e) => setForm((f) => ({ ...f, custo: e.target.value }))}
            placeholder="Ex: 350.00"
          />
        </div>

        {erro && <div style={{ color: "var(--red)", fontSize: 13 }}>{erro}</div>}

        <button
          type="submit"
          disabled={enviando}
          style={{
            alignSelf: "flex-start",
            background: "var(--teal)",
            color: "#fff",
            border: "none",
            borderRadius: "var(--radius)",
            padding: "10px 18px",
            fontWeight: 600,
            opacity: enviando ? 0.6 : 1,
          }}
        >
          {enviando ? "Abrindo..." : "Abrir OS"}
        </button>
      </form>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <h3 style={{ fontSize: 16 }}>Ordens de serviço recentes</h3>

        {ordens.length === 0 && (
          <div style={{ color: "var(--ink-muted)", fontSize: 14 }}>
            Nenhuma ordem de serviço registrada ainda.
          </div>
        )}

        {ordens.map((os) => (
          <div
            key={os.id}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              border: "1px solid var(--line)",
              borderRadius: "var(--radius)",
              background: "var(--surface)",
              padding: "10px 16px",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontWeight: 500 }}>{nomeEquipamento(os.equipamento_id)}</span>
                <StatusBadge status={os.status} />
                <span className="mono" style={{ fontSize: 11, color: "var(--ink-muted)" }}>
                  {os.tipo}
                </span>
              </div>
              {os.descricao_problema && (
                <div style={{ fontSize: 13, color: "var(--ink-muted)" }}>
                  {os.descricao_problema}
                </div>
              )}
            </div>

            {(os.status === "aberta" || os.status === "em_andamento") && (
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                {os.status === "aberta" && (
                  <button
                    onClick={() => mudarStatus(os.id, "em_andamento")}
                    style={{
                      border: "1px solid var(--teal)",
                      background: "transparent",
                      color: "var(--teal)",
                      borderRadius: "var(--radius)",
                      padding: "5px 10px",
                      fontSize: 12,
                    }}
                  >
                    Iniciar
                  </button>
                )}
                <button
                  onClick={() => mudarStatus(os.id, "concluida")}
                  style={{
                    border: "1px solid var(--line)",
                    background: "var(--ink)",
                    color: "#fff",
                    borderRadius: "var(--radius)",
                    padding: "5px 10px",
                    fontSize: 12,
                  }}
                >
                  Concluir
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
