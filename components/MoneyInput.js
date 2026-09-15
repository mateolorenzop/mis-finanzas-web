"use client";
import { useEffect, useState } from "react";

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

// Acepta coma decimal (convención argentina) sin pelearse con el cursor
// mientras se escribe: guarda texto local y sólo convierte a número
// (y reformatea) cuando se pierde el foco.
export default function MoneyInput({ value, onChange, placeholder, style }) {
  const [texto, setTexto] = useState(value === 0 || value ? String(value).replace(".", ",") : "");

  useEffect(() => {
    const externo = value === 0 || value ? String(value).replace(".", ",") : "";
    setTexto((actual) => (Number(actual.replace(",", ".")) === Number(value) ? actual : externo));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  function commit() {
    const limpio = texto.replace(/\./g, "").replace(",", ".");
    const num = parseFloat(limpio);
    onChange(isNaN(num) ? 0 : num);
    setTexto(isNaN(num) ? "" : String(num).replace(".", ","));
  }

  return (
    <input
      type="text"
      inputMode="decimal"
      placeholder={placeholder}
      value={texto}
      onChange={(e) => setTexto(e.target.value)}
      onBlur={commit}
      style={{ ...inputStyle, ...style }}
    />
  );
}

export { inputStyle };
