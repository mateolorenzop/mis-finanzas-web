"use client";
import { useEffect, useState } from "react";
import { useMes } from "../../../lib/MesContext";
import { supabase } from "../../../lib/supabaseClient";
import MoneyInput, { inputStyle } from "../../../components/MoneyInput";
import PieChart from "../../../components/PieChart";
import { fmtPesos, fmtPct } from "../../../lib/format";
import { colorFor, FORMAS_PAGO } from "../../../lib/categorias";
import { periodoAnterior } from "../../../lib/periodo";
import { fetchGastosFijosPorPeriodo } from "../../../lib/mes";

export default function GastosFijos() {
  const { mes, datos, totales, recargarDatos } = useMes();
  const [anteriores, setAnteriores] = useState([]);

  useEffect(() => {
    if (!mes) return;
    fetchGastosFijosPorPeriodo(mes.user_id, periodoAnterior(mes.periodo)).then(setAnteriores).catch(() => setAnteriores([]));
  }, [mes]);

  if (!mes) return <p style={{ color: "#93A99B", fontSize: 13 }}>Creá un mes primero (arriba).</p>;

  const gastosFijos = datos.gastosFijos;

  async function agregar(item) {
    const { error } = await supabase.from("gastos_fijos").insert({ ...item, mes_id: mes.id, user_id: mes.user_id });
    if (error) { alert(error.message); return; }
    await recargarDatos();
  }

  async function actualizar(id, campos) {
    const { error } = await supabase.from("gastos_fijos").update(campos).eq("id", id);
    if (error) { alert(error.message); return; }
    await recargarDatos();
  }

  async function eliminar(id) {
    const { error } = await supabase.from("gastos_fijos").delete().eq("id", id);
    if (error) { alert(error.message); return; }
    await recargarDatos();
  }

  function aumentoPct(concepto, valorActual) {
    const previo = anteriores.find((g) => (g.concepto || "").trim().toLowerCase() === (concepto || "").trim().toLowerCase());
    if (!previo || !previo.valor) return null;
    return ((Number(valorActual) - Number(previo.valor)) / Number(previo.valor)) * 100;
  }

  const pieItems = gastosFijos.map((g) => ({ name: g.concepto, value: Number(g.valor || 0), color: colorFor(g.concepto) }));

  return (
    <div>
      <NuevoGastoFijo onAgregar={agregar} />

      <ul style={{ listStyle: "none", padding: 0, margin: 0, marginBottom: 20 }}>
        {gastosFijos.map((g) => {
          const pct = aumentoPct(g.concepto, g.valor);
          return (
            <li key={g.id} style={{ background: "#182B22", border: "1px solid #2B4137", borderRadius: 6, padding: 10, marginBottom: 8, fontSize: 13 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <strong style={{ color: "#EFE9DA" }}>{g.concepto}</strong>
                <button onClick={() => eliminar(g.id)} style={{ background: "none", border: "none", color: "#C97B6B", cursor: "pointer" }}>×</button>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "#D2A94C" }}>{fmtPesos(g.valor)}</span>
                {pct != null && (
                  <span style={{ color: pct > 0 ? "#C97B6B" : pct < 0 ? "#7CB88D" : "#93A99B", fontSize: 11 }}>
                    {pct > 0 ? "▲" : pct < 0 ? "▼" : "="} {fmtPct(Math.abs(pct))} vs mes anterior
                  </span>
                )}
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap", alignItems: "center" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 4, color: "#93A99B" }}>
                  <input type="checkbox" checked={g.estado === "pagado"} onChange={(e) => actualizar(g.id, { estado: e.target.checked ? "pagado" : "pendiente" })} />
                  Pagado
                </label>
                <select value={g.forma || ""} onChange={(e) => actualizar(g.id, { forma: e.target.value })} style={{ ...inputStyle, width: "auto", marginBottom: 0, fontSize: 12, padding: 6 }}>
                  <option value="">Forma de pago</option>
                  {FORMAS_PAGO.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
                <input
                  type="date"
                  value={g.vencimiento || ""}
                  onChange={(e) => actualizar(g.id, { vencimiento: e.target.value || null })}
                  style={{ ...inputStyle, width: "auto", marginBottom: 0, fontSize: 12, padding: 6 }}
                  title="Vencimiento"
                />
                <input
                  type="month"
                  value={g.periodo ? g.periodo.slice(0, 7) : ""}
                  onChange={(e) => actualizar(g.id, { periodo: e.target.value ? e.target.value + "-01" : null })}
                  style={{ ...inputStyle, width: "auto", marginBottom: 0, fontSize: 12, padding: 6 }}
                  title="Período del gasto"
                />
              </div>
            </li>
          );
        })}
        {gastosFijos.length === 0 && <p style={{ color: "#93A99B", fontSize: 12 }}>No cargaste gastos fijos este mes.</p>}
      </ul>

      <div style={{ fontSize: 14, color: "#D2A94C", marginBottom: 20 }}>
        Total gastos fijos: {fmtPesos(totales.totalGastosFijos)} — Saldo disponible: {fmtPesos(totales.saldoDisponible)}
      </div>

      <h2 style={{ fontSize: 14, color: "#93A99B", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Gastos fijos por concepto</h2>
      <PieChart items={pieItems} />
    </div>
  );
}

function NuevoGastoFijo({ onAgregar }) {
  const [concepto, setConcepto] = useState("");
  const [valor, setValor] = useState(0);
  const [vencimiento, setVencimiento] = useState("");
  const [forma, setForma] = useState("Débito automático");

  function submit(e) {
    e.preventDefault();
    if (!concepto) return;
    onAgregar({ concepto, valor: Number(valor), vencimiento: vencimiento || null, forma, estado: "pendiente" });
    setConcepto("");
    setValor(0);
    setVencimiento("");
  }

  return (
    <form onSubmit={submit} style={{ background: "#182B22", border: "1px solid #2B4137", borderRadius: 6, padding: 12, marginBottom: 16 }}>
      <input placeholder="Concepto" value={concepto} onChange={(e) => setConcepto(e.target.value)} required style={inputStyle} />
      <MoneyInput value={valor} onChange={setValor} placeholder="Valor" />
      <input type="date" value={vencimiento} onChange={(e) => setVencimiento(e.target.value)} style={inputStyle} />
      <select value={forma} onChange={(e) => setForma(e.target.value)} style={inputStyle}>
        {FORMAS_PAGO.map((f) => (
          <option key={f} value={f}>{f}</option>
        ))}
      </select>
      <button type="submit" style={{ ...inputStyle, cursor: "pointer", background: "#7CB88D", color: "#0F1913", fontWeight: 600, border: "none", marginBottom: 0 }}>
        Agregar gasto fijo
      </button>
    </form>
  );
}
