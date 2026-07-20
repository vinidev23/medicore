const CONFIG = {
  suporte_vida: { label: "Suporte à vida", tone: "red" },
  alta: { label: "Alta", tone: "amber" },
  media: { label: "Média", tone: "teal" },
  baixa: { label: "Baixa", tone: "neutral" },
};

const TONE_COLORS = {
  red: { bg: "var(--red-soft)", fg: "var(--red)" },
  amber: { bg: "var(--amber-soft)", fg: "var(--amber)" },
  teal: { bg: "var(--teal-soft)", fg: "var(--teal)" },
  neutral: { bg: "var(--surface-sunken)", fg: "var(--ink-muted)" },
};

export default function CriticidadeBadge({ criticidade }) {
  const config = CONFIG[criticidade] ?? CONFIG.media;
  const colors = TONE_COLORS[config.tone];

  return (
    <span
      className="mono"
      style={{
        display: "inline-block",
        fontSize: 11,
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.03em",
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
