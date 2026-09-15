"use client";
import { useEffect, useRef, useState } from "react";

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

// Agrupa con puntos de miles a medida que se escribe (ej: "1234" -> "1.234").
function formatear(raw) {
  const limpio = String(raw).replace(/\./g, "");
  const idxComa = limpio.indexOf(",");
  let intPart, decPart;
  if (idxComa === -1) {
    intPart = limpio.replace(/[^\d]/g, "");
    decPart = null;
  } else {
    intPart = limpio.slice(0, idxComa).replace(/[^\d]/g, "");
    decPart = limpio.slice(idxComa + 1).replace(/[^\d]/g, "");
  }
  let grupos = "";
  for (let i = 0; i < intPart.length; i++) {
    if (i > 0 && (intPart.length - i) % 3 === 0) grupos += ".";
    grupos += intPart[i];
  }
  return decPart === null ? grupos : `${grupos},${decPart}`;
}

function aNumero(texto) {
  const limpio = texto.replace(/\./g, "").replace(",", ".");
  const num = parseFloat(limpio);
  return isNaN(num) ? 0 : num;
}

function paraMostrar(v) {
  if (!v) return "";
  return Number(v).toLocaleString("es-AR");
}

// Cuenta dígitos/coma (los caracteres "reales") antes de una posición,
// ignorando los puntos de agrupación que agregamos nosotros.
function contarSignificativos(str, hasta) {
  let count = 0;
  for (let i = 0; i < hasta && i < str.length; i++) {
    if (/[0-9,]/.test(str[i])) count++;
  }
  return count;
}

function posicionPara(str, count) {
  let visto = 0;
  for (let i = 0; i < str.length; i++) {
    if (/[0-9,]/.test(str[i])) {
      visto++;
      if (visto === count) return i + 1;
    }
  }
  return str.length;
}

// Muestra los puntos de miles a medida que se escribe, conservando la
// posición del cursor. Acepta coma decimal (convención argentina).
export default function MoneyInput({ value, onChange, placeholder, style }) {
  const [texto, setTexto] = useState(paraMostrar(value));
  const [enfocado, setEnfocado] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!enfocado) setTexto(paraMostrar(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  function handleFocus() {
    setEnfocado(true);
  }

  function handleChange(e) {
    const el = e.target;
    const raw = el.value;
    const cursorRaw = el.selectionStart ?? raw.length;
    const sig = contarSignificativos(raw, cursorRaw);
    const formatted = formatear(raw);
    setTexto(formatted);
    onChange(aNumero(formatted));
    requestAnimationFrame(() => {
      if (inputRef.current) {
        const pos = posicionPara(formatted, sig);
        inputRef.current.setSelectionRange(pos, pos);
      }
    });
  }

  function handleBlur() {
    setEnfocado(false);
    const num = aNumero(texto);
    onChange(num);
    setTexto(paraMostrar(num));
  }

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="decimal"
      placeholder={placeholder}
      value={texto}
      onFocus={handleFocus}
      onChange={handleChange}
      onBlur={handleBlur}
      style={{ ...inputStyle, ...style }}
    />
  );
}

export { inputStyle };
