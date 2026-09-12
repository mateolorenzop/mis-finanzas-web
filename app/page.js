"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

const inputStyle = {
  display: "block",
  width: "100%",
  marginBottom: 8,
  padding: 10,
  background: "#182B22",
  border: "1px solid #2B4137",
  color: "#EFE9DA",
  borderRadius: 4,
  boxSizing: "border-box",
};

function fmtPesos(v) {
  return "$" + Math.round(Number(v) || 0).toLocaleString("es-AR");
}

export default function Dashboard() {
  const [session, setSession] = useState(null);
  const [movimientos, setMovimientos] = useState([]);
  const [concepto, setConcepto] = useState("");
  const [monto, setMonto] = useState("");
  const [tipo, setTipo] = useState("gasto");
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.push("/login");
        return;
      }
      setSession(data.session);
      cargarMovimientos();
    });
  }, [router]);

  async function cargarMovimientos() {
    const { data } = await supabase.from("movimientos").select("*").order("fecha", { ascending: false }).order("created_at", { ascending: false });
    setMovimientos(data || []);
  }

  async function agregar(e) {
    e.preventDefault();
    if (!concepto || !monto) return;
    await supabase.from("movimientos").insert({ concepto, monto: Number(monto), tipo, fecha });
    setConcepto("");
    setMonto("");
    cargarMovimientos();
  }

  async function eliminar(id) {
    await supabase.from("movimientos").delete().eq("id", id);
    cargarMovimientos();
  }

  async function cerrarSesion() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (!session) return null;

  const totalIngresos = movimientos.filter((m) => m.tipo === "ingreso").reduce((s, m) => s + Number(m.monto), 0);
  const totalGastos = movimientos.filter((m) => m.tipo === "gasto").reduce((s, m) => s + Number(m.monto), 0);

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px 16px", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, margin: 0 }}>Mis finanzas</h1>
        <button onClick={cerrarSesion} style={{ background: "none", border: "none", color: "#93A99B", textDecoration: "underline", cursor: "pointer", fontSize: 13 }}>
          Salir
        </button>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 20, fontSize: 13 }}>
        <div style={{ flex: 1, background: "#182B22", border: "1px solid #2B4137", borderRadius: 6, padding: 10 }}>
          <div style={{ color: "#93A99B" }}>Ingresos</div>
          <div style={{ color: "#7CB88D", fontSize: 16 }}>{fmtPesos(totalIngresos)}</div>
        </div>
        <div style={{ flex: 1, background: "#182B22", border: "1px solid #2B4137", borderRadius: 6, padding: 10 }}>
          <div style={{ color: "#93A99B" }}>Gastos</div>
          <div style={{ color: "#C97B6B", fontSize: 16 }}>{fmtPesos(totalGastos)}</div>
        </div>
      </div>

      <form onSubmit={agregar} style={{ marginBottom: 24, background: "#182B22", border: "1px solid #2B4137", borderRadius: 6, padding: 12 }}>
        <input placeholder="Concepto" value={concepto} onChange={(e) => setConcepto(e.target.value)} required style={inputStyle} />
        <input type="number" placeholder="Monto" value={monto} onChange={(e) => setMonto(e.target.value)} required style={inputStyle} />
        <select value={tipo} onChange={(e) => setTipo(e.target.value)} style={inputStyle}>
          <option value="gasto">Gasto</option>
          <option value="ingreso">Ingreso</option>
        </select>
        <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} style={inputStyle} />
        <button type="submit" style={{ ...inputStyle, cursor: "pointer", background: "#7CB88D", color: "#0F1913", fontWeight: 600, border: "none", marginBottom: 0 }}>
          Agregar
        </button>
      </form>

      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {movimientos.map((m) => (
          <li key={m.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px dashed #2B4137", padding: "10px 0" }}>
            <span>
              {m.concepto} <small style={{ opacity: 0.6 }}>({m.fecha})</small>
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: m.tipo === "ingreso" ? "#7CB88D" : "#C97B6B" }}>
                {m.tipo === "ingreso" ? "+" : "-"}
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
