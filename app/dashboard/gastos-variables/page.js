"use client";
import { useEffect, useState } from "react";
import { useMes } from "../../../lib/MesContext";
import { supabase } from "../../../lib/supabaseClient";
import MoneyInput, { inputStyle } from "../../../components/MoneyInput";
import PieChart from "../../../components/PieChart";
import { fmtPesos, fmtPct } from "../../../lib/format";
import { colorFor, CATEGORIAS, BANCOS, FORMAS_PAGO, BANCOS_CON_RED, REDES_TARJETA } from "../../../lib/categorias";
import { varItemTotal, fetchTarjetasPorPeriodo } from "../../../lib/mes";
import { periodoAnterior } from "../../../lib/periodo";

const TARJETA = "Tarjeta de crédito";

export default function GastosVariables() {
  const { mes, datos, totales, recargarDatos } = useMes();
  const [tarjetasAnteriores, setTarjetasAnteriores] = useState([]);

  useEffect(() => {
    if (!mes) return;
    fetchTarjetasPorPeriodo(mes.user_id, periodoAnterior(mes.periodo)).then(setTarjetasAnteriores).catch(() => setTarjetasAnteriores([]));
  }, [mes]);

  if (!mes) return <p style={{ color: "#8C9EC9", fontSize: 13 }}>Creá un mes primero (arriba).</p>;

  const { gastosVariables, tarjetaMotivos, movimientosGasto } = datos;
  const normales = [
    ...gastosVariables.filter((g) => (g.categoria || "").trim() !== TARJETA).map((g) => ({ ...g, _origen: "gastos_variables" })),
    ...movimientosGasto.map((m) => ({ ...m, _origen: "movimientos" })),
  ].sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
  const tarjetas = gastosVariables.filter((g) => (g.categoria || "").trim() === TARJETA);

  async function agregarNormal(item) {
    const { error } = await supabase.from("gastos_variables").insert({ ...item, mes_id: mes.id, user_id: mes.user_id });
    if (error) { alert(error.message); return; }
    await recargarDatos();
  }

  async function eliminarNormal(item) {
    const tabla = item._origen === "movimientos" ? "movimientos" : "gastos_variables";
    const { error } = await supabase.from(tabla).delete().eq("id", item.id);
    if (error) { alert(error.message); return; }
    await recargarDatos();
  }

  async function agregarMotivo({ banco, bancoOtro, red, motivo, valorCuota, cuotaActual, cuotaTotal, fecha, forma }) {
    const nombreTarjeta =
      banco === "Otro" ? bancoOtro || "Otro" : BANCOS_CON_RED.includes(banco) ? `${banco} (${red})` : banco;
    let item = tarjetas.find((t) => (t.concepto || "") === nombreTarjeta);
    let itemId = item?.id;
    if (!itemId) {
      const { data, error } = await supabase
        .from("gastos_variables")
        .insert({ mes_id: mes.id, user_id: mes.user_id, categoria: TARJETA, concepto: nombreTarjeta, monto: 0, fecha: null, forma })
        .select()
        .single();
      if (error) { alert(error.message); return; }
      itemId = data.id;
    }
    const { error: errM } = await supabase.from("tarjeta_motivos").insert({
      gasto_variable_id: itemId,
      user_id: mes.user_id,
      tarjeta: banco,
      tarjeta_otro: banco === "Otro" ? bancoOtro : null,
      motivo,
      valor_cuota: Number(valorCuota),
      cuota_actual: Number(cuotaActual) || 1,
      cuota_total: Number(cuotaTotal) || 1,
      fecha: fecha || null,
    });
    if (errM) { alert(errM.message); return; }
    await recargarDatos();
  }

  async function eliminarMotivo(motivoId, gastoVariableId) {
    const { error } = await supabase.from("tarjeta_motivos").delete().eq("id", motivoId);
    if (error) { alert(error.message); return; }
    const restantes = tarjetaMotivos.filter((m) => m.gasto_variable_id === gastoVariableId && m.id !== motivoId);
    if (restantes.length === 0) {
      await supabase.from("gastos_variables").delete().eq("id", gastoVariableId);
    }
    await recargarDatos();
  }

  function aumentoPctTarjeta(concepto, totalActual) {
    const previo = tarjetasAnteriores.find((t) => (t.concepto || "").trim().toLowerCase() === (concepto || "").trim().toLowerCase());
    if (!previo || !previo.total) return null;
    return ((Number(totalActual) - Number(previo.total)) / Number(previo.total)) * 100;
  }

  const totalesPorCategoria = {};
  for (const g of gastosVariables) {
    const t = varItemTotal(g, tarjetaMotivos);
    totalesPorCategoria[g.categoria] = (totalesPorCategoria[g.categoria] || 0) + t;
  }
  for (const m of movimientosGasto) {
    const cat = m.categoria || "Otro";
    totalesPorCategoria[cat] = (totalesPorCategoria[cat] || 0) + Number(m.monto || 0);
  }
  const pieItems = Object.entries(totalesPorCategoria).map(([categoria, value]) => ({
    name: categoria,
    value,
    color: colorFor(categoria),
  }));

  return (
    <div>
      <p style={{ fontSize: 11, color: "#8C9EC9", marginTop: -4 }}>
        Acá aparece lo que cargues abajo, y también lo que anotes como &quot;Gasto&quot; desde el Atajo del iPhone.
      </p>
      <NuevoGastoVariable onAgregarNormal={agregarNormal} onAgregarMotivo={agregarMotivo} />

      <ul style={{ listStyle: "none", padding: 0, margin: 0, marginBottom: 12 }}>
        {normales.map((g) => (
          <li key={`${g._origen}-${g.id}`} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed #26385C", padding: "8px 0", fontSize: 13 }}>
            <span>
              <span style={{ color: colorFor(g.categoria) }}>●</span> {g.categoria || "Sin categoría"} {g.concepto && <small style={{ opacity: 0.7 }}>— {g.concepto}</small>}{" "}
              <small style={{ opacity: 0.6 }}>{g.fecha}</small>
            </span>
            <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ color: "#C97B6B" }}>{fmtPesos(g.monto)}</span>
              <button onClick={() => eliminarNormal(g)} style={{ background: "none", border: "none", color: "#C97B6B", cursor: "pointer" }}>×</button>
            </span>
          </li>
        ))}
        {normales.length === 0 && <p style={{ color: "#8C9EC9", fontSize: 12 }}>No cargaste gastos variables este mes.</p>}
      </ul>

      {tarjetas.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <h3 style={{ fontSize: 13, color: "#8C9EC9", marginBottom: 6 }}>Tarjetas de crédito</h3>
          {tarjetas.map((t) => {
            const motivos = tarjetaMotivos.filter((m) => m.gasto_variable_id === t.id);
            const totalTarjeta = motivos.reduce((s, m) => s + Number(m.valor_cuota || 0), 0);
            const pct = aumentoPctTarjeta(t.concepto, totalTarjeta);
            return (
              <div key={t.id} style={{ background: "#142440", border: "1px solid #26385C", borderRadius: 6, padding: 10, marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
                  <strong style={{ color: "#E7ECF7" }}>{t.concepto}</strong>
                  <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {pct != null && (
                      <span style={{ color: pct > 0 ? "#C97B6B" : pct < 0 ? "#4FD1A5" : "#8C9EC9", fontSize: 11 }}>
                        {pct > 0 ? "▲" : pct < 0 ? "▼" : "="} {fmtPct(Math.abs(pct))}
                      </span>
                    )}
                    <span style={{ color: "#C97B6B" }}>{fmtPesos(totalTarjeta)}</span>
                  </span>
                </div>
                <ul style={{ listStyle: "none", padding: 0, margin: "6px 0 0" }}>
                  {motivos.map((m) => (
                    <li key={m.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0", borderTop: "1px dashed #26385C" }}>
                      <span>
                        {m.motivo || "(sin motivo)"} — cuota {m.cuota_actual}/{m.cuota_total} <small style={{ opacity: 0.6 }}>{m.fecha}</small>
                      </span>
                      <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <span style={{ color: "#D2A94C" }}>{fmtPesos(m.valor_cuota)}</span>
                        <button onClick={() => eliminarMotivo(m.id, t.id)} style={{ background: "none", border: "none", color: "#C97B6B", cursor: "pointer" }}>×</button>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ fontSize: 14, color: "#D2A94C", marginBottom: 20 }}>Total gastos variables: {fmtPesos(totales.totalGastosVariables)}</div>

      <h2 style={{ fontSize: 14, color: "#8C9EC9", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Gastos variables por categoría</h2>
      <PieChart items={pieItems} />
    </div>
  );
}

function NuevoGastoVariable({ onAgregarNormal, onAgregarMotivo }) {
  const [categoria, setCategoria] = useState(CATEGORIAS[0]);
  const [monto, setMonto] = useState(0);
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [forma, setForma] = useState("Efectivo");
  const [concepto, setConcepto] = useState("");

  const [banco, setBanco] = useState(BANCOS[0]);
  const [bancoOtro, setBancoOtro] = useState("");
  const [red, setRed] = useState(REDES_TARJETA[0]);
  const [motivo, setMotivo] = useState("");
  const [valorCuota, setValorCuota] = useState(0);
  const [cuotaActual, setCuotaActual] = useState(1);
  const [cuotaTotal, setCuotaTotal] = useState(1);

  const esTarjeta = categoria === TARJETA;

  function submitNormal(e) {
    e.preventDefault();
    if (!monto) return;
    onAgregarNormal({ categoria, monto: Number(monto), fecha, forma, concepto: concepto || null });
    setMonto(0);
    setConcepto("");
  }

  function submitMotivo(e) {
    e.preventDefault();
    if (!motivo || !valorCuota) return;
    onAgregarMotivo({ banco, bancoOtro, red, motivo, valorCuota, cuotaActual, cuotaTotal, fecha, forma });
    setMotivo("");
    setValorCuota(0);
    setCuotaActual(1);
    setCuotaTotal(1);
  }

  return (
    <div style={{ background: "#142440", border: "1px solid #26385C", borderRadius: 6, padding: 12, marginBottom: 16 }}>
      <select value={categoria} onChange={(e) => setCategoria(e.target.value)} style={inputStyle}>
        {CATEGORIAS.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

      {!esTarjeta ? (
        <form onSubmit={submitNormal}>
          <MoneyInput value={monto} onChange={setMonto} placeholder="Monto" />
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} style={inputStyle} />
          <select value={forma} onChange={(e) => setForma(e.target.value)} style={inputStyle}>
            {FORMAS_PAGO.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
          <input placeholder="Concepto (opcional)" value={concepto} onChange={(e) => setConcepto(e.target.value)} style={inputStyle} />
          <button type="submit" style={{ ...inputStyle, cursor: "pointer", background: "#4FD1A5", color: "#071022", fontWeight: 600, border: "none", marginBottom: 0 }}>
            Agregar gasto
          </button>
        </form>
      ) : (
        <form onSubmit={submitMotivo}>
          <select value={banco} onChange={(e) => setBanco(e.target.value)} style={inputStyle}>
            {BANCOS.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
          {banco === "Otro" && (
            <input placeholder="Nombre de la tarjeta" value={bancoOtro} onChange={(e) => setBancoOtro(e.target.value)} style={inputStyle} />
          )}
          {BANCOS_CON_RED.includes(banco) && (
            <select value={red} onChange={(e) => setRed(e.target.value)} style={inputStyle}>
              {REDES_TARJETA.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          )}
          <input placeholder="Motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)} style={inputStyle} />
          <button
            type="button"
            onClick={() => setMotivo("Impuesto de sellos")}
            style={{ fontSize: 11, color: "#8C9EC9", background: "none", border: "1px dashed #26385C", borderRadius: 4, padding: "4px 8px", cursor: "pointer", marginBottom: 8 }}
          >
            + agregar impuesto de sellos
          </button>
          <MoneyInput value={valorCuota} onChange={setValorCuota} placeholder="Valor por cuota" />
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="number"
              min={1}
              placeholder="Cuota actual"
              value={cuotaActual}
              onChange={(e) => setCuotaActual(e.target.value)}
              style={{ ...inputStyle, flex: 1 }}
            />
            <input
              type="number"
              min={1}
              placeholder="Cuota total"
              value={cuotaTotal}
              onChange={(e) => setCuotaTotal(e.target.value)}
              style={{ ...inputStyle, flex: 1 }}
            />
          </div>
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} style={inputStyle} />
          <button type="submit" style={{ ...inputStyle, cursor: "pointer", background: "#4FD1A5", color: "#071022", fontWeight: 600, border: "none", marginBottom: 0 }}>
            Agregar compra con tarjeta
          </button>
        </form>
      )}
    </div>
  );
}
