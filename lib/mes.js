import { supabase } from "./supabaseClient";
import { periodoSiguiente, avanzarFecha } from "./periodo";

const TARJETA = "Tarjeta de crédito";
function esTarjeta(categoria) {
  return (categoria || "").trim() === TARJETA;
}

export async function fetchMeses() {
  const { data, error } = await supabase
    .from("meses")
    .select("*")
    .order("periodo", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function crearMes(userId, periodo, extra = {}) {
  const { data, error } = await supabase
    .from("meses")
    .insert({ user_id: userId, periodo, ...extra })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// periodo es opcional: si se pasa, también trae lo cargado por el Atajo del
// iPhone / la pestaña Rápido (tabla "movimientos") que caiga en ese mes,
// separado en movimientosGasto y movimientosIngreso según su fecha.
export async function fetchMesCompleto(mesId, periodo) {
  const consultas = [
    supabase.from("gastos_fijos").select("*").eq("mes_id", mesId).order("concepto"),
    supabase.from("gastos_variables").select("*").eq("mes_id", mesId).order("fecha", { ascending: false }),
    supabase.from("otros_ingresos").select("*").eq("mes_id", mesId).order("fecha", { ascending: false }),
    supabase.from("compras_dolares").select("*").eq("mes_id", mesId).order("fecha", { ascending: false }),
  ];
  if (periodo) {
    const desde = `${periodo}-01`;
    const hasta = `${periodoSiguiente(periodo)}-01`;
    consultas.push(
      supabase.from("movimientos").select("*").gte("fecha", desde).lt("fecha", hasta).order("fecha", { ascending: false })
    );
  }

  const [gf, gv, oi, cd, mov] = await Promise.all(consultas);
  if (gf.error) throw gf.error;
  if (gv.error) throw gv.error;
  if (oi.error) throw oi.error;
  if (cd.error) throw cd.error;
  if (mov?.error) throw mov.error;

  const gastosVariables = gv.data || [];
  let tarjetaMotivos = [];
  const idsConTarjeta = gastosVariables.filter((g) => esTarjeta(g.categoria)).map((g) => g.id);
  if (idsConTarjeta.length > 0) {
    const { data, error } = await supabase.from("tarjeta_motivos").select("*").in("gasto_variable_id", idsConTarjeta);
    if (error) throw error;
    tarjetaMotivos = data || [];
  }

  const movimientos = mov?.data || [];

  return {
    gastosFijos: gf.data || [],
    gastosVariables,
    tarjetaMotivos,
    otrosIngresos: oi.data || [],
    comprasDolares: cd.data || [],
    movimientosGasto: movimientos.filter((m) => (m.tipo || "").toLowerCase() === "gasto"),
    movimientosIngreso: movimientos.filter((m) => (m.tipo || "").toLowerCase() === "ingreso"),
  };
}

// Para un ítem de gastos variables, calcula su monto real:
// para "Tarjeta de crédito" es la suma de sus motivos, si no, el campo monto.
export function varItemTotal(item, tarjetaMotivos) {
  if (esTarjeta(item.categoria)) {
    return tarjetaMotivos
      .filter((m) => m.gasto_variable_id === item.id)
      .reduce((s, m) => s + Number(m.valor_cuota || 0), 0);
  }
  return Number(item.monto || 0);
}

export function calcularTotales(mes, datos) {
  const { gastosFijos, gastosVariables, tarjetaMotivos, otrosIngresos, comprasDolares, movimientosGasto, movimientosIngreso } = datos;
  const totalOtrosIngresos =
    otrosIngresos.reduce((s, o) => s + Number(o.monto || 0), 0) +
    (movimientosIngreso || []).reduce((s, m) => s + Number(m.monto || 0), 0);
  const fondosDisponibles =
    Number(mes.honorarios_efectivo || 0) +
    Number(mes.honorarios_transferencia || 0) +
    Number(mes.remanente_anterior || 0) +
    totalOtrosIngresos;
  const totalGastosFijos = gastosFijos.reduce((s, g) => s + Number(g.valor || 0), 0);
  const totalGastosVariables =
    gastosVariables.reduce((s, g) => s + varItemTotal(g, tarjetaMotivos), 0) +
    (movimientosGasto || []).reduce((s, m) => s + Number(m.monto || 0), 0);
  const totalDolaresPesos = comprasDolares.reduce((s, c) => s + Number(c.monto_pesos || 0), 0);
  const totalDolaresCantidad = comprasDolares.reduce((s, c) => s + Number(c.cantidad_dolares || 0), 0);
  const saldoDisponible = fondosDisponibles - totalGastosFijos;
  const remanente = saldoDisponible - totalGastosVariables - totalDolaresPesos;
  return {
    totalOtrosIngresos,
    fondosDisponibles,
    totalGastosFijos,
    totalGastosVariables,
    totalDolaresPesos,
    totalDolaresCantidad,
    saldoDisponible,
    remanente,
  };
}

// Crea el mes siguiente: copia gastos fijos (estado pendiente) y avanza
// las cuotas de tarjeta de crédito que todavía no llegaron a la última.
export async function crearMesSiguiente(userId, mesActual, datos) {
  const totales = calcularTotales(mesActual, datos);
  const nuevoPeriodo = periodoSiguiente(mesActual.periodo);

  const nuevoMes = await crearMes(userId, nuevoPeriodo, {
    remanente_anterior: totales.remanente,
    limite_transferencia: mesActual.limite_transferencia,
  });

  if (datos.gastosFijos.length > 0) {
    const nuevosFijos = datos.gastosFijos.map((g) => ({
      user_id: userId,
      mes_id: nuevoMes.id,
      concepto: g.concepto,
      valor: g.valor,
      vencimiento: avanzarFecha(g.vencimiento),
      periodo: avanzarFecha(g.periodo),
      estado: "pendiente",
      forma: g.forma,
    }));
    const { error } = await supabase.from("gastos_fijos").insert(nuevosFijos);
    if (error) throw error;
  }

  const tarjetas = datos.gastosVariables.filter((g) => esTarjeta(g.categoria));
  for (const tarjeta of tarjetas) {
    const pendientes = datos.tarjetaMotivos.filter(
      (m) => m.gasto_variable_id === tarjeta.id && Number(m.cuota_actual) < Number(m.cuota_total)
    );
    if (pendientes.length === 0) continue;

    const { data: nuevoItem, error: errItem } = await supabase
      .from("gastos_variables")
      .insert({
        user_id: userId,
        mes_id: nuevoMes.id,
        categoria: TARJETA,
        concepto: tarjeta.concepto,
        monto: 0,
        fecha: null,
        forma: tarjeta.forma,
      })
      .select()
      .single();
    if (errItem) throw errItem;

    const nuevosMotivos = pendientes.map((m) => ({
      user_id: userId,
      gasto_variable_id: nuevoItem.id,
      tarjeta: m.tarjeta,
      tarjeta_otro: m.tarjeta_otro,
      motivo: m.motivo,
      valor_cuota: m.valor_cuota,
      cuota_actual: Number(m.cuota_actual) + 1,
      cuota_total: m.cuota_total,
      fecha: null,
    }));
    const { error: errMotivos } = await supabase.from("tarjeta_motivos").insert(nuevosMotivos);
    if (errMotivos) throw errMotivos;
  }

  return nuevoMes;
}

// Busca los gastos fijos de un período anterior (para comparar % de aumento).
export async function fetchGastosFijosPorPeriodo(userId, periodo) {
  const { data: mesAnterior, error } = await supabase
    .from("meses")
    .select("id")
    .eq("user_id", userId)
    .eq("periodo", periodo)
    .maybeSingle();
  if (error) throw error;
  if (!mesAnterior) return [];
  const { data, error: err2 } = await supabase.from("gastos_fijos").select("*").eq("mes_id", mesAnterior.id);
  if (err2) throw err2;
  return data || [];
}

// Busca los totales por tarjeta de crédito de un período anterior
// (para comparar el % de aumento de cada tarjeta mes a mes).
export async function fetchTarjetasPorPeriodo(userId, periodo) {
  const { data: mesAnterior, error } = await supabase
    .from("meses")
    .select("id")
    .eq("user_id", userId)
    .eq("periodo", periodo)
    .maybeSingle();
  if (error) throw error;
  if (!mesAnterior) return [];

  const { data: gv, error: err2 } = await supabase
    .from("gastos_variables")
    .select("*")
    .eq("mes_id", mesAnterior.id)
    .eq("categoria", TARJETA);
  if (err2) throw err2;
  const tarjetas = gv || [];
  if (tarjetas.length === 0) return [];

  const ids = tarjetas.map((t) => t.id);
  const { data: motivos, error: err3 } = await supabase
    .from("tarjeta_motivos")
    .select("*")
    .in("gasto_variable_id", ids);
  if (err3) throw err3;

  return tarjetas.map((t) => ({
    concepto: t.concepto,
    total: (motivos || [])
      .filter((m) => m.gasto_variable_id === t.id)
      .reduce((s, m) => s + Number(m.valor_cuota || 0), 0),
  }));
}

export async function eliminarMes(mesId) {
  const { error } = await supabase.from("meses").delete().eq("id", mesId);
  if (error) throw error;
}
