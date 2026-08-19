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

function formatarDataSimples(iso) {
  if (!iso) return "—";
  // Campos "date" puros (YYYY-MM-DD) não têm hora nem fuso — monta a data
  // manualmente para não sofrer o mesmo problema de conversão de fuso.
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

function estaAtrasada(proximaCalibracao) {
  if (!proximaCalibracao) return false;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const [ano, mes, dia] = proximaCalibracao.split("-").map(Number);
  const dataProxima = new Date(ano, mes - 1, dia);
  return dataProxima < hoje;
}

const RESULTADO_INFO = {
  aprovado: { label: "Aprovado", tone: "teal" },
  reprovado: { label: "Reprovado", tone: "red" },
  ajustado: { label: "Ajustado", tone: "amber" },
};

function ResultadoBadge({ resultado }) {
  const info = RESULTADO_INFO[resultado] ?? { label: resultado, tone: "neutral" };

  const TONE_COLORS = {
    red: { bg: "var(--red-soft)", fg: "var(--red)" },
    teal: { bg: "var(--teal-soft)", fg: "var(--teal)" },
    amber: { bg: "var(--amber-soft)", fg: "var(--amber)" },
    neutral: { bg: "var(--surface-sunken)", fg: "var(--ink-muted)" },
  };
  const colors = TONE_COLORS[info.tone];

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
      {info.label}
    </span>
  );
}

function novoParametro() {
  return {
    _key: Math.random().toString(36).slice(2),
    grandeza: "",
    unidade: "",
    valor_referencia: "",
    valor_medido: "",
    tolerancia_maxima: "",
  };
}

const FORM_VAZIO = {
  equipamento_id: "",
  data_calibracao: new Date().toISOString().slice(0, 10),
  tecnico_responsavel: "",
  instrumento_padrao: "",
  certificado_numero: "",
  proxima_calibracao: "",
  observacoes: "",
  ajustado: false,
};

export default function CalibracaoPanel({ equipamentos, calibracoes, onRefresh }) {
  const [form, setForm] = useState(FORM_VAZIO);
  const [parametros, setParametros] = useState([novoParametro()]);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState(null);
  const [gerandoRelatorioId, setGerandoRelatorioId] = useState(null);
  const [filtroEquipamento, setFiltroEquipamento] = useState("");

  function nomeEquipamento(id) {
    return equipamentos.find((eq) => eq.id === id)?.nome ?? `Equipamento #${id}`;
  }

  function atualizarCampo(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  function atualizarParametro(key, campo, valor) {
    setParametros((atuais) =>
      atuais.map((p) => (p._key === key ? { ...p, [campo]: valor } : p))
    );
  }

  function adicionarParametro() {
    setParametros((atuais) => [...atuais, novoParametro()]);
  }

  function removerParametro(key) {
    setParametros((atuais) =>
      atuais.length > 1 ? atuais.filter((p) => p._key !== key) : atuais
    );
  }

  // Prévia local do erro/conformidade, apenas para feedback visual imediato
  // enquanto o técnico preenche — o valor definitivo é sempre recalculado
  // pelo backend ao salvar.
  function previaParametro(p) {
    const ref = parseFloat(p.valor_referencia);
    const medido = parseFloat(p.valor_medido);
    const tolerancia = parseFloat(p.tolerancia_maxima);
    if (Number.isNaN(ref) || Number.isNaN(medido) || Number.isNaN(tolerancia)) {
      return null;
    }
    const erro = medido - ref;
    return { erro, dentroTolerancia: Math.abs(erro) <= tolerancia };
  }

  const calibracoesFiltradas = filtroEquipamento
    ? calibracoes.filter((c) => c.equipamento_id === Number(filtroEquipamento))
    : calibracoes;

  const totalAprovadas = calibracoes.filter((c) => c.resultado_geral === "aprovado").length;
  const totalReprovadas = calibracoes.filter((c) => c.resultado_geral === "reprovado").length;
  const totalAtrasadas = calibracoes.filter(
    (c) => c.proxima_calibracao && estaAtrasada(c.proxima_calibracao)
  ).length;

  async function registrarCalibracao(evento) {
    evento.preventDefault();
    setErro(null);

    if (!form.equipamento_id || !form.tecnico_responsavel.trim() || !form.data_calibracao) {
      setErro("Preencha equipamento, data e técnico responsável.");
      return;
    }

    const parametrosValidos = parametros.filter(
      (p) =>
        p.grandeza.trim() &&
        p.valor_referencia !== "" &&
        p.valor_medido !== "" &&
        p.tolerancia_maxima !== ""
    );

    if (parametrosValidos.length === 0) {
      setErro("Adicione ao menos um parâmetro de calibração preenchido.");
      return;
    }

    setEnviando(true);
    try {
      await api.post("/calibracoes", {
        equipamento_id: Number(form.equipamento_id),
        data_calibracao: form.data_calibracao,
        tecnico_responsavel: form.tecnico_responsavel.trim(),
        instrumento_padrao: form.instrumento_padrao.trim() || null,
        certificado_numero: form.certificado_numero.trim() || null,
        proxima_calibracao: form.proxima_calibracao || null,
        observacoes: form.observacoes.trim() || null,
        ajustado: form.ajustado,
        parametros: parametrosValidos.map((p) => ({
          grandeza: p.grandeza.trim(),
          unidade: p.unidade.trim() || null,
          valor_referencia: Number(p.valor_referencia),
          valor_medido: Number(p.valor_medido),
          tolerancia_maxima: Number(p.tolerancia_maxima),
        })),
      });
      setForm(FORM_VAZIO);
      setParametros([novoParametro()]);
      onRefresh();
    } catch (e) {
      setErro(e.response?.data?.detail ?? "Erro ao registrar a calibração.");
    } finally {
      setEnviando(false);
    }
  }

  async function baixarRelatorio(id) {
    setGerandoRelatorioId(id);
    try {
      const resposta = await api.get(`/calibracoes/${id}/relatorio`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([resposta.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `relatorio-calibracao-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert("Não foi possível gerar o relatório de calibração.");
    } finally {
      setGerandoRelatorioId(null);
    }
  }

  const campoStyle = { display: "flex", flexDirection: "column", gap: 4 };
  const labelStyle = { fontSize: 12, color: "var(--ink-muted)", fontWeight: 500 };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <StatCard label="Calibrações registradas" value={calibracoes.length} tone="neutral" />
        <StatCard label="Aprovadas" value={totalAprovadas} tone="teal" />
        <StatCard label="Reprovadas" value={totalReprovadas} tone="red" />
        <StatCard
          label="Próx. calibração vencida"
          value={totalAtrasadas}
          tone={totalAtrasadas > 0 ? "amber" : "neutral"}
        />
      </div>

      {totalAtrasadas > 0 && (
        <div
          style={{
            background: "var(--amber-soft)",
            color: "var(--amber)",
            padding: "12px 16px",
            borderRadius: "var(--radius)",
            fontSize: 14,
          }}
        >
          ⚠ {totalAtrasadas} equipamento(s) com a data de próxima calibração já vencida.
        </div>
      )}

      <form
        onSubmit={registrarCalibracao}
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
        <h3 style={{ fontSize: 16 }}>Registrar calibração</h3>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
          <div style={campoStyle}>
            <label style={labelStyle}>Equipamento *</label>
            <select
              required
              value={form.equipamento_id}
              onChange={(e) => atualizarCampo("equipamento_id", e.target.value)}
            >
              <option value="">Selecione...</option>
              {equipamentos.map((eq) => (
                <option key={eq.id} value={eq.id}>
                  {eq.nome} (#{eq.numero_patrimonio}) · {eq.setor}
                </option>
              ))}
            </select>
          </div>

          <div style={campoStyle}>
            <label style={labelStyle}>Data da calibração *</label>
            <input
              required
              type="date"
              value={form.data_calibracao}
              onChange={(e) => atualizarCampo("data_calibracao", e.target.value)}
            />
          </div>

          <div style={campoStyle}>
            <label style={labelStyle}>Técnico responsável *</label>
            <input
              required
              value={form.tecnico_responsavel}
              onChange={(e) => atualizarCampo("tecnico_responsavel", e.target.value)}
              placeholder="Ex: Vinícius Silva"
            />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
          <div style={campoStyle}>
            <label style={labelStyle}>Instrumento/padrão utilizado</label>
            <input
              value={form.instrumento_padrao}
              onChange={(e) => atualizarCampo("instrumento_padrao", e.target.value)}
              placeholder="Ex: Calibrador Fluke Biomedical"
            />
          </div>

          <div style={campoStyle}>
            <label style={labelStyle}>Nº do certificado</label>
            <input
              value={form.certificado_numero}
              onChange={(e) => atualizarCampo("certificado_numero", e.target.value)}
              placeholder="Ex: CAL-2026-0148"
            />
          </div>

          <div style={campoStyle}>
            <label style={labelStyle}>Próxima calibração</label>
            <input
              type="date"
              value={form.proxima_calibracao}
              onChange={(e) => atualizarCampo("proxima_calibracao", e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <label style={labelStyle}>Parâmetros medidos *</label>
            <button
              type="button"
              onClick={adicionarParametro}
              style={{
                border: "1px solid var(--teal)",
                background: "transparent",
                color: "var(--teal)",
                borderRadius: "var(--radius)",
                padding: "4px 10px",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              + Adicionar parâmetro
            </button>
          </div>

          {parametros.map((p) => {
            const previa = previaParametro(p);
            return (
              <div
                key={p._key}
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
                  gap: 8,
                  alignItems: "end",
                  background: "var(--surface-sunken)",
                  borderRadius: "var(--radius)",
                  padding: 10,
                  width: "100%",
                  boxSizing: "border-box",
                }}
              >
                <div style={{ ...campoStyle, minWidth: 0 }}>
                  <label style={labelStyle}>Grandeza</label>
                  <input
                    value={p.grandeza}
                    onChange={(e) => atualizarParametro(p._key, "grandeza", e.target.value)}
                    placeholder="Ex: Vazão"
                    style={{ width: "100%", boxSizing: "border-box" }}
                  />
                </div>
                <div style={{ ...campoStyle, minWidth: 0 }}>
                  <label style={labelStyle}>Unidade</label>
                  <input
                    value={p.unidade}
                    onChange={(e) => atualizarParametro(p._key, "unidade", e.target.value)}
                    placeholder="mL/h"
                    style={{ width: "100%", boxSizing: "border-box" }}
                  />
                </div>
                <div style={{ ...campoStyle, minWidth: 0 }}>
                  <label style={labelStyle}>Referência</label>
                  <input
                    type="number"
                    step="any"
                    value={p.valor_referencia}
                    onChange={(e) =>
                      atualizarParametro(p._key, "valor_referencia", e.target.value)
                    }
                    style={{ width: "100%", boxSizing: "border-box" }}
                  />
                </div>
                <div style={{ ...campoStyle, minWidth: 0 }}>
                  <label style={labelStyle}>Medido</label>
                  <input
                    type="number"
                    step="any"
                    value={p.valor_medido}
                    onChange={(e) => atualizarParametro(p._key, "valor_medido", e.target.value)}
                    style={{ width: "100%", boxSizing: "border-box" }}
                  />
                </div>
                <div style={{ ...campoStyle, minWidth: 0 }}>
                  <label style={labelStyle}>Tolerância (±)</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={p.tolerancia_maxima}
                    onChange={(e) =>
                      atualizarParametro(p._key, "tolerancia_maxima", e.target.value)
                    }
                    style={{ width: "100%", boxSizing: "border-box" }}
                  />
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                    alignItems: "flex-start",
                    minWidth: 0,
                  }}
                >
                  {previa && (
                    <span
                      className="mono"
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: previa.dentroTolerancia ? "var(--teal)" : "var(--red)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      erro {previa.erro > 0 ? "+" : ""}
                      {previa.erro.toFixed(2)}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removerParametro(p._key)}
                    disabled={parametros.length === 1}
                    style={{
                      border: "1px solid var(--line)",
                      background: "transparent",
                      color: "var(--ink-muted)",
                      borderRadius: "var(--radius)",
                      padding: "4px 8px",
                      fontSize: 12,
                      opacity: parametros.length === 1 ? 0.4 : 1,
                    }}
                  >
                    Remover
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div style={campoStyle}>
          <label style={labelStyle}>Observações</label>
          <textarea
            rows={2}
            value={form.observacoes}
            onChange={(e) => atualizarCampo("observacoes", e.target.value)}
            placeholder="Ex: Equipamento em boas condições gerais, sem necessidade de ajuste"
          />
        </div>

        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--ink-muted)" }}>
          <input
            type="checkbox"
            checked={form.ajustado}
            onChange={(e) => atualizarCampo("ajustado", e.target.checked)}
            style={{ width: "auto" }}
          />
          O equipamento precisou de ajuste durante a calibração
        </label>

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
          {enviando ? "Salvando..." : "Registrar calibração"}
        </button>
      </form>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <h3 style={{ fontSize: 16 }}>Histórico de calibrações</h3>
          <select
            value={filtroEquipamento}
            onChange={(e) => setFiltroEquipamento(e.target.value)}
            style={{ fontSize: 13, maxWidth: 260 }}
          >
            <option value="">Todos os equipamentos</option>
            {equipamentos.map((eq) => (
              <option key={eq.id} value={eq.id}>
                {eq.nome} (#{eq.numero_patrimonio})
              </option>
            ))}
          </select>
        </div>

        {calibracoesFiltradas.length === 0 && (
          <div style={{ color: "var(--ink-muted)", fontSize: 14 }}>
            Nenhuma calibração registrada ainda.
          </div>
        )}

        {calibracoesFiltradas.map((cal) => {
          const atrasada = cal.proxima_calibracao && estaAtrasada(cal.proxima_calibracao);
          return (
            <div
              key={cal.id}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                border: atrasada ? "1px solid var(--amber)" : "1px solid var(--line)",
                borderRadius: "var(--radius)",
                background: "var(--surface)",
                padding: "10px 16px",
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
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 500 }}>{nomeEquipamento(cal.equipamento_id)}</span>
                  <ResultadoBadge resultado={cal.resultado_geral} />
                </div>
                <button
                  onClick={() => baixarRelatorio(cal.id)}
                  disabled={gerandoRelatorioId === cal.id}
                  style={{
                    border: "1px solid var(--teal)",
                    background: "transparent",
                    color: "var(--teal)",
                    borderRadius: "var(--radius)",
                    padding: "5px 10px",
                    fontSize: 12,
                    fontWeight: 600,
                    opacity: gerandoRelatorioId === cal.id ? 0.6 : 1,
                    flexShrink: 0,
                  }}
                >
                  {gerandoRelatorioId === cal.id ? "Gerando..." : "⬇ Gerar relatório"}
                </button>
              </div>

              <div style={{ fontSize: 13, color: "var(--ink-muted)" }}>
                Calibrado em {formatarDataSimples(cal.data_calibracao)} por{" "}
                <strong>{cal.tecnico_responsavel}</strong>
                {cal.instrumento_padrao && <> · Padrão: {cal.instrumento_padrao}</>}
              </div>

              {cal.proxima_calibracao && (
                <div style={{ fontSize: 13, color: atrasada ? "var(--amber)" : "var(--ink-muted)" }}>
                  Próxima calibração: {formatarDataSimples(cal.proxima_calibracao)}
                  {atrasada && " — vencida"}
                </div>
              )}

              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {cal.parametros.map((p) => (
                  <span
                    key={p.id}
                    className="mono"
                    style={{
                      fontSize: 11,
                      padding: "3px 8px",
                      borderRadius: 4,
                      background: p.dentro_tolerancia ? "var(--teal-soft)" : "var(--red-soft)",
                      color: p.dentro_tolerancia ? "var(--teal)" : "var(--red)",
                    }}
                  >
                    {p.grandeza}: {p.valor_medido}
                    {p.unidade ?? ""} (erro {p.erro > 0 ? "+" : ""}
                    {p.erro})
                  </span>
                ))}
              </div>

              {cal.observacoes && (
                <div style={{ fontSize: 13, color: "var(--ink-muted)" }}>
                  <strong>Obs.:</strong> {cal.observacoes}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
