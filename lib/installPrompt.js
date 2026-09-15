// Guarda el evento "beforeinstallprompt" (Android / Chrome / Edge de escritorio)
// para poder mostrar el botón nativo de instalar desde cualquier página,
// aunque la página se haya montado después de que el evento disparó.
let deferred = null;
const listeners = new Set();

export function capturarEvento(event) {
  deferred = event;
  listeners.forEach((cb) => cb(deferred));
}

export function suscribirse(cb) {
  listeners.add(cb);
  if (deferred) cb(deferred);
  return () => listeners.delete(cb);
}

export function limpiarEvento() {
  deferred = null;
}
