"use client";
import { useState } from "react";
import { fmtPesos, fmtPct } from "../lib/format";
import { colorForIndex } from "../lib/categorias";

function polarToCartesian(cx, cy, r, angleDeg) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(angleRad), y: cy + r * Math.sin(angleRad) };
}

function arcPath(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y} Z`;
}

// items: [{ name, value, color }]
export default function PieChart({ items, size = 220 }) {
  const [selected, setSelected] = useState(null);
  const data = (items || []).filter((i) => Number(i.value) > 0).sort((a, b) => Number(b.value) - Number(a.value));
  const total = data.reduce((s, i) => s + Number(i.value), 0);

  if (data.length === 0 || total <= 0) {
    return <p style={{ color: "#8C9EC9", fontSize: 13 }}>No hay datos todavía para graficar.</p>;
  }

  const r = size / 2;
  let acc = 0;
  const arcos = data.map((item, idx) => {
    const pct = (Number(item.value) / total) * 100;
    const startAngle = (acc / total) * 360;
    acc += Number(item.value);
    const endAngle = (acc / total) * 360;
    return { ...item, color: colorForIndex(idx), pct, startAngle, endAngle };
  });

  const activo = selected != null ? arcos.find((a) => a.name === selected) : null;

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 20, alignItems: "flex-start" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {arcos.map((a) => (
          <path
            key={a.name}
            d={arcPath(r, r, r, a.startAngle, a.endAngle)}
            fill={a.color}
            opacity={selected == null || selected === a.name ? 1 : 0.25}
            stroke="#0B1730"
            strokeWidth={1}
            style={{ cursor: "pointer" }}
            onClick={() => setSelected(selected === a.name ? null : a.name)}
          />
        ))}
      </svg>

      <div style={{ minWidth: 200, flex: 1 }}>
        {activo && (
          <div
            style={{
              background: "#142440",
              border: "1px solid #26385C",
              borderRadius: 6,
              padding: 10,
              marginBottom: 10,
              fontSize: 13,
            }}
          >
            <div style={{ fontWeight: 600, color: "#E7ECF7" }}>{activo.name}</div>
            <div style={{ color: "#D2A94C" }}>{fmtPesos(activo.value)}</div>
            <div style={{ color: "#8C9EC9" }}>{fmtPct(activo.pct)}</div>
          </div>
        )}
        <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: 12 }}>
          {arcos.map((a) => (
            <li
              key={a.name}
              onClick={() => setSelected(selected === a.name ? null : a.name)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 0",
                cursor: "pointer",
                opacity: selected == null || selected === a.name ? 1 : 0.4,
              }}
            >
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: a.color, flexShrink: 0 }} />
              <span style={{ color: "#E7ECF7", flex: 1 }}>{a.name}</span>
              <span style={{ color: "#8C9EC9" }}>{fmtPct(a.pct)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
