import RegistrarSW from "../components/RegistrarSW";
import InstallCapture from "../components/InstallCapture";

export const metadata = {
  title: "Mis finanzas",
  description: "Ingresos y gastos personales",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Mis finanzas",
  },
};

export const viewport = {
  themeColor: "#132019",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body style={{ margin: 0, background: "#132019", color: "#EFE9DA", minHeight: "100vh" }}>
        <RegistrarSW />
        <InstallCapture />
        {children}
      </body>
    </html>
  );
}
