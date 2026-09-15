"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../lib/supabaseClient";
import { MesContext } from "../../lib/MesContext";
import { fetchMeses, fetchMesCompleto, crearMes, crearMesSiguiente, calcularTotales, eliminarMes } from "../../lib/mes";
import { formatoCorto, periodoActual } from "../../lib/periodo";

const TABS = [
  { href: "/dashboard/ingresos", label: "Ingresos" },
  { href: "/dashboard/gastos-fijos", label: "Gastos fijos" },
  { href: "/dashboard/gastos-variables", label: "Gastos variables" },
  { href: "/dashboard/dolares", label: "Dólares" },
  { href: "/dashboard/resumen", label: "Resumen" },
  { href: "/dashboard/historial", label: "Historial" },
];

const DATOS_VACIOS = {
  gastosFijos: [],
  gastosVariables: [],
  tarjetaMotivos: [],
  otrosIngresos: [],
  comprasDolares: [],
  movimientosGasto: [],
  movimientosIngreso: [],
};

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState(null);
  const [meses, setMeses] = useState([]);
  const [mesId, setMesId] = useState(null);
  const [datos, setDatos] = useState(DATOS_VACIOS);
  const [loading, setLoading] = useState(true);
  const [confirmandoBorrar, setConfirmandoBorrar] = useState(false);

  const recargarMeses = useCallback(async (preferirId) => {
    const lista = await fetchMeses();
    setMeses(lista);
    if (lista.length === 0) {
      setMesId(null);
      return null;
    }
    const elegido = preferirId && lista.some((m) => m.id === preferirId) ? preferirId : lista[0].id;
    setMesId(elegido);
    return elegido;
  }, []);

  useEffect(() => {
    let activo = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!activo) return;
      if (!data.session) {
        router.push("/login");
        return;
      }
      setSession(data.session);
      await recargarMeses();
      setLoading(false);
    });
    return () => {
      activo = false;
    };
  }, [router, recargarMeses]);

  const recargarDatos = useCallback(async () => {
    if (!mesId) {
      setDatos(DATOS_VACIOS);
      return;
    }
    const mesActual = meses.find((m) => m.id === mesId);
    const d = await fetchMesCompleto(mesId, mesActual?.periodo);
    setDatos(d);
  }, [mesId, meses]);

  useEffect(() => {
    recargarDatos();
  }, [recargarDatos]);

  async function crearPrimerMes(periodo) {
    const nuevo = await crearMes(session.user.id, periodo || periodoActual());
    await recargarMeses(nuevo.id);
  }

  async function avanzarMes() {
    const mesActual = meses.find((m) => m.id === mesId);
    if (!mesActual) return;
    const nuevo = await crearMesSiguiente(session.user.id, mesActual, datos);
    await recargarMeses(nuevo.id);
  }

  async function borrarMesActual() {
    if (!mesId) return;
    try {
      await eliminarMes(mesId);
      setConfirmandoBorrar(false);
      await recargarMeses();
    } catch (e) {
      alert("No se pudo borrar el mes: " + e.message);
    }
  }

  async function cerrarSesion() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const mes = meses.find((m) => m.id === mesId) || null;
  const totales = mes ? calcularTotales(mes, datos) : null;

  if (loading) return null;

  const ctxValue = {
    session,
    meses,
    mes,
    mesId,
    datos,
    totales,
    loading,
    setMesId,
    crearPrimerMes,
    avanzarMes,
    recargarDatos,
    recargarMeses,
  };

  return (
    <MesContext.Provider value={ctxValue}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "16px 16px 60px", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
          <h1 style={{ fontSize: 20, margin: 0 }}>Mis finanzas</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {mes && (
              <select
                value={mesId}
                onChange={(e) => setMesId(e.target.value)}
                style={{ background: "#182B22", color: "#EFE9DA", border: "1px solid #2B4137", borderRadius: 4, padding: "6px 8px", fontSize: 13 }}
              >
                {meses.map((m) => (
                  <option key={m.id} value={m.id}>
                    {formatoCorto(m.periodo)}
                  </option>
                ))}
              </select>
            )}
            {mes && !confirmandoBorrar && (
              <button
                onClick={() => setConfirmandoBorrar(true)}
                title="Borrar este mes"
                style={{ background: "none", border: "none", color: "#93A99B", cursor: "pointer", fontSize: 13 }}
              >
                🗑
              </button>
            )}
            {mes && confirmandoBorrar && (
              <span style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 12 }}>
                <span style={{ color: "#D2A94C" }}>¿Borrar {formatoCorto(mes.periodo)}?</span>
                <button onClick={borrarMesActual} style={{ background: "none", border: "none", color: "#C97B6B", cursor: "pointer" }}>Sí</button>
                <button onClick={() => setConfirmandoBorrar(false)} style={{ background: "none", border: "none", color: "#93A99B", cursor: "pointer" }}>No</button>
              </span>
            )}
            <Link href="/dashboard/instalar" style={{ color: "#93A99B", fontSize: 12, textDecoration: "underline" }}>
              Instalar app
            </Link>
            <button onClick={cerrarSesion} style={{ background: "none", border: "none", color: "#93A99B", textDecoration: "underline", cursor: "pointer", fontSize: 13 }}>
              Salir
            </button>
          </div>
        </div>

        <nav style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 20, borderBottom: "1px solid #2B4137", paddingBottom: 8 }}>
          {TABS.map((t) => {
            const activo = pathname === t.href;
            return (
              <Link
                key={t.href}
                href={t.href}
                style={{
                  fontSize: 12,
                  padding: "6px 10px",
                  borderRadius: 4,
                  textDecoration: "none",
                  color: activo ? "#0F1913" : "#93A99B",
                  background: activo ? "#7CB88D" : "transparent",
                  whiteSpace: "nowrap",
                }}
              >
                {t.label}
              </Link>
            );
          })}
        </nav>

        {!mes && meses.length === 0 && !["/dashboard", "/dashboard/instalar"].includes(pathname) ? (
          <CrearPrimerMes onCrear={crearPrimerMes} />
        ) : (
          children
        )}
      </div>
    </MesContext.Provider>
  );
}

function CrearPrimerMes({ onCrear }) {
  const [periodo, setPeriodo] = useState(periodoActual());
  const [creando, setCreando] = useState(false);

  async function crear() {
    setCreando(true);
    await onCrear(periodo);
    setCreando(false);
  }

  return (
    <div style={{ background: "#182B22", border: "1px solid #2B4137", borderRadius: 6, padding: 16, fontSize: 13 }}>
      <p style={{ color: "#EFE9DA", marginTop: 0 }}>Todavía no creaste ningún mes de presupuesto. Elegí con cuál empezar:</p>
      <input
        type="month"
        value={periodo}
        onChange={(e) => setPeriodo(e.target.value)}
        style={{ padding: 8, background: "#132019", border: "1px solid #2B4137", color: "#EFE9DA", borderRadius: 4, marginRight: 10 }}
      />
      <button
        disabled={creando}
        onClick={crear}
        style={{ padding: "8px 14px", background: "#7CB88D", color: "#0F1913", fontWeight: 600, border: "none", borderRadius: 4, cursor: "pointer" }}
      >
        {creando ? "Creando..." : "Crear mes"}
      </button>
    </div>
  );
}
