"use client";
import { useEffect, useState } from "react";
import { useMes } from "../../../lib/MesContext";
import { supabase } from "../../../lib/supabaseClient";
import MoneyInput, { inputStyle } from "../../../components/MoneyInput";
import { fmtPesos, fmtNumero } from "../../../lib/format";

export default function Dolares() {
  const { mes, datos, totales, recargarDatos } = useMes();
  const [cotizaciones, setCotizaciones] = useState(null);
  const [errorCotiz, setErrorCotiz] = useState(false);

  useEffect(() => {
    fetch("https://dolarapi.com/v1/dolares")
      .then((r) => r.json())
      .then(setCotizaciones)
      .catch(() => setErrorCotiz(true));
  }, []);

  if (!mes) return <p style={{ color: "#93A99B", fontSize: 13 }}>Creá un mes primero (arriba).</p>;

  const compras = datos.comprasDolares;

  async function agregar(item) {
    const { error } = await supabase.from("compras_dolares").insert({ ...item, mes_id: mes.id, user_id: mes.user_id });
    if (error) { alert(error.message); return; }
    await recargarDatos();
  }

  async function eliminar(id) {
    const { error } = await supabase.from("compras_dolares").delete().eq("id", id);
    if (error) { alert(error.message); return; }
    await recargarDatos();
  }

  return (
    <div>
      <h2 style={{ fontSize: 14, color: "#93A99B", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
        Cotizaciones de referencia
      </h2>
      {errorCotiz && <p style={{ color: "#93A99B", fontSize: 12 }}>No se pudieron cargar las cotizaciones ahora.</p>}
      {!errorCotiz && !cotizaciones && <p style={{ color: "#93A99B", fontSize: 12 }}>Cargando...</p>}
      {cotizaciones && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
          {cotizaciones.map((c) => (
            <div key={c.casa} style={{ background: "#182B22", border: "1px solid #2B4137", borderRadius: 6, padding: 8, fontSize: 12, minWidth: 110 }}>
              <div style={{ color: "#93A99B" }}>{c.nombre}</div>
              <div style={{ color: "#7CB88D" }}>Compra {fmtPesos(c.compra)}</div>
              <div style={{ color: "#C97B6B" }}>Venta {fmtPesos(c.venta)}</div>
            </div>
          ))}
        </div>
      )}

      <h2 style={{ fontSize: 14, color: "#93A99B", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Ahorro en dólares</h2>
      <NuevaCompra onAgregar={agregar} />
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {compras.map((c) => (
          <li key={c.id} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed #2B4137", padding: "8px 0", fontSize: 13 }}>
            <span>{c.fecha}</span>
            <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ color: "#D2A94C" }}>{fmtPesos(c.monto_pesos)}</span>
              <span style={{ color: "#7CB88D" }}>US$ {fmtNumero(c.cantidad_dolares)}</span>
              <button onClick={() => eliminar(c.id)} style={{ background: "none", border: "none", color: "#C97B6B", cursor: "pointer" }}>×</button>
            </span>
          </li>
        ))}
        {compras.length === 0 && <p style={{ color: "#93A99B", fontSize: 12 }}>No cargaste compras de dólares este mes.</p>}
      </ul>

      <div style={{ fontSize: 14, color: "#D2A94C", marginTop: 16 }}>
        Total invertido: {fmtPesos(totales.totalDolaresPesos)} → US$ {fmtNumero(totales.totalDolaresCantidad)}
      </div>
      <div style={{ fontSize: 14, color: "#7CB88D", marginTop: 4 }}>Remanente proyectado del mes: {fmtPesos(totales.remanente)}</div>
    </div>
  );
}

function NuevaCompra({ onAgregar }) {
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [montoPesos, setMontoPesos] = useState(0);
  const [cantidadDolares, setCantidadDolares] = useState(0);

  function submit(e) {
    e.preventDefault();
    if (!montoPesos || !cantidadDolares) return;
    onAgregar({ fecha, monto_pesos: Number(montoPesos), cantidad_dolares: Number(cantidadDolares) });
    setMontoPesos(0);
    setCantidadDolares(0);
  }

  return (
    <form onSubmit={submit} style={{ background: "#182B22", border: "1px solid #2B4137", borderRadius: 6, padding: 12, marginBottom: 16 }}>
      <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} style={inputStyle} />
      <MoneyInput value={montoPesos} onChange={setMontoPesos} placeholder="Monto en pesos" />
      <MoneyInput value={cantidadDolares} onChange={setCantidadDolares} placeholder="Cantidad de dólares" />
      <button type="submit" style={{ ...inputStyle, cursor: "pointer", background: "#7CB88D", color: "#0F1913", fontWeight: 600, border: "none", marginBottom: 0 }}>
        Agregar compra
      </button>
    </form>
  );
}
