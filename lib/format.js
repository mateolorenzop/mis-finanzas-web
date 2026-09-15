export function fmtPesos(v) {
  return "$" + Math.round(Number(v) || 0).toLocaleString("es-AR");
}

export function fmtNumero(v, decimales = 2) {
  return Number(v || 0).toLocaleString("es-AR", {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  });
}

export function fmtPct(v) {
  return Number(v || 0).toLocaleString("es-AR", { maximumFractionDigits: 1 }) + "%";
}
