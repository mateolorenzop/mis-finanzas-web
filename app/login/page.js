"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

const inputStyle = {
  display: "block",
  width: "100%",
  marginBottom: 10,
  padding: 10,
  background: "#142440",
  border: "1px solid #26385C",
  color: "#E7ECF7",
  borderRadius: 4,
  boxSizing: "border-box",
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("login");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");
    setLoading(true);
    const action =
      mode === "login"
        ? supabase.auth.signInWithPassword({ email, password })
        : supabase.auth.signUp({ email, password });
    const { error } = await action;
    setLoading(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    if (mode === "signup") {
      setMessage("Cuenta creada. Si Supabase pide confirmación por mail, revisá tu casilla y después iniciá sesión.");
      setMode("login");
      return;
    }
    router.push("/dashboard");
  }

  return (
    <div style={{ maxWidth: 340, margin: "60px auto", padding: "0 16px", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: 22 }}>{mode === "login" ? "Iniciar sesión" : "Crear cuenta"}</h1>
      <form onSubmit={handleSubmit}>
        <input type="email" placeholder="Mail" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle} />
        <input type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} required style={inputStyle} />
        <button disabled={loading} type="submit" style={{ ...inputStyle, cursor: "pointer", background: "#4FD1A5", color: "#071022", fontWeight: 600, border: "none" }}>
          {loading ? "Cargando..." : mode === "login" ? "Entrar" : "Crear cuenta"}
        </button>
      </form>
      {message && <p style={{ color: "#D2A94C", fontSize: 13 }}>{message}</p>}
      <button
        onClick={() => setMode(mode === "login" ? "signup" : "login")}
        style={{ marginTop: 12, background: "none", border: "none", color: "#8C9EC9", textDecoration: "underline", cursor: "pointer", fontSize: 13 }}
      >
        {mode === "login" ? "¿No tenés cuenta? Creá una" : "¿Ya tenés cuenta? Iniciá sesión"}
      </button>
    </div>
  );
}
