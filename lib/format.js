export function fmtPesos(v) {
  const num = Math.round((Number(v) || 0) * 100) / 100;
  const tieneDecimales = Math.abs(num % 1) > 0.001;
  return (
    "$" +
    num.toLocaleString("es-AR", {
      minimumFractionDigits: tieneDecimales ? 2 : 0,
      maximumFractionDigits: 2,
    })
  );
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
