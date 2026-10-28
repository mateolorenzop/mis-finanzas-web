export const CATEGORIAS = [
  "Bar",
  "Belleza y estética",
  "Combustible",
  "Comida",
  "Compra online",
  "Deporte",
  "Delivery",
  "Educación",
  "Electrónica",
  "Entretenimiento",
  "Estacionamiento",
  "Farmacia",
  "Fiesta",
  "Hogar",
  "Impuestos y trámites",
  "Kiosco",
  "Regalo",
  "Ropa",
  "Salud",
  "Supermercado",
  "Tarjeta de crédito",
  "Tecnología",
  "Transporte",
  "Viaje",
  "Otro",
];

export const BANCOS = ["Banco Galicia", "Banco Provincia", "Mercado Pago", "Otro"];

export const FORMAS_PAGO = ["Efectivo", "Transferencia", "Débito automático"];

export const FORMAS_PAGO_INGRESOS = ["Efectivo", "Transferencia"];

export const BANCOS_CON_RED = ["Banco Galicia", "Banco Provincia"];

export const REDES_TARJETA = ["Visa", "Mastercard"];

export const TIPOS_INGRESO = ["Reintegro", "Certificado de deuda", "Bonificación", "Devolución", "Mensajería", "Otro"];

// Hash simple de un string a un entero positivo, para elegir siempre
// el mismo color para el mismo nombre sin importar el orden en que aparece.
function hashString(str) {
  let hash = 0;
  const s = String(str || "");
  for (let i = 0; i < s.length; i++) {
    hash = (hash << 5) - hash + s.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

// Ángulo dorado: separa bien los colores entre sí aunque haya muchos.
const GOLDEN_ANGLE = 137.508;

export function colorFor(name) {
  const hash = hashString(name);
  const hue = (hash * GOLDEN_ANGLE) % 360;
  const sat = 55 + (hash % 20); // 55-75%
  const light = 45 + (hash % 15); // 45-60%
  return `hsl(${hue.toFixed(1)}, ${sat}%, ${light}%)`;
}

// Color por posición (no por nombre): usando el ángulo dorado desde el
// índice quedan siempre bien separados entre sí, sin repetirse dentro
// de un mismo gráfico aunque haya muchas categorías.
const LIGHT_VARIANTS = [58, 48, 68];

export function colorForIndex(i) {
  const hue = (i * GOLDEN_ANGLE) % 360;
  const light = LIGHT_VARIANTS[i % LIGHT_VARIANTS.length];
  return `hsl(${hue.toFixed(1)}, 68%, ${light}%)`;
}

// Normaliza una categoría (recorta espacios y, si coincide sin importar
// mayúsculas/minúsculas con una de CATEGORIAS, usa esa forma exacta). Así
// un gasto cargado desde el Atajo del iPhone con "bar" o "Bar " se agrupa
// junto con los cargados desde la app como "Bar", en vez de aparecer como
// categorías distintas en el gráfico.
export function categoriaCanonica(cat) {
  const limpio = (cat || "").trim();
  if (!limpio) return "Otro";
  const encontrada = CATEGORIAS.find((c) => c.toLowerCase() === limpio.toLowerCase());
  return encontrada || limpio;
}
