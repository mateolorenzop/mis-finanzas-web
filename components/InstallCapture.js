"use client";
import { useEffect } from "react";
import { capturarEvento } from "../lib/installPrompt";

export default function InstallCapture() {
  useEffect(() => {
    function handler(e) {
      e.preventDefault();
      capturarEvento(e);
    }
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);
  return null;
}
