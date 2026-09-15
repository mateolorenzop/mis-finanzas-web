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

function paraMostrar(v) {
    if (v !== 0 && !v) return "";
    return Number(v).toLocaleString("es-AR");
}

function paraEditar(v) {
    if (v !== 0 && !v) return "";
    return String(v).replace(".", ",");
}

function aNumero(texto) {
    const limpio = texto.replace(/\./g, "").replace(",", ".");
    const num = parseFloat(limpio);
    return isNaN(num) ? 0 : num;
}

export default function MoneyInput({ value, onChange, placeholder, style }) {
    const [texto, setTexto] = useState(paraMostrar(value));
    const [enfocado, setEnfocado] = useState(false);

  useEffect(() => {
        if (!enfocado) setTexto(paraMostrar(value));
  }, [value]);

  function handleFocus() {
        setEnfocado(true);
        setTexto(paraEditar(value));
  }

  function handleChange(e) {
        const nuevoTexto = e.target.value;
        setTexto(nuevoTexto);
        onChange(aNumero(nuevoTexto));
  }

  function handleBlur() {
        setEnfocado(false);
        const num = aNumero(texto);
        onChange(num);
        setTexto(paraMostrar(num));
  }

  return (
        <input
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
