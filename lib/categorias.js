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
