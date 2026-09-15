"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { fmtPesos } from "../../lib/format";
import { inputStyle } from "../../components/MoneyInput";
import MoneyInput from "../../components/MoneyInput";
import { CATEGORIAS, FORMAS_PAGO } from "../../lib/categorias";

export default function Rapido() {
  const [movimientos, setMovimientos] = useState([]);
  const [concepto, setConcepto] = useState("");
  const [monto, setMonto] = useState(0);
  const [tipo, setTipo] = useState("gasto");
  const [categoria, setCategoria] = useState("");
  const [forma, setForma] = useState("Efectivo");
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));

  useEffect(() => {
    cargarMovimientos();
  }, []);

  async function cargarMovimientos() {
    const { data } = await supabase
      .from("movimientos")
      .select("*")
      .order("fecha", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(50);
    setMovimientos(data || []);
  }

  async function agregar(e) {
    e.preventDefault();
    if (!monto) return;
    await supabase.from("movimientos").insert({
      concepto: concepto || null,
      monto: Number(monto),
      tipo,
      categoria: categoria || null,
      forma,
      fecha,
    });
    setConcepto("");
    setMonto(0);
    setCategoria("");
    cargarMovimientos();
  }

  async function eliminar(id) {
    await supabase.from("movimientos").delete().eq("id", id);
    cargarMovimientos();
  }

  const totalIngresos = movimientos.filter((m) => (m.tipo || "").toLowerCase() === "ingreso").reduce((s, m) => s + Number(m.monto), 0);
  const totalGastos = movimientos.filter((m) => (m.tipo || "").toLowerCase() === "gasto").reduce((s, m) => s + Number(m.monto), 0);

  return (
    <div>
      <p style={{ color: "#93A99B", fontSize: 12, marginTop: 0 }}>
        Carga rápida de un movimiento suelto (esta es la misma tabla que usa el Atajo del iPhone). Para el presupuesto
        mensual completo usá las otras pestañas.
      </p>

      <div style={{ display: "flex", gap: 12, marginBottom: 20, fontSize: 13 }}>
        <div style={{ flex: 1, background: "#182B22", border: "1px solid #2B4137", borderRadius: 6, padding: 10 }}>
          <div style={{ color: "#93A99B" }}>Ingresos (últimos 50)</div>
          <div style={{ color: "#7CB88D", fontSize: 16 }}>{fmtPesos(totalIngresos)}</div>
        </div>
        <div style={{ flex: 1, background: "#182B22", border: "1px solid #2B4137", borderRadius: 6, padding: 10 }}>
          <div style={{ color: "#93A99B" }}>Gastos (últimos 50)</div>
          <div style={{ color: "#C97B6B", fontSize: 16 }}>{fmtPesos(totalGastos)}</div>
        </div>
      </div>

      <form onSubmit={agregar} style={{ marginBottom: 24, background: "#182B22", border: "1px solid #2B4137", borderRadius: 6, padding: 12 }}>
        <select value={tipo} onChange={(e) => setTipo(e.target.value)} style={inputStyle}>
          <option value="gasto">Gasto</option>
          <option value="ingreso">Ingreso</option>
        </select>
        <select value={forma} onChange={(e) => setForma(e.target.value)} style={inputStyle}>
          {FORMAS_PAGO.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
        <MoneyInput value={monto} onChange={setMonto} placeholder="Monto" />
        {tipo === "gasto" && (
          <select value={categoria} onChange={(e) => setCategoria(e.target.value)} style={inputStyle}>
            <option value="">Sin categoría</option>
            {CATEGORIAS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        )}
        <input placeholder="Concepto (opcional)" value={concepto} onChange={(e) => setConcepto(e.target.value)} style={inputStyle} />
        <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} style={inputStyle} />
        <button type="submit" style={{ ...inputStyle, cursor: "pointer", background: "#7CB88D", color: "#0F1913", fontWeight: 600, border: "none", marginBottom: 0 }}>
          Agregar
        </button>
      </form>

      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {movimientos.map((m) => (
          <li key={m.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px dashed #2B4137", padding: "10px 0" }}>
            <span>
              {m.concepto || m.categoria || "(sin concepto)"} <small style={{ opacity: 0.6 }}>({m.fecha})</small>
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: (m.tipo || "").toLowerCase() === "ingreso" ? "#7CB88D" : "#C97B6B" }}>
                {(m.tipo || "").toLowerCase() === "ingreso" ? "+" : "-"}
                {fmtPesos(m.monto)}
              </span>
              <button onClick={() => eliminar(m.id)} style={{ background: "none", border: "none", color: "#C97B6B", cursor: "pointer", fontSize: 16 }}>
                ×
              </button>
            </span>
          </li>
        ))}
        {movimientos.length === 0 && <p style={{ color: "#93A99B", fontSize: 13 }}>Todavía no cargaste nada. Probá agregar algo arriba, o desde el Atajo del iPhone.</p>}
      </ul>
    </div>
  );
}
