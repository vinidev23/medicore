import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const CORES_STATUS = {
  aberta: "#b8792e",
  em_andamento: "#0e7c7b",
  concluida: "#8a9a97",
  cancelada: "#a83c46",
};

const LABEL_STATUS = {
  aberta: "Aberta",
  em_andamento: "Em andamento",
  concluida: "Concluída",
  cancelada: "Cancelada",
};

function agruparPorEquipamento(ordens, equipamentos) {
  const contagem = {};
  ordens.forEach((os) => {
    contagem[os.equipamento_id] = (contagem[os.equipamento_id] || 0) + 1;
  });

  return Object.entries(contagem)
    .map(([equipamentoId, total]) => {
      const equipamento = equipamentos.find((eq) => eq.id === Number(equipamentoId));
      return {
        nome: equipamento ? equipamento.nome : `#${equipamentoId}`,
        chamados: total,
      };
    })
    .sort((a, b) => b.chamados - a.chamados)
    .slice(0, 8); // top 8, para não poluir o gráfico
}

function agruparPorSetor(ordens, equipamentos) {
  const contagem = {};
  ordens.forEach((os) => {
    const equipamento = equipamentos.find((eq) => eq.id === os.equipamento_id);
    const setor = equipamento ? equipamento.setor : "Não identificado";
    contagem[setor] = (contagem[setor] || 0) + 1;
  });

  return Object.entries(contagem)
    .map(([setor, total]) => ({ setor, chamados: total }))
    .sort((a, b) => b.chamados - a.chamados);
}

function agruparPorStatus(ordens) {
  const contagem = {};
  ordens.forEach((os) => {
    contagem[os.status] = (contagem[os.status] || 0) + 1;
  });

  return Object.entries(contagem).map(([status, total]) => ({
    status,
    label: LABEL_STATUS[status] ?? status,
    total,
    cor: CORES_STATUS[status] ?? "#8a9a97",
  }));
}

function PainelVazio({ mensagem }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: 220,
        color: "var(--ink-muted)",
        fontSize: 13,
        border: "1px dashed var(--line)",
        borderRadius: "var(--radius)",
      }}
    >
      {mensagem}
    </div>
  );
}

export default function ChartsPanel({ equipamentos, ordens }) {
  const dadosPorEquipamento = agruparPorEquipamento(ordens, equipamentos);
  const dadosPorSetor = agruparPorSetor(ordens, equipamentos);
  const dadosPorStatus = agruparPorStatus(ordens);

  const cardStyle = {
    background: "var(--surface)",
    border: "1px solid var(--line)",
    borderRadius: "var(--radius)",
    padding: 20,
  };

  const tituloStyle = { fontSize: 14, fontWeight: 600, marginBottom: 12 };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: 16,
      }}
    >
      <div style={cardStyle}>
        <div style={tituloStyle}>Equipamentos com mais chamados</div>
        {dadosPorEquipamento.length === 0 ? (
          <PainelVazio mensagem="Sem ordens de serviço registradas ainda." />
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={dadosPorEquipamento} layout="vertical" margin={{ left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
              <YAxis
                type="category"
                dataKey="nome"
                width={140}
                tick={{ fontSize: 12, fill: "var(--ink)" }}
              />
              <Tooltip
                contentStyle={{
                  fontSize: 13,
                  borderRadius: 6,
                  border: "1px solid var(--line)",
                }}
              />
              <Bar dataKey="chamados" fill="#0e7c7b" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div style={cardStyle}>
        <div style={tituloStyle}>Distribuição por status</div>
        {dadosPorStatus.length === 0 ? (
          <PainelVazio mensagem="Sem dados ainda." />
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={dadosPorStatus}
                dataKey="total"
                nameKey="label"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
              >
                {dadosPorStatus.map((entrada) => (
                  <Cell key={entrada.status} fill={entrada.cor} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  fontSize: 13,
                  borderRadius: 6,
                  border: "1px solid var(--line)",
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      <div style={{ ...cardStyle, gridColumn: "1 / -1" }}>
        <div style={tituloStyle}>Chamados por setor</div>
        {dadosPorSetor.length === 0 ? (
          <PainelVazio mensagem="Sem ordens de serviço registradas ainda." />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dadosPorSetor} margin={{ left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
              <XAxis dataKey="setor" tick={{ fontSize: 12, fill: "var(--ink)" }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  fontSize: 13,
                  borderRadius: 6,
                  border: "1px solid var(--line)",
                }}
              />
              <Bar dataKey="chamados" fill="#b8792e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
