const MESES_CORTOS = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

const MESES_LARGOS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

// periodo: string 'YYYY-MM'
export function periodoActual() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function sumarMeses(periodo, delta) {
  const [y, m] = periodo.split("-").map(Number);
  const total = (y * 12 + (m - 1)) + delta;
  const ny = Math.floor(total / 12);
  const nm = ((total % 12) + 12) % 12;
  return `${ny}-${String(nm + 1).padStart(2, "0")}`;
}

export function periodoSiguiente(periodo) {
  return sumarMeses(periodo, 1);
}

export function periodoAnterior(periodo) {
  return sumarMeses(periodo, -1);
}

// '2026-06' -> 'jun/26'
export function formatoCorto(periodo) {
  if (!periodo) return "";
  const [y, m] = periodo.split("-").map(Number);
  return `${MESES_CORTOS[m - 1]}/${String(y).slice(2)}`;
}

// '2026-06' -> 'Junio 2026'
export function formatoLargo(periodo) {
  if (!periodo) return "";
  const [y, m] = periodo.split("-").map(Number);
  return `${MESES_LARGOS[m - 1]} ${y}`;
}

// Avanza una fecha 'YYYY-MM-DD' un mes, conservando el día si existe
// (sin desbordarse a otro mes cuando el día no existe, ej: 31 de febrero).
export function avanzarFecha(fecha) {
  if (!fecha) return null;
  const [y, m, d] = fecha.split("-").map(Number);
  const total = y * 12 + (m - 1) + 1;
  const ny = Math.floor(total / 12);
  const nm = ((total % 12) + 12) % 12;
  const diasEnMes = new Date(ny, nm + 1, 0).getDate();
  const nd = Math.min(d, diasEnMes);
  return `${ny}-${String(nm + 1).padStart(2, "0")}-${String(nd).padStart(2, "0")}`;
}
