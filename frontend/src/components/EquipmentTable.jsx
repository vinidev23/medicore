import { useState } from "react";
import CriticidadeBadge from "./CriticidadeBadge";
import StatCard from "./StatCard";
import api from "../api/client";

export default function EquipmentTable({ equipamentos, onRefresh }) {
  const [expandidoId, setExpandidoId] = useState(null);
  const [indicadores, setIndicadores] = useState({});
  const [carregandoId, setCarregandoId] = useState(null);

  async function alternarIndicadores(id) {
    if (expandidoId === id) {
      setExpandidoId(null);
      return;
    }

    setExpandidoId(id);

    // Só busca da API se ainda não tiver os dados em cache
    if (!indicadores[id]) {
      setCarregandoId(id);
      try {
        const resposta = await api.get(`/equipamentos/${id}/indicadores`);
        setIndicadores((atual) => ({ ...atual, [id]: resposta.data }));
      } catch (erro) {
        console.error("Erro ao buscar indicadores", erro);
      } finally {
        setCarregandoId(null);
      }
    }
  }

  async function excluirEquipamento(id) {
    if (!window.confirm("Tem certeza que deseja excluir este equipamento?")) {
      return;
    }
    try {
      await api.delete(`/equipamentos/${id}`);
      onRefresh();
    } catch (erro) {
      console.error("Erro ao excluir equipamento", erro);
      alert("Não foi possível excluir o equipamento.");
    }
  }

  if (equipamentos.length === 0) {
    return (
      <div
        style={{
          padding: 32,
          textAlign: "center",
          color: "var(--ink-muted)",
          border: "1px dashed var(--line)",
          borderRadius: "var(--radius)",
        }}
      >
        Nenhum equipamento cadastrado ainda.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {equipamentos.map((equipamento) => (
        <div
          key={equipamento.id}
          style={{
            border: "1px solid var(--line)",
            borderRadius: "var(--radius)",
            background: "var(--surface)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 16px",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontWeight: 600 }}>{equipamento.nome}</span>
                <span className="mono" style={{ fontSize: 12, color: "var(--ink-muted)" }}>
                  #{equipamento.numero_patrimonio}
                </span>
                <CriticidadeBadge criticidade={equipamento.criticidade} />
              </div>
              <div style={{ fontSize: 13, color: "var(--ink-muted)" }}>
                {equipamento.setor}
                {equipamento.fabricante && ` · ${equipamento.fabricante}`}
                {equipamento.modelo && ` ${equipamento.modelo}`}
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              <button
                onClick={() => alternarIndicadores(equipamento.id)}
                style={{
                  border: "1px solid var(--teal)",
                  background: expandidoId === equipamento.id ? "var(--teal)" : "transparent",
                  color: expandidoId === equipamento.id ? "#fff" : "var(--teal)",
                  borderRadius: "var(--radius)",
                  padding: "6px 12px",
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                Indicadores
              </button>
              <button
                onClick={() => excluirEquipamento(equipamento.id)}
                style={{
                  border: "1px solid var(--line)",
                  background: "transparent",
                  color: "var(--red)",
                  borderRadius: "var(--radius)",
                  padding: "6px 12px",
                  fontSize: 13,
                }}
              >
                Excluir
              </button>
            </div>
          </div>

          {expandidoId === equipamento.id && (
            <div
              style={{
                borderTop: "1px solid var(--line)",
                background: "var(--surface-sunken)",
                padding: 16,
                display: "flex",
                gap: 12,
              }}
            >
              {carregandoId === equipamento.id ? (
                <span style={{ color: "var(--ink-muted)", fontSize: 13 }}>
                  Calculando indicadores...
                </span>
              ) : (
                <>
                  <StatCard
                    label="MTBF"
                    value={indicadores[equipamento.id]?.mtbf_horas}
                    unit="h"
                    tone="teal"
                  />
                  <StatCard
                    label="MTTR"
                    value={indicadores[equipamento.id]?.mttr_horas}
                    unit="h"
                    tone="amber"
                  />
                </>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
