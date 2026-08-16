import { useState } from "react";
import api from "../api/client";
import StatCard from "./StatCard";

function formatarData(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Sugestão padrão: prazo de devolução em datetime-local, 4 horas a partir de agora
function prazoPadrao() {
  const data = new Date(Date.now() + 4 * 60 * 60 * 1000);
  data.setSeconds(0, 0);
  const offset = data.getTimezoneOffset();
  const local = new Date(data.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

function EmprestimoBadge({ emprestimo }) {
  let label = "Devolvido";
  let tone = "neutral";

  if (emprestimo.status === "em_andamento") {
    if (emprestimo.atrasado) {
      label = "Devolução atrasada";
      tone = "red";
    } else {
      label = "Em andamento";
      tone = "teal";
    }
  }

  const TONE_COLORS = {
    red: { bg: "var(--red-soft)", fg: "var(--red)" },
    teal: { bg: "var(--teal-soft)", fg: "var(--teal)" },
    neutral: { bg: "var(--surface-sunken)", fg: "var(--ink-muted)" },
  };
  const colors = TONE_COLORS[tone];

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
      {label}
    </span>
  );
}

export default function EmprestimosPanel({ equipamentos, emprestimos, onRefresh }) {
  const [form, setForm] = useState({
    equipamento_id: "",
    setor_destino: "",
    solicitante: "",
    responsavel_transporte: "",
    motivo: "",
    data_prevista_devolucao: prazoPadrao(),
  });
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState(null);

  const [devolvendoId, setDevolvendoId] = useState(null);
  const [observacaoDevolucao, setObservacaoDevolucao] = useState("");
  const [enviandoDevolucao, setEnviandoDevolucao] = useState(false);

  function nomeEquipamento(id) {
    return equipamentos.find((eq) => eq.id === id)?.nome ?? `Equipamento #${id}`;
  }

  // Só oferece no formulário os equipamentos que não estão emprestados no momento
  const equipamentosDisponiveis = equipamentos.filter((eq) => !eq.emprestado_atualmente);

  const emprestimosAtivos = emprestimos.filter((e) => e.status === "em_andamento");
  const emprestimosAtrasados = emprestimosAtivos.filter((e) => e.atrasado);
  const emprestimosHistorico = emprestimos.filter((e) => e.status === "devolvido");

  async function registrarEmprestimo(evento) {
    evento.preventDefault();
    setErro(null);

    if (!form.equipamento_id || !form.setor_destino.trim() || !form.solicitante.trim()) {
      setErro("Preencha equipamento, setor de destino e solicitante.");
      return;
    }

    setEnviando(true);
    try {
      await api.post("/emprestimos", {
        equipamento_id: Number(form.equipamento_id),
        setor_destino: form.setor_destino.trim(),
        solicitante: form.solicitante.trim(),
        responsavel_transporte: form.responsavel_transporte.trim() || null,
        motivo: form.motivo.trim() || null,
        data_prevista_devolucao: new Date(form.data_prevista_devolucao).toISOString(),
      });
      setForm({
        equipamento_id: "",
        setor_destino: "",
        solicitante: "",
        responsavel_transporte: "",
        motivo: "",
        data_prevista_devolucao: prazoPadrao(),
      });
      onRefresh();
    } catch (e) {
      setErro(e.response?.data?.detail ?? "Erro ao registrar o empréstimo.");
    } finally {
      setEnviando(false);
    }
  }

  function abrirFormularioDevolucao(id) {
    setDevolvendoId(id);
    setObservacaoDevolucao("");
  }

  function cancelarDevolucao() {
    setDevolvendoId(null);
    setObservacaoDevolucao("");
  }

  async function confirmarDevolucao(id) {
    setEnviandoDevolucao(true);
    try {
      await api.patch(`/emprestimos/${id}/devolver`, {
        observacao_devolucao: observacaoDevolucao.trim() || null,
      });
      setDevolvendoId(null);
      setObservacaoDevolucao("");
      onRefresh();
    } catch (e) {
      alert(e.response?.data?.detail ?? "Não foi possível registrar a devolução.");
    } finally {
      setEnviandoDevolucao(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <StatCard label="Em andamento" value={emprestimosAtivos.length} tone="teal" />
        <StatCard label="Devolução atrasada" value={emprestimosAtrasados.length} tone="red" />
        <StatCard label="Devolvidos" value={emprestimosHistorico.length} tone="neutral" />
      </div>

      {emprestimosAtrasados.length > 0 && (
        <div
          style={{
            background: "var(--red-soft)",
            color: "var(--red)",
            padding: "12px 16px",
            borderRadius: "var(--radius)",
            fontSize: 14,
          }}
        >
          ⚠ {emprestimosAtrasados.length} equipamento(s) com devolução pendente além do prazo
          combinado. Cobre a devolução para evitar retenção indevida entre setores.
        </div>
      )}

      <form
        onSubmit={registrarEmprestimo}
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
        <h3 style={{ fontSize: 16 }}>Registrar transferência entre setores</h3>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 12, color: "var(--ink-muted)" }}>Equipamento *</label>
            <select
              required
              value={form.equipamento_id}
              onChange={(e) => setForm((f) => ({ ...f, equipamento_id: e.target.value }))}
            >
              <option value="">Selecione...</option>
              {equipamentosDisponiveis.map((eq) => (
                <option key={eq.id} value={eq.id}>
                  {eq.nome} (#{eq.numero_patrimonio}) · {eq.localizacao_atual ?? eq.setor}
                </option>
              ))}
            </select>
            {equipamentosDisponiveis.length === 0 && (
              <span style={{ fontSize: 12, color: "var(--ink-muted)" }}>
                Nenhum equipamento disponível — todos já estão emprestados.
              </span>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 12, color: "var(--ink-muted)" }}>Setor de destino *</label>
            <input
              required
              value={form.setor_destino}
              onChange={(e) => setForm((f) => ({ ...f, setor_destino: e.target.value }))}
              placeholder="Ex: Centro Cirúrgico"
            />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 12, color: "var(--ink-muted)" }}>Solicitante *</label>
            <input
              required
              value={form.solicitante}
              onChange={(e) => setForm((f) => ({ ...f, solicitante: e.target.value }))}
              placeholder="Ex: Enf. responsável pelo setor"
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 12, color: "var(--ink-muted)" }}>
              Responsável pelo transporte
            </label>
            <input
              value={form.responsavel_transporte}
              onChange={(e) =>
                setForm((f) => ({ ...f, responsavel_transporte: e.target.value }))
              }
              placeholder="Ex: Técnico de plantão"
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 12, color: "var(--ink-muted)" }}>
              Devolução prevista *
            </label>
            <input
              required
              type="datetime-local"
              value={form.data_prevista_devolucao}
              onChange={(e) =>
                setForm((f) => ({ ...f, data_prevista_devolucao: e.target.value }))
              }
            />
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontSize: 12, color: "var(--ink-muted)" }}>Motivo</label>
          <textarea
            rows={2}
            value={form.motivo}
            onChange={(e) => setForm((f) => ({ ...f, motivo: e.target.value }))}
            placeholder="Ex: Cirurgia de urgência sem monitor disponível no CC"
          />
        </div>

        {erro && <div style={{ color: "var(--red)", fontSize: 13 }}>{erro}</div>}

        <button
          type="submit"
          disabled={enviando || equipamentosDisponiveis.length === 0}
          style={{
            alignSelf: "flex-start",
            background: "var(--teal)",
            color: "#fff",
            border: "none",
            borderRadius: "var(--radius)",
            padding: "10px 18px",
            fontWeight: 600,
            opacity: enviando || equipamentosDisponiveis.length === 0 ? 0.6 : 1,
          }}
        >
          {enviando ? "Registrando..." : "Registrar transferência"}
        </button>
      </form>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <h3 style={{ fontSize: 16 }}>Empréstimos em andamento</h3>

        {emprestimosAtivos.length === 0 && (
          <div style={{ color: "var(--ink-muted)", fontSize: 14 }}>
            Nenhum equipamento emprestado entre setores no momento.
          </div>
        )}

        {emprestimosAtivos.map((emp) => (
          <div
            key={emp.id}
            style={{
              display: "flex",
              flexDirection: "column",
              border: emp.atrasado ? "1px solid var(--red)" : "1px solid var(--line)",
              borderRadius: "var(--radius)",
              background: "var(--surface)",
              padding: "10px 16px",
              gap: 10,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 500 }}>{nomeEquipamento(emp.equipamento_id)}</span>
                  <EmprestimoBadge emprestimo={emp} />
                </div>
                <div style={{ fontSize: 13, color: "var(--ink-muted)" }}>
                  <strong>{emp.setor_origem}</strong> → <strong>{emp.setor_destino}</strong>
                  {" · "}Solicitado por {emp.solicitante}
                </div>
                {emp.responsavel_transporte && (
                  <div style={{ fontSize: 13, color: "var(--ink-muted)" }}>
                    Transporte: {emp.responsavel_transporte}
                  </div>
                )}
                {emp.motivo && (
                  <div style={{ fontSize: 13, color: "var(--ink-muted)" }}>
                    <strong>Motivo:</strong> {emp.motivo}
                  </div>
                )}
                <div style={{ fontSize: 13, color: emp.atrasado ? "var(--red)" : "var(--ink-muted)" }}>
                  Prazo de devolução: {formatarData(emp.data_prevista_devolucao)}
                  {emp.atrasado && " — vencido"}
                </div>
              </div>

              {devolvendoId !== emp.id && (
                <button
                  onClick={() => abrirFormularioDevolucao(emp.id)}
                  style={{
                    border: "1px solid var(--line)",
                    background: "var(--ink)",
                    color: "#fff",
                    borderRadius: "var(--radius)",
                    padding: "5px 10px",
                    fontSize: 12,
                    flexShrink: 0,
                  }}
                >
                  Registrar devolução
                </button>
              )}
            </div>

            {devolvendoId === emp.id && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  borderTop: "1px solid var(--line)",
                  paddingTop: 10,
                }}
              >
                <label style={{ fontSize: 12, color: "var(--ink-muted)" }}>
                  Observação da devolução (opcional)
                </label>
                <textarea
                  autoFocus
                  rows={2}
                  value={observacaoDevolucao}
                  onChange={(e) => setObservacaoDevolucao(e.target.value)}
                  placeholder="Ex: Equipamento conferido e devolvido em bom estado"
                />
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => confirmarDevolucao(emp.id)}
                    disabled={enviandoDevolucao}
                    style={{
                      background: "var(--teal)",
                      color: "#fff",
                      border: "none",
                      borderRadius: "var(--radius)",
                      padding: "6px 14px",
                      fontSize: 13,
                      fontWeight: 600,
                      opacity: enviandoDevolucao ? 0.6 : 1,
                    }}
                  >
                    {enviandoDevolucao ? "Salvando..." : "Confirmar devolução"}
                  </button>
                  <button
                    onClick={cancelarDevolucao}
                    style={{
                      border: "1px solid var(--line)",
                      background: "transparent",
                      color: "var(--ink-muted)",
                      borderRadius: "var(--radius)",
                      padding: "6px 14px",
                      fontSize: 13,
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {emprestimosHistorico.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <h3 style={{ fontSize: 16 }}>Histórico de devoluções</h3>
          {emprestimosHistorico.map((emp) => (
            <div
              key={emp.id}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
                border: "1px solid var(--line)",
                borderRadius: "var(--radius)",
                background: "var(--surface-sunken)",
                padding: "10px 16px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontWeight: 500 }}>{nomeEquipamento(emp.equipamento_id)}</span>
                <EmprestimoBadge emprestimo={emp} />
              </div>
              <div style={{ fontSize: 13, color: "var(--ink-muted)" }}>
                <strong>{emp.setor_origem}</strong> → <strong>{emp.setor_destino}</strong>
                {" · "}Devolvido em {formatarData(emp.data_devolucao)}
              </div>
              {emp.observacao_devolucao && (
                <div style={{ fontSize: 13, color: "var(--ink-muted)" }}>
                  <strong>Obs.:</strong> {emp.observacao_devolucao}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
