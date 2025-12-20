// app/layout.tsx
import "./globals.css";
import NavBar from "../components/Navbar";
import ToasterClient from "../components/ToasterClient";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="font-sans">
        {/* Navbar visible en todas las páginas */}
        <NavBar />
        {/* Renderizar el contenido de cada página */}
        {children}
        {/* Toaster global (cliente) */}
        <ToasterClient />
      </body>
    </html>
  );
}

