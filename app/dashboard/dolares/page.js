"use client";
import { useEffect, useRef, useState } from "react";
import { useMes } from "../../../lib/MesContext";
import { supabase } from "../../../lib/supabaseClient";
import MoneyInput, { inputStyle } from "../../../components/MoneyInput";
import { fmtPesos, fmtNumero } from "../../../lib/format";

const CASAS_MOSTRADAS = ["oficial", "blue"];
const DESTINOS = ["Efectivo", "Banco Galicia", "Banco Provincia", "Uala", "Mercado Pago", "Cocos Capital"];
const INTERVALO_MS = 30000;

export default function Dolares() {
  const { mes, datos, totales, recargarDatos } = useMes();
  const [actual, setActual] = useState(null);
  const [anterior, setAnterior] = useState(null);
  const [errorCotiz, setErrorCotiz] = useState(false);
  const actualRef = useRef(null);

  useEffect(() => {
    let activo = true;

    async function cargar() {
      try {
        const r = await fetch("https://dolarapi.com/v1/dolares");
        const data = await r.json();
        if (!activo) return;
        setAnterior(actualRef.current);
        actualRef.current = data;
        setActual(data);
        setErrorCotiz(false);
      } catch {
        if (activo) setErrorCotiz(true);
      }
    }

    cargar();
    const id = setInterval(cargar, INTERVALO_MS);
    return () => {
      activo = false;
      clearInterval(id);
    };
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

  const cotizaciones = actual ? CASAS_MOSTRADAS.map((casa) => actual.find((c) => c.casa === casa)).filter(Boolean) : [];

  return (
    <div>
      <h2 style={{ fontSize: 14, color: "#93A99B", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
        Cotizaciones de referencia
      </h2>
      {errorCotiz && !actual && <p style={{ color: "#93A99B", fontSize: 12 }}>No se pudieron cargar las cotizaciones ahora.</p>}
      {!errorCotiz && !actual && <p style={{ color: "#93A99B", fontSize: 12 }}>Cargando...</p>}
      {cotizaciones.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
          {cotizaciones.map((c) => {
            const prev = anterior?.find((p) => p.casa === c.casa);
            return (
              <div key={c.casa} style={{ background: "#182B22", border: "1px solid #2B4137", borderRadius: 6, padding: 8, fontSize: 12, minWidth: 130 }}>
                <div style={{ color: "#93A99B", marginBottom: 2 }}>{c.nombre}</div>
                <PrecioConFlecha label="Compra" valor={c.compra} anterior={prev?.compra} color="#7CB88D" />
                <PrecioConFlecha label="Venta" valor={c.venta} anterior={prev?.venta} color="#C97B6B" />
              </div>
            );
          })}
        </div>
      )}

      <h2 style={{ fontSize: 14, color: "#93A99B", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Ahorro en dólares</h2>
      <NuevaCompra onAgregar={agregar} />
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {compras.map((c) => {
          const precio = Number(c.cantidad_dolares) > 0 ? Number(c.monto_pesos) / Number(c.cantidad_dolares) : 0;
          return (
            <li key={c.id} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed #2B4137", padding: "8px 0", fontSize: 13 }}>
              <span>
                {c.fecha} {c.destino && <small style={{ opacity: 0.6 }}>· {c.destino}</small>}{" "}
                {precio > 0 && <small style={{ opacity: 0.6 }}>(a {fmtPesos(precio)})</small>}
              </span>
              <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ color: "#D2A94C" }}>{fmtPesos(c.monto_pesos)}</span>
                <span style={{ color: "#7CB88D" }}>US$ {fmtNumero(c.cantidad_dolares)}</span>
                <button onClick={() => eliminar(c.id)} style={{ background: "none", border: "none", color: "#C97B6B", cursor: "pointer" }}>×</button>
              </span>
            </li>
          );
        })}
        {compras.length === 0 && <p style={{ color: "#93A99B", fontSize: 12 }}>No cargaste compras de dólares este mes.</p>}
      </ul>

      <div style={{ fontSize: 14, color: "#D2A94C", marginTop: 16 }}>
        Total invertido: {fmtPesos(totales.totalDolaresPesos)} → US$ {fmtNumero(totales.totalDolaresCantidad)}
      </div>
      <div style={{ fontSize: 14, color: "#7CB88D", marginTop: 4 }}>Remanente proyectado del mes: {fmtPesos(totales.remanente)}</div>
    </div>
  );
}

function PrecioConFlecha({ label, valor, anterior, color }) {
  let flecha = null;
  if (anterior != null && Number(valor) !== Number(anterior)) {
    const subio = Number(valor) > Number(anterior);
    flecha = (
      <span style={{ color: subio ? "#7CB88D" : "#C97B6B", marginLeft: 4 }}>{subio ? "▲" : "▼"}</span>
    );
  }
  return (
    <div style={{ color }}>
      {label} {fmtPesos(valor)}
      {flecha}
    </div>
  );
}

function NuevaCompra({ onAgregar }) {
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [montoPesos, setMontoPesos] = useState(0);
  const [precioDolar, setPrecioDolar] = useState(0);
  const [destino, setDestino] = useState(DESTINOS[0]);

  const cantidadCalculada = Number(precioDolar) > 0 ? Number(montoPesos) / Number(precioDolar) : 0;

  function submit(e) {
    e.preventDefault();
    if (!montoPesos || !precioDolar) return;
    onAgregar({ fecha, monto_pesos: Number(montoPesos), cantidad_dolares: cantidadCalculada, destino });
    setMontoPesos(0);
    setPrecioDolar(0);
  }

  return (
    <form onSubmit={submit} style={{ background: "#182B22", border: "1px solid #2B4137", borderRadius: 6, padding: 12, marginBottom: 16 }}>
      <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} style={inputStyle} />
      <div style={{ fontSize: 11, color: "#93A99B", marginBottom: 2 }}>Dónde compraste</div>
      <select value={destino} onChange={(e) => setDestino(e.target.value)} style={inputStyle}>
        {DESTINOS.map((d) => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>
      <div style={{ fontSize: 11, color: "#93A99B", marginBottom: 2 }}>Monto en pesos que destinás a la compra</div>
      <MoneyInput value={montoPesos} onChange={setMontoPesos} placeholder="Monto en pesos" />
      <div style={{ fontSize: 11, color: "#93A99B", marginBottom: 2 }}>A cuánto compraste el dólar</div>
      <MoneyInput value={precioDolar} onChange={setPrecioDolar} placeholder="Precio del dólar" />
      {cantidadCalculada > 0 && (
        <p style={{ fontSize: 12, color: "#7CB88D", marginTop: -4 }}>Te da: US$ {fmtNumero(cantidadCalculada)}</p>
      )}
      <button type="submit" style={{ ...inputStyle, cursor: "pointer", background: "#7CB88D", color: "#0F1913", fontWeight: 600, border: "none", marginBottom: 0 }}>
        Agregar compra
      </button>
    </form>
  );
}
