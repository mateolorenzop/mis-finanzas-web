"use client";
import { createContext, useContext } from "react";

// Value shape: {
//   session, meses, mes, datos, totales,
//   cambiarMes(id), crearPrimerMes(periodo), avanzarMes(), recargarDatos(), recargarMeses(),
//   loading,
// }
export const MesContext = createContext(null);

export function useMes() {
  const ctx = useContext(MesContext);
  if (!ctx) throw new Error("useMes debe usarse dentro de <MesProvider>");
  return ctx;
}
