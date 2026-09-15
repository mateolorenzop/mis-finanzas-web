"use client";
import { useState } from "react";
import { useMes } from "../../../lib/MesContext";
import PieChart from "../../../components/PieChart";
import { fmtPesos } from "../../../lib/format";
import { colorFor } from "../../../lib/categorias";
import { varItemTotal } from "../../../lib/mes";
import { formatoLargo, periodoSiguiente } from "../../../lib/periodo";

export default function Resumen() {
  const { mes, datos, totales, avanzarMes } = useMes();
  const [confirmando, setConfirmando] = useState(false);
  const [creando, setCreando] = useState(false);

  if (!mes) return <p style={{ color: "#93A99B", fontSize: 13 }}>Creá un mes primero (arriba).</p>;

  const { gastosFijos, gastosVariables, tarjetaMotivos } = datos;

  const totalesPorCategoria = {};
  for (const g of gastosVariables) {
    totalesPorCategoria[g.categoria] = (totalesPorCategoria[g.categoria] || 0) + varItemTotal(g, tarjetaMotivos);
  }

  const pieItems = [
    ...gastosFijos.map((g) => ({ name: g.concepto, value: Number(g.valor || 0), color: colorFor(g.concepto) })),
    ...Object.entries(totalesPorCategoria).map(([categoria, value]) => ({ name: categoria, value, color: colorFor(categoria) })),
    { name: "Ahorro en dólares", value: totales.totalDolaresPesos, color: colorFor("Ahorro en dólares") },
    { name: "Remanente", value: Math.max(0, totales.remanente), color: colorFor("Remanente") },
  ];

  async function confirmarAvance() {
    setCreando(true);
    try {
      await avanzarMes();
    } catch (e) {
      alert(e.message);
    }
    setCreando(false);
    setConfirmando(false);
  }

  return (
    <div>
      <h2 style={{ fontSize: 14, color: "#93A99B", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
        {formatoLargo(mes.periodo)}
      </h2>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20, fontSize: 13 }}>
        <Card label="Fondos disponibles" valor={totales.fondosDisponibles} color="#7CB88D" />
        <Card label="Gastos fijos" valor={totales.totalGastosFijos} color="#C97B6B" />
        <Card label="Gastos variables" valor={totales.totalGastosVariables} color="#C97B6B" />
        <Card label="Ahorro en dólares" valor={totales.totalDolaresPesos} color="#D2A94C" />
        <Card label="Remanente" valor={totales.remanente} color="#6BA0C9" wide />
      </div>

      <PieChart items={pieItems} />

      <div style={{ marginTop: 28, background: "#182B22", border: "1px solid #2B4137", borderRadius: 6, padding: 14 }}>
        <p style={{ fontSize: 13, color: "#EFE9DA", marginTop: 0 }}>
          Cuando termine el mes, creá el siguiente ({formatoLargo(periodoSiguiente(mes.periodo))}): copia los gastos
          fijos, avanza las cuotas de tarjeta pendientes, y arranca con el remanente calculado de este mes ({fmtPesos(totales.remanente)}).
        </p>
        {!confirmando ? (
          <button
            onClick={() => setConfirmando(true)}
            style={{ padding: "10px 16px", background: "#7CB88D", color: "#0F1913", fontWeight: 600, border: "none", borderRadius: 4, cursor: "pointer" }}
          >
            Crear mes siguiente
          </button>
        ) : (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 13, color: "#D2A94C" }}>¿Seguro?</span>
            <button
              disabled={creando}
              onClick={confirmarAvance}
              style={{ padding: "8px 14px", background: "#7CB88D", color: "#0F1913", fontWeight: 600, border: "none", borderRadius: 4, cursor: "pointer" }}
            >
              {creando ? "Creando..." : "Sí, crear"}
            </button>
            <button
              onClick={() => setConfirmando(false)}
              style={{ padding: "8px 14px", background: "none", color: "#93A99B", border: "1px solid #2B4137", borderRadius: 4, cursor: "pointer" }}
            >
              No
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Card({ label, valor, color, wide }) {
  return (
    <div style={{ gridColumn: wide ? "1 / -1" : "auto", background: "#182B22", border: "1px solid #2B4137", borderRadius: 6, padding: 10 }}>
      <div style={{ color: "#93A99B", fontSize: 12 }}>{label}</div>
      <div style={{ color, fontSize: 17 }}>{fmtPesos(valor)}</div>
    </div>
  );
}
