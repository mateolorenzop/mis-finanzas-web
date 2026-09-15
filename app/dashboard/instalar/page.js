"use client";
import { useEffect, useState } from "react";
import { suscribirse, limpiarEvento } from "../../../lib/installPrompt";

function detectarPlataforma() {
  if (typeof navigator === "undefined") return "otro";
  const ua = navigator.userAgent || "";
  const esStandalone =
    window.matchMedia?.("(display-mode: standalone)")?.matches || navigator.standalone === true;
  if (esStandalone) return "instalado";
  if (/iPhone|iPad|iPod/.test(ua)) return "ios";
  if (/Android/.test(ua)) return "android";
  return "desktop";
}

export default function Instalar() {
  const [plataforma, setPlataforma] = useState("otro");
  const [promptDisponible, setPromptDisponible] = useState(null);
  const [instalando, setInstalando] = useState(false);

  useEffect(() => {
    setPlataforma(detectarPlataforma());
    const unsub = suscribirse((ev) => setPromptDisponible(ev));
    return unsub;
  }, []);

  async function instalarAhora() {
    if (!promptDisponible) return;
    setInstalando(true);
    promptDisponible.prompt();
    await promptDisponible.userChoice;
    limpiarEvento();
    setPromptDisponible(null);
    setInstalando(false);
  }

  return (
    <div>
      <h2 style={{ fontSize: 16, color: "#EFE9DA", marginBottom: 4 }}>Agregar a la pantalla de inicio</h2>
      <p style={{ fontSize: 13, color: "#93A99B", marginBottom: 20 }}>
        Instalá el sitio como si fuera una app: te queda un ícono en tu pantalla de inicio y se abre sin la barra del
        navegador.
      </p>

      {plataforma === "instalado" && (
        <Recuadro>
          <p style={{ margin: 0, color: "#7CB88D" }}>Ya estás usando la app instalada. ✓</p>
        </Recuadro>
      )}

      {promptDisponible && plataforma !== "instalado" && (
        <Recuadro>
          <button
            disabled={instalando}
            onClick={instalarAhora}
            style={{ padding: "10px 16px", background: "#7CB88D", color: "#0F1913", fontWeight: 600, border: "none", borderRadius: 4, cursor: "pointer" }}
          >
            {instalando ? "Instalando..." : "Instalar app"}
          </button>
        </Recuadro>
      )}

      <Bloque activo={plataforma === "ios"} titulo="En iPhone / iPad (Safari)">
        <ol style={{ paddingLeft: 18, margin: 0, color: "#EFE9DA", fontSize: 13, lineHeight: 1.7 }}>
          <li>Abrí este sitio en <strong>Safari</strong> (tiene que ser Safari, no Chrome).</li>
          <li>Tocá el ícono de <strong>Compartir</strong> (el cuadrado con la flecha hacia arriba), abajo en el medio.</li>
          <li>Deslizá la lista de opciones y tocá <strong>&quot;Agregar a inicio&quot;</strong>.</li>
          <li>Confirmá el nombre y tocá <strong>&quot;Agregar&quot;</strong>, arriba a la derecha.</li>
        </ol>
        <p style={{ fontSize: 12, color: "#93A99B", marginTop: 8 }}>
          Va a aparecer un ícono en tu pantalla de inicio, igual que cualquier otra app. Desde ahí podés usar el mismo
          atajo del botón de Acción para cargar gastos rápido.
        </p>
      </Bloque>

      <Bloque activo={plataforma === "android"} titulo="En Android (Chrome)">
        <ol style={{ paddingLeft: 18, margin: 0, color: "#EFE9DA", fontSize: 13, lineHeight: 1.7 }}>
          <li>Abrí este sitio en Chrome.</li>
          <li>Tocá los tres puntos (⋮) arriba a la derecha.</li>
          <li>Tocá <strong>&quot;Instalar app&quot;</strong> o <strong>&quot;Agregar a pantalla de inicio&quot;</strong>.</li>
          <li>Confirmá.</li>
        </ol>
      </Bloque>

      <Bloque activo={plataforma === "desktop"} titulo="En computadora (Chrome / Edge)">
        <ol style={{ paddingLeft: 18, margin: 0, color: "#EFE9DA", fontSize: 13, lineHeight: 1.7 }}>
          <li>Buscá el ícono de instalar (una pantalla con una flecha) en la barra de direcciones, a la derecha.</li>
          <li>Hacé click y confirmá &quot;Instalar&quot;.</li>
        </ol>
        <p style={{ fontSize: 12, color: "#93A99B", marginTop: 8 }}>
          Si no ves el ícono, también podés abrir el menú (⋮) → &quot;Instalar Mis finanzas...&quot;.
        </p>
      </Bloque>
    </div>
  );
}

function Bloque({ activo, titulo, children }) {
  return (
    <div
      style={{
        background: activo ? "#182B22" : "transparent",
        border: `1px solid ${activo ? "#7CB88D" : "#2B4137"}`,
        borderRadius: 6,
        padding: 14,
        marginBottom: 14,
      }}
    >
      <h3 style={{ fontSize: 13, color: activo ? "#7CB88D" : "#93A99B", marginTop: 0, marginBottom: 10 }}>
        {titulo} {activo && "— tu dispositivo"}
      </h3>
      {children}
    </div>
  );
}

function Recuadro({ children }) {
  return (
    <div style={{ background: "#182B22", border: "1px solid #2B4137", borderRadius: 6, padding: 14, marginBottom: 16 }}>
      {children}
    </div>
  );
}
