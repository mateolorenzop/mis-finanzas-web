export const metadata = {
  title: "Mis finanzas",
  description: "Ingresos y gastos personales",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body style={{ margin: 0, background: "#132019", color: "#EFE9DA", minHeight: "100vh" }}>
        {children}
      </body>
    </html>
  );
}
