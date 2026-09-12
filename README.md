# Mis finanzas — motor base

Esto es el "motor" del que hablamos: una base de datos con tu usuario y contraseña,
un sitio mínimo para ver y cargar movimientos desde la compu, y la conexión para que
el botón de Acción del iPhone guarde datos ahí directo, sin abrir nada.

Lo que **todavía no** incluye: gastos fijos, dólares, tarjetas, gráficos — eso lo migramos
después de confirmar que esta base funciona.

---

## Paso 1 — Crear el proyecto en Supabase (la base de datos)

1. Andá a https://supabase.com y creá una cuenta gratis (podés entrar con GitHub o mail).
2. Click en **"New project"**.
   - Nombre: el que quieras (ej. "mis-finanzas").
   - Contraseña de base de datos: generá una y guardala en algún lado (no es la tuya, es la de la base).
   - Región: la más cercana a Argentina (ej. São Paulo).
3. Esperá 1-2 minutos a que el proyecto termine de crearse.
4. En el menú de la izquierda, andá a **SQL Editor** → **New query**.
5. Abrí el archivo `supabase/schema.sql` de esta carpeta, copiá todo el contenido, pegalo ahí, y tocá **Run**.
   - Esto crea la tabla `movimientos` y las reglas de seguridad para que cada usuario solo vea lo suyo.
6. Andá a **Project Settings** (ícono de engranaje) → **API**.
   - Copiá el **Project URL** y la **anon public key**. Los vas a necesitar en el paso 3.

---

## Paso 2 — Probar en tu computadora (opcional, para ver que funciona)

Necesitás tener [Node.js](https://nodejs.org) instalado.

```bash
cd mis-finanzas-web
cp .env.local.example .env.local
# Editá .env.local y pegá tu Project URL y anon key ahí
npm install
npm run dev
```

Abrí http://localhost:3000, creá una cuenta con tu mail, y probá agregar un gasto.

---

## Paso 3 — Publicarlo en internet con Vercel

1. Subí esta carpeta a un repositorio de GitHub (podés arrastrar los archivos desde
   github.com/new si no usás git desde la terminal).
2. Andá a https://vercel.com, creá una cuenta gratis (podés entrar con GitHub).
3. **Add New → Project**, elegí el repositorio que subiste.
4. Antes de darle "Deploy", abrí **Environment Variables** y agregá:
   - `NEXT_PUBLIC_SUPABASE_URL` = el Project URL de Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = la anon key de Supabase
5. Click en **Deploy**. En un par de minutos te da una dirección tipo
   `https://mis-finanzas-web.vercel.app` — esa es tu app, ya accesible desde
   cualquier celular o computadora.
6. Entrá desde el celular a esa dirección y creá tu cuenta (la misma que vas a usar
   en el Atajo del paso siguiente).

---

## Paso 4 — El Atajo de iPhone (botón de Acción)

Abrí la app **Atajos** en tu iPhone → **+** (nuevo atajo) → nombralo como quieras
(ej. "Cargar gasto") y agregá estas acciones, en este orden:

1. **Pedir texto** → pregunta: "¿Qué fue?" → guardalo en la variable `Concepto`.
2. **Pedir número** → pregunta: "¿Cuánto?" → variable `Monto`.
3. **Elegir de menú** → opciones "Gasto" / "Ingreso" → esto define el `Tipo`.
4. **Fecha actual** (o "Pedir fecha" si querés poder cambiarla) → variable `Fecha`.
5. **Obtener contenido de URL** (primera llamada, para iniciar sesión):
   - URL: `https://TU-PROYECTO.supabase.co/auth/v1/token?grant_type=password`
   - Método: `POST`
   - Encabezados:
     - `apikey`: tu anon key
     - `Content-Type`: `application/json`
   - Cuerpo (JSON):
     ```json
     { "email": "tu-mail@ejemplo.com", "password": "tu-contraseña" }
     ```
   - Esto devuelve un JSON. Agregá la acción **"Obtener valor de diccionario"**
     con clave `access_token` para sacar el token de esa respuesta. Guardalo
     como variable `Token`.
6. **Obtener contenido de URL** (segunda llamada, para guardar el movimiento):
   - URL: `https://TU-PROYECTO.supabase.co/rest/v1/movimientos`
   - Método: `POST`
   - Encabezados:
     - `apikey`: tu anon key
     - `Authorization`: `Bearer` + la variable `Token` (con un espacio en el medio)
     - `Content-Type`: `application/json`
     - `Prefer`: `return=minimal`
   - Cuerpo (JSON), usando las variables que pediste antes:
     ```json
     {
       "concepto": "Concepto",
       "monto": "Monto",
       "tipo": "gasto o ingreso según lo que elegiste",
       "fecha": "Fecha"
     }
     ```
     (en la app Atajos, insertás cada variable tocando el campo y eligiéndola
     de la lista, en vez de escribirla a mano)
7. **Mostrar notificación** → texto: "Guardado ✅"

Por último, tocá el ícono del atajo → **"Agregar a Acción"** (Action Button) para
que quede en el botón lateral del iPhone.

**Nota de seguridad:** tu contraseña queda guardada dentro del Atajo, en tu propio
teléfono — no la compartas con nadie ni mandes este Atajo a otra persona tal cual,
porque tiene tu clave adentro. Si preferís no guardar la contraseña ahí, avisame y
armamos una variante con un "token personal" en vez de tu mail/contraseña real.

---

## Qué sigue

Una vez que confirmes que podés loguearte en el sitio y que el Atajo guarda datos
correctamente, migramos el resto: gastos fijos, tarjetas de crédito con cuotas,
dólares, y los gráficos que ya tenés en la versión de Claude.
