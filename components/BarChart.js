"use client";
import { fmtPesos } from "../lib/format";

const SERIES = [
  { key: "ingresos", label: "Ingresos", color: "#4FD1A5" },
  { key: "gastos", label: "Gastos", color: "#C97B6B" },
  { key: "remanente", label: "Remanente", color: "#7DD3FC" },
];

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
      <div style={{ display: "flex", gap: 14, marginBottom: 12, fontSize: 12 }}>
        {SERIES.map((s) => (
          <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: s.color, display: "inline-block" }} />
            <span style={{ color: "#8C9EC9" }}>{s.label}</span>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {filas.map((f) => (
          <div key={f.periodoLabel}>
            <div style={{ fontSize: 13, color: "#E7ECF7", marginBottom: 4 }}>{f.periodoLabel}</div>
            {SERIES.map((s) => {
              const v = Number(f[s.key] || 0);
              const widthPct = (Math.abs(v) / max) * 100;
              return (
                <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                  <div style={{ flex: 1, background: "#142440", borderRadius: 3, overflow: "hidden", height: 14 }}>
                    <div style={{ width: `${widthPct}%`, background: s.color, height: "100%" }} />
                  </div>
                  <div style={{ width: 90, fontSize: 11, color: "#8C9EC9", textAlign: "right" }}>{fmtPesos(v)}</div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
