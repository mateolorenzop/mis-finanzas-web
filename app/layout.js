import RegistrarSW from "../components/RegistrarSW";
import InstallCapture from "../components/InstallCapture";

export const metadata = {
  title: "FP",
  description: "Ingresos y gastos personales",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "FP",
  },
};

export const viewport = {
  themeColor: "#0B1730",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body style={{ margin: 0, background: "#0B1730", color: "#E7ECF7", minHeight: "100vh" }}>
        <RegistrarSW />
        <InstallCapture />
        {children}
      </body>
    </html>
  );
}
