"use client";
import { fmtPesos, fmtPct } from "../lib/format";
import { colorForIndex } from "../lib/categorias";

// items: [{ name, value }] — barras ordenadas de mayor a menor, con
// colores garantizados distintos entre sí dentro del mismo gráfico.
export default function CategoryBars({ items }) {
  const data = (items || []).filter((i) => Number(i.value) > 0).sort((a, b) => Number(b.value) - Number(a.value));
  const total = data.reduce((s, i) => s + Number(i.value), 0);

  if (data.length === 0 || total <= 0) {
    return <p style={{ color: "#8C9EC9", fontSize: 13 }}>No hay datos todavía para graficar.</p>;
  }

  const max = Number(data[0].value);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {data.map((item, idx) => {
        const color = colorForIndex(idx);
        const pct = (Number(item.value) / total) * 100;
        const widthPct = (Number(item.value) / max) * 100;
        return (
          <div key={item.name}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
              <span style={{ color: "#E7ECF7" }}>{item.name}</span>
              <span style={{ color: "#8C9EC9" }}>
                {fmtPesos(item.value)} · {fmtPct(pct)}
              </span>
            </div>
            <div style={{ background: "#0B1730", borderRadius: 3, overflow: "hidden", height: 14 }}>
              <div style={{ width: `${widthPct}%`, background: color, height: "100%" }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
