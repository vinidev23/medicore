import { useState } from "react";
import api from "../api/client";

const CRITICIDADE_OPCOES = [
  { value: "suporte_vida", label: "Suporte à vida" },
  { value: "alta", label: "Alta" },
  { value: "media", label: "Média" },
  { value: "baixa", label: "Baixa" },
];

const FORM_VAZIO = {
  nome: "",
  numero_patrimonio: "",
  fabricante: "",
  modelo: "",
  setor: "",
  criticidade: "media",
  data_aquisicao: "",
  valor_aquisicao: "",
};

export default function EquipmentForm({ onCriado }) {
  const [form, setForm] = useState(FORM_VAZIO);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState(null);

  function atualizarCampo(campo, valor) {
    setForm((atual) => ({ ...atual, [campo]: valor }));
  }

  async function enviarFormulario(evento) {
    evento.preventDefault();
    setErro(null);
    setEnviando(true);

    try {
      // Remove campos vazios opcionais antes de enviar, para não mandar string vazia onde a API espera null ou número
      const payload = {
        ...form,
        fabricante: form.fabricante || null,
        modelo: form.modelo || null,
        data_aquisicao: form.data_aquisicao || null,
        valor_aquisicao: form.valor_aquisicao ? Number(form.valor_aquisicao) : null,
      };

      await api.post("/equipamentos", payload);
      setForm(FORM_VAZIO);
      onCriado();
    } catch (e) {
      const detalhe = e.response?.data?.detail ?? "Erro ao cadastrar equipamento.";
      setErro(detalhe);
    } finally {
      setEnviando(false);
    }
  }

  const campoStyle = { display: "flex", flexDirection: "column", gap: 4 };
  const labelStyle = { fontSize: 12, color: "var(--ink-muted)", fontWeight: 500 };

  return (
    <form
      onSubmit={enviarFormulario}
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
      <h3 style={{ fontSize: 16 }}>Cadastrar equipamento</h3>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={campoStyle}>
          <label style={labelStyle}>Nome *</label>
          <input
            required
            value={form.nome}
            onChange={(e) => atualizarCampo("nome", e.target.value)}
            placeholder="Ex: Monitor Multiparamétrico"
          />
        </div>

        <div style={campoStyle}>
          <label style={labelStyle}>Nº Patrimônio *</label>
          <input
            required
            value={form.numero_patrimonio}
            onChange={(e) => atualizarCampo("numero_patrimonio", e.target.value)}
            placeholder="Ex: PAT-00123"
          />
        </div>

        <div style={campoStyle}>
          <label style={labelStyle}>Fabricante</label>
          <input
            value={form.fabricante}
            onChange={(e) => atualizarCampo("fabricante", e.target.value)}
          />
        </div>

        <div style={campoStyle}>
          <label style={labelStyle}>Modelo</label>
          <input
            value={form.modelo}
            onChange={(e) => atualizarCampo("modelo", e.target.value)}
          />
        </div>

        <div style={campoStyle}>
          <label style={labelStyle}>Setor *</label>
          <input
            required
            value={form.setor}
            onChange={(e) => atualizarCampo("setor", e.target.value)}
            placeholder="Ex: UTI Adulto"
          />
        </div>

        <div style={campoStyle}>
          <label style={labelStyle}>Criticidade *</label>
          <select
            required
            value={form.criticidade}
            onChange={(e) => atualizarCampo("criticidade", e.target.value)}
          >
            {CRITICIDADE_OPCOES.map((opcao) => (
              <option key={opcao.value} value={opcao.value}>
                {opcao.label}
              </option>
            ))}
          </select>
        </div>

        <div style={campoStyle}>
          <label style={labelStyle}>Data de aquisição</label>
          <input
            type="date"
            value={form.data_aquisicao}
            onChange={(e) => atualizarCampo("data_aquisicao", e.target.value)}
          />
        </div>

        <div style={campoStyle}>
          <label style={labelStyle}>Valor de aquisição (R$)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={form.valor_aquisicao}
            onChange={(e) => atualizarCampo("valor_aquisicao", e.target.value)}
          />
        </div>
      </div>

      {erro && (
        <div style={{ color: "var(--red)", fontSize: 13 }}>{erro}</div>
      )}

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
        {enviando ? "Salvando..." : "Cadastrar equipamento"}
      </button>
    </form>
  );
}
