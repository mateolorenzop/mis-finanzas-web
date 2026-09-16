"use client";
import { useEffect, useState } from "react";
import { useMes } from "../../../lib/MesContext";
import { fetchMesCompleto, calcularTotales, eliminarMes } from "../../../lib/mes";
import { formatoCorto } from "../../../lib/periodo";
import { fmtPesos } from "../../../lib/format";
import BarChart from "../../../components/BarChart";

export default function Historial() {
  const { meses, recargarMeses, setMesId } = useMes();
  const [filas, setFilas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [aEliminar, setAEliminar] = useState(null);

  useEffect(() => {
    let activo = true;
    setCargando(true);
    Promise.all(
      meses.map(async (m) => {
        const datos = await fetchMesCompleto(m.id, m.periodo);
        const t = calcularTotales(m, datos);
        return { mes: m, totales: t };
      })
    ).then((r) => {
      if (activo) {
        setFilas(r.sort((a, b) => (a.mes.periodo < b.mes.periodo ? 1 : -1)));
        setCargando(false);
      }
    });
    return () => {
      activo = false;
    };
  }, [meses]);

  async function confirmarEliminar(mesId) {
    try {
      await eliminarMes(mesId);
      setAEliminar(null);
      await recargarMeses();
    } catch (e) {
      alert("No se pudo borrar el mes: " + e.message);
    }
  }

  if (cargando) return <p style={{ color: "#8C9EC9", fontSize: 13 }}>Cargando historial...</p>;

  const barras = filas.map((f) => ({
    periodoLabel: formatoCorto(f.mes.periodo),
    ingresos: f.totales.fondosDisponibles,
    gastos: f.totales.totalGastosFijos + f.totales.totalGastosVariables,
    remanente: f.totales.remanente,
  }));

  return (
    <div>
      <h2 style={{ fontSize: 14, color: "#8C9EC9", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Meses</h2>
      <div style={{ overflowX: "auto", marginBottom: 24 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ textAlign: "left", color: "#8C9EC9", borderBottom: "1px solid #26385C" }}>
              <th style={{ padding: "6px 8px" }}>Mes</th>
              <th style={{ padding: "6px 8px" }}>Ingresos</th>
              <th style={{ padding: "6px 8px" }}>Gastos fijos</th>
              <th style={{ padding: "6px 8px" }}>Gastos variables</th>
              <th style={{ padding: "6px 8px" }}>Remanente</th>
              <th style={{ padding: "6px 8px" }}></th>
            </tr>
          </thead>
          <tbody>
            {filas.map((f) => (
              <tr key={f.mes.id} style={{ borderBottom: "1px dashed #26385C" }}>
                <td style={{ padding: "6px 8px", color: "#E7ECF7" }}>
                  <button onClick={() => setMesId(f.mes.id)} style={{ background: "none", border: "none", color: "#E7ECF7", cursor: "pointer", padding: 0, textDecoration: "underline" }}>
                    {formatoCorto(f.mes.periodo)}
                  </button>
                </td>
                <td style={{ padding: "6px 8px", color: "#4FD1A5" }}>{fmtPesos(f.totales.fondosDisponibles)}</td>
                <td style={{ padding: "6px 8px", color: "#C97B6B" }}>{fmtPesos(f.totales.totalGastosFijos)}</td>
                <td style={{ padding: "6px 8px", color: "#C97B6B" }}>{fmtPesos(f.totales.totalGastosVariables)}</td>
                <td style={{ padding: "6px 8px", color: "#7DD3FC" }}>{fmtPesos(f.totales.remanente)}</td>
                <td style={{ padding: "6px 8px" }}>
                  {aEliminar === f.mes.id ? (
                    <span style={{ display: "flex", gap: 4 }}>
                      <button onClick={() => confirmarEliminar(f.mes.id)} style={{ background: "none", border: "none", color: "#C97B6B", cursor: "pointer", fontSize: 11 }}>
                        Sí, borrar
                      </button>
                      <button onClick={() => setAEliminar(null)} style={{ background: "none", border: "none", color: "#8C9EC9", cursor: "pointer", fontSize: 11 }}>
                        No
                      </button>
                    </span>
                  ) : (
                    <button onClick={() => setAEliminar(f.mes.id)} style={{ background: "none", border: "none", color: "#8C9EC9", cursor: "pointer" }}>
                      ×
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {filas.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: "10px 8px", color: "#8C9EC9" }}>
                  Todavía no hay meses creados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <h2 style={{ fontSize: 14, color: "#8C9EC9", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Evolución</h2>
      <BarChart filas={barras} />
    </div>
  );
}
