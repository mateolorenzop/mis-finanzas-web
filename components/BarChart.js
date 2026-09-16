"use client";
import { fmtPesos } from "../lib/format";

const SERIES = [
  { key: "ingresos", label: "Ingresos", color: "#4FD1A5" },
  { key: "gastos", label: "Gastos", color: "#C97B6B" },
  { key: "remanente", label: "Remanente", color: "#A78BFA" },
];

const ALTURA = 160;

// filas: [{ periodoLabel, ingresos, gastos, remanente }]
export default function BarChart({ filas }) {
  if (!filas || filas.length === 0) {
    return <p style={{ color: "#8C9EC9", fontSize: 13 }}>Todavía no hay meses para graficar.</p>;
  }
  const max = Math.max(
    1,
    ...filas.flatMap((f) => SERIES.map((s) => Math.abs(Number(f[s.key] || 0))))
  );

  return (
    <div>
      <div style={{ display: "flex", gap: 14, marginBottom: 14, fontSize: 12 }}>
        {SERIES.map((s) => (
          <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: s.color, display: "inline-block" }} />
            <span style={{ color: "#8C9EC9" }}>{s.label}</span>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 20, overflowX: "auto", paddingBottom: 4 }}>
        {filas.map((f) => (
          <div key={f.periodoLabel} style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: ALTURA }}>
              {SERIES.map((s) => {
                const v = Number(f[s.key] || 0);
                const heightPct = (Math.abs(v) / max) * 100;
                return (
                  <div
                    key={s.key}
                    title={`${s.label}: ${fmtPesos(v)}`}
                    style={{
                      width: 16,
                      height: `${heightPct}%`,
                      minHeight: v !== 0 ? 2 : 0,
                      background: s.color,
                      borderRadius: "2px 2px 0 0",
                    }}
                  />
                );
              })}
            </div>
            <div style={{ fontSize: 11, color: "#8C9EC9", marginTop: 6, whiteSpace: "nowrap" }}>{f.periodoLabel}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
