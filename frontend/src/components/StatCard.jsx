export default function StatCard({ label, value, unit, tone = "neutral" }) {
  const toneStyles = {
    neutral: { color: "var(--ink)", background: "var(--surface)" },
    teal: { color: "var(--teal)", background: "var(--teal-soft)" },
    amber: { color: "var(--amber)", background: "var(--amber-soft)" },
    red: { color: "var(--red)", background: "var(--red-soft)" },
  };

  return (
    <div
      style={{
        border: "1px solid var(--line)",
        borderRadius: "var(--radius)",
        padding: "16px 18px",
        background: toneStyles[tone].background,
        minWidth: 160,
      }}
    >
      <div
        style={{
          fontSize: 12,
          color: "var(--ink-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div
        className="mono"
        style={{ fontSize: 26, fontWeight: 600, color: toneStyles[tone].color }}
      >
        {value !== null && value !== undefined ? value : "—"}
        {value !== null && value !== undefined && unit && (
          <span style={{ fontSize: 14, marginLeft: 4, color: "var(--ink-muted)" }}>
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}
