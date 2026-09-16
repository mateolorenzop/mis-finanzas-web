"use client";
import { useState } from "react";
import { useMes } from "../../../lib/MesContext";
import { supabase } from "../../../lib/supabaseClient";
import MoneyInput, { inputStyle } from "../../../components/MoneyInput";
import PieChart from "../../../components/PieChart";
import { fmtPesos } from "../../../lib/format";
import { colorFor, FORMAS_PAGO_INGRESOS, TIPOS_INGRESO } from "../../../lib/categorias";
import { periodoAnterior, formatoLargo } from "../../../lib/periodo";

export default function Ingresos() {
  const { mes, datos, totales, recargarMeses, recargarDatos } = useMes();

  if (!mes) return <p style={{ color: "#8C9EC9", fontSize: 13 }}>Creá un mes primero (arriba).</p>;

  const periodoHonorarios = formatoLargo(periodoAnterior(mes.periodo));
  const ingresos = [
    ...datos.otrosIngresos.map((o) => ({ ...o, _origen: "otros_ingresos" })),
    ...datos.movimientosIngreso.map((m) => ({ ...m, _origen: "movimientos" })),
  ].sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
  const cobradoTransferencia =
    Number(mes.honorarios_transferencia || 0) + ingresos.filter((o) => o.forma === "Transferencia").reduce((s, o) => s + Number(o.monto || 0), 0);
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

  async function eliminarIngreso(item) {
    const tabla = item._origen === "movimientos" ? "movimientos" : "otros_ingresos";
    const { error } = await supabase.from(tabla).delete().eq("id", item.id);
    if (error) { alert(error.message); return; }
    await recargarDatos();
  }

  function nombreIngreso(o) {
    if (o.tipo && o.concepto) return `${o.tipo} — ${o.concepto}`;
    if (o.tipo) return o.tipo;
    return o.concepto || o.categoria || "Ingreso";
  }

  function claveOrdenTipo(o) {
    const idx = TIPOS_INGRESO.indexOf(o.tipo);
    return idx === -1 ? TIPOS_INGRESO.length : idx;
  }

  const ingresosOrdenados = [...ingresos].sort((a, b) => claveOrdenTipo(a) - claveOrdenTipo(b));

  const pieItems = [
    {
      name: "Honorarios",
      value: Number(mes.honorarios_efectivo || 0) + Number(mes.honorarios_transferencia || 0),
      color: colorFor("Honorarios"),
    },
    { name: "Remanente del mes anterior", value: Number(mes.remanente_anterior || 0), color: colorFor("Remanente del mes anterior") },
    ...ingresosOrdenados.map((o) => ({ name: nombreIngreso(o), value: Number(o.monto || 0), color: colorFor(nombreIngreso(o)) })),
  ];

  return (
    <div>
      <Seccion titulo={`Honorarios (${periodoHonorarios})`}>
        <label style={{ fontSize: 12, color: "#8C9EC9" }}>Efectivo</label>
        <MoneyInput value={mes.honorarios_efectivo} onChange={(v) => actualizarMes({ honorarios_efectivo: v })} placeholder="0" />
        <label style={{ fontSize: 12, color: "#8C9EC9" }}>Transferencia</label>
        <MoneyInput value={mes.honorarios_transferencia} onChange={(v) => actualizarMes({ honorarios_transferencia: v })} placeholder="0" />
        <div style={{ fontSize: 13, color: "#D2A94C", marginTop: 4 }}>
          Total: {fmtPesos(Number(mes.honorarios_efectivo || 0) + Number(mes.honorarios_transferencia || 0))}
        </div>
      </Seccion>

      <Seccion titulo="Remanente del mes anterior">
        <MoneyInput value={mes.remanente_anterior || 0} onChange={(v) => actualizarMes({ remanente_anterior: v })} placeholder="0" />
        <p style={{ fontSize: 11, color: "#8C9EC9" }}>Se completa solo cuando creás un mes nuevo desde Resumen, pero podés corregirlo acá.</p>
      </Seccion>

      <Seccion titulo="Límite mensual de transferencia">
        <MoneyInput value={mes.limite_transferencia || 0} onChange={(v) => actualizarMes({ limite_transferencia: v })} placeholder="0 = sin límite" />
        {limite > 0 && (
          <div style={{ marginTop: 6 }}>
            <div style={{ background: "#0B1730", borderRadius: 4, overflow: "hidden", height: 10 }}>
              <div style={{ width: `${pctLimite}%`, height: "100%", background: pasadoLimite ? "#C97B6B" : "#4FD1A5" }} />
            </div>
            <div style={{ fontSize: 11, color: pasadoLimite ? "#C97B6B" : "#8C9EC9", marginTop: 4 }}>
              {fmtPesos(cobradoTransferencia)} de {fmtPesos(limite)}{" "}
              {pasadoLimite
                ? `— te pasaste por ${fmtPesos(cobradoTransferencia - limite)}`
                : `— te quedan disponibles ${fmtPesos(limite - cobradoTransferencia)}`}
            </div>
          </div>
        )}
      </Seccion>

      <Seccion titulo="Ingresos">
        <p style={{ fontSize: 11, color: "#8C9EC9", marginTop: -4 }}>
          Acá aparece lo que cargues abajo, y también lo que anotes como &quot;Ingreso&quot; desde el Atajo del iPhone.
        </p>
        <OtroIngresoForm onAgregar={agregarOtroIngreso} />
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {ingresos.map((o) => (
            <li key={`${o._origen}-${o.id}`} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed #26385C", padding: "8px 0", fontSize: 13 }}>
              <span>
                {o.concepto || o.tipo || o.categoria || "Ingreso"}{" "}
                {o.concepto && o.tipo && <small style={{ opacity: 0.6 }}>({o.tipo})</small>} <small style={{ opacity: 0.6 }}>{o.fecha}</small>
              </span>
              <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ color: "#4FD1A5" }}>{fmtPesos(o.monto)}</span>
                <button onClick={() => eliminarIngreso(o)} style={{ background: "none", border: "none", color: "#C97B6B", cursor: "pointer" }}>×</button>
              </span>
            </li>
          ))}
          {ingresos.length === 0 && <p style={{ color: "#8C9EC9", fontSize: 12 }}>No cargaste ingresos este mes.</p>}
        </ul>
      </Seccion>

      <Seccion titulo="Distribución de ingresos">
        <PieChart items={pieItems} sortByValue={false} />
      </Seccion>

      <div style={{ fontSize: 14, color: "#D2A94C", marginTop: 12 }}>Fondos disponibles: {fmtPesos(totales.fondosDisponibles)}</div>
    </div>
  );
}

function OtroIngresoForm({ onAgregar }) {
  const [tipo, setTipo] = useState(TIPOS_INGRESO[0]);
  const [concepto, setConcepto] = useState("");
  const [monto, setMonto] = useState(0);
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [forma, setForma] = useState("Transferencia");

  function submit(e) {
    e.preventDefault();
    if (!monto) return;
    onAgregar({ tipo, concepto: concepto || "", monto: Number(monto), fecha, forma });
    setConcepto("");
    setMonto(0);
  }

  return (
    <form onSubmit={submit} style={{ background: "#142440", border: "1px solid #26385C", borderRadius: 6, padding: 12, marginBottom: 12 }}>
      <select value={tipo} onChange={(e) => setTipo(e.target.value)} style={inputStyle}>
        {TIPOS_INGRESO.map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>
      <input placeholder="Concepto (opcional)" value={concepto} onChange={(e) => setConcepto(e.target.value)} style={inputStyle} />
      <MoneyInput value={monto} onChange={setMonto} placeholder="Monto" />
      <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} style={inputStyle} />
      <select value={forma} onChange={(e) => setForma(e.target.value)} style={inputStyle}>
        {FORMAS_PAGO_INGRESOS.map((f) => (
          <option key={f} value={f}>{f}</option>
        ))}
      </select>
      <button type="submit" style={{ ...inputStyle, cursor: "pointer", background: "#4FD1A5", color: "#071022", fontWeight: 600, border: "none", marginBottom: 0 }}>
        Agregar ingreso
      </button>
    </form>
  );
}

function Seccion({ titulo, children }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <h2 style={{ fontSize: 14, color: "#8C9EC9", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>{titulo}</h2>
      {children}
    </div>
  );
}
