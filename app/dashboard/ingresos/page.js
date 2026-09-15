"use client";
import { useState } from "react";
import { useMes } from "../../../lib/MesContext";
import { supabase } from "../../../lib/supabaseClient";
import MoneyInput, { inputStyle } from "../../../components/MoneyInput";
import PieChart from "../../../components/PieChart";
import { fmtPesos } from "../../../lib/format";
import { colorFor, FORMAS_PAGO } from "../../../lib/categorias";
import { periodoAnterior, formatoLargo } from "../../../lib/periodo";

export default function Ingresos() {
  const { mes, datos, totales, recargarMeses, recargarDatos } = useMes();

  if (!mes) return <p style={{ color: "#93A99B", fontSize: 13 }}>Creá un mes primero (arriba).</p>;

  const periodoHonorarios = formatoLargo(periodoAnterior(mes.periodo));
  const otrosIngresos = datos.otrosIngresos;
  const cobradoTransferencia =
    Number(mes.honorarios_transferencia || 0) + otrosIngresos.filter((o) => o.forma === "Transferencia").reduce((s, o) => s + Number(o.monto || 0), 0);
  const limite = Number(mes.limite_transferencia || 0);
  const pctLimite = limite > 0 ? Math.min(100, (cobradoTransferencia / limite) * 100) : 0;
  const pasadoLimite = limite > 0 && cobradoTransferencia > limite;

  async function actualizarMes(campos) {
    const { error } = await supabase.from("meses").update(campos).eq("id", mes.id);
    if (error) { alert(error.message); return; }
    await recargarMeses(mes.id);
  }

  async function agregarOtroIngreso(item) {
    const { error } = await supabase.from("otros_ingresos").insert({ ...item, mes_id: mes.id, user_id: mes.user_id });
    if (error) { alert(error.message); return; }
    await recargarDatos();
  }

  async function eliminarOtroIngreso(id) {
    const { error } = await supabase.from("otros_ingresos").delete().eq("id", id);
    if (error) { alert(error.message); return; }
    await recargarDatos();
  }

  const pieItems = [
    { name: "Honorarios (efectivo)", value: Number(mes.honorarios_efectivo || 0), color: colorFor("Honorarios (efectivo)") },
    { name: "Honorarios (transferencia)", value: Number(mes.honorarios_transferencia || 0), color: colorFor("Honorarios (transferencia)") },
    { name: "Remanente del mes anterior", value: Number(mes.remanente_anterior || 0), color: colorFor("Remanente del mes anterior") },
    ...otrosIngresos.map((o) => ({ name: o.concepto || "Otro ingreso", value: Number(o.monto || 0), color: colorFor(o.concepto || o.id) })),
  ];

  return (
    <div>
      <Seccion titulo={`Honorarios (${periodoHonorarios})`}>
        <label style={{ fontSize: 12, color: "#93A99B" }}>Efectivo</label>
        <MoneyInput value={mes.honorarios_efectivo} onChange={(v) => actualizarMes({ honorarios_efectivo: v })} placeholder="0" />
        <label style={{ fontSize: 12, color: "#93A99B" }}>Transferencia</label>
        <MoneyInput value={mes.honorarios_transferencia} onChange={(v) => actualizarMes({ honorarios_transferencia: v })} placeholder="0" />
        <div style={{ fontSize: 13, color: "#D2A94C", marginTop: 4 }}>
          Total: {fmtPesos(Number(mes.honorarios_efectivo || 0) + Number(mes.honorarios_transferencia || 0))}
        </div>
      </Seccion>

      <Seccion titulo="Remanente del mes anterior">
        <div style={{ fontSize: 15, color: "#7CB88D" }}>{fmtPesos(mes.remanente_anterior)}</div>
        <p style={{ fontSize: 11, color: "#93A99B" }}>Este valor se calcula solo cuando creás un mes nuevo desde Resumen.</p>
      </Seccion>

      <Seccion titulo="Límite mensual de transferencia">
        <MoneyInput value={mes.limite_transferencia || 0} onChange={(v) => actualizarMes({ limite_transferencia: v })} placeholder="0 = sin límite" />
        {limite > 0 && (
          <div style={{ marginTop: 6 }}>
            <div style={{ background: "#132019", borderRadius: 4, overflow: "hidden", height: 10 }}>
              <div style={{ width: `${pctLimite}%`, height: "100%", background: pasadoLimite ? "#C97B6B" : "#7CB88D" }} />
            </div>
            <div style={{ fontSize: 11, color: pasadoLimite ? "#C97B6B" : "#93A99B", marginTop: 4 }}>
              {fmtPesos(cobradoTransferencia)} de {fmtPesos(limite)} {pasadoLimite && "— superaste el límite"}
            </div>
          </div>
        )}
      </Seccion>

      <Seccion titulo="Otros ingresos">
        <OtroIngresoForm onAgregar={agregarOtroIngreso} />
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {otrosIngresos.map((o) => (
            <li key={o.id} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed #2B4137", padding: "8px 0", fontSize: 13 }}>
              <span>
                {o.concepto} {o.tipo && <small style={{ opacity: 0.6 }}>({o.tipo})</small>} <small style={{ opacity: 0.6 }}>{o.fecha}</small>
              </span>
              <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ color: "#7CB88D" }}>{fmtPesos(o.monto)}</span>
                <button onClick={() => eliminarOtroIngreso(o.id)} style={{ background: "none", border: "none", color: "#C97B6B", cursor: "pointer" }}>×</button>
              </span>
            </li>
          ))}
          {otrosIngresos.length === 0 && <p style={{ color: "#93A99B", fontSize: 12 }}>No cargaste otros ingresos este mes.</p>}
        </ul>
      </Seccion>

      <Seccion titulo="Distribución de ingresos">
        <PieChart items={pieItems} />
      </Seccion>

      <div style={{ fontSize: 14, color: "#D2A94C", marginTop: 12 }}>Fondos disponibles: {fmtPesos(totales.fondosDisponibles)}</div>
    </div>
  );
}

function OtroIngresoForm({ onAgregar }) {
  const [tipo, setTipo] = useState("");
  const [concepto, setConcepto] = useState("");
  const [monto, setMonto] = useState(0);
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [forma, setForma] = useState("Transferencia");

  function submit(e) {
    e.preventDefault();
    if (!concepto || !monto) return;
    onAgregar({ tipo, concepto, monto: Number(monto), fecha, forma });
    setTipo("");
    setConcepto("");
    setMonto(0);
  }

  return (
    <form onSubmit={submit} style={{ background: "#182B22", border: "1px solid #2B4137", borderRadius: 6, padding: 12, marginBottom: 12 }}>
      <input placeholder="Tipo (opcional)" value={tipo} onChange={(e) => setTipo(e.target.value)} style={inputStyle} />
      <input placeholder="Concepto" value={concepto} onChange={(e) => setConcepto(e.target.value)} required style={inputStyle} />
      <MoneyInput value={monto} onChange={setMonto} placeholder="Monto" />
      <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} style={inputStyle} />
      <select value={forma} onChange={(e) => setForma(e.target.value)} style={inputStyle}>
        {FORMAS_PAGO.map((f) => (
          <option key={f} value={f}>{f}</option>
        ))}
      </select>
      <button type="submit" style={{ ...inputStyle, cursor: "pointer", background: "#7CB88D", color: "#0F1913", fontWeight: 600, border: "none", marginBottom: 0 }}>
        Agregar ingreso
      </button>
    </form>
  );
}

function Seccion({ titulo, children }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <h2 style={{ fontSize: 14, color: "#93A99B", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>{titulo}</h2>
      {children}
    </div>
  );
}
