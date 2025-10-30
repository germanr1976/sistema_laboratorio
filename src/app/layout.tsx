// app/layout.tsx
import "./globals.css";
import NavBar from "../components/Navbar";
import { Toaster } from 'react-hot-toast';

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
        {/* Toaster global para controlar duración de los toasts */}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 8000,
            style: {
              minWidth: '400px',
              minHeight: '60px',
              fontSize: '1.2rem',
            },
            success: {
              duration: 5000,
              style: {
                background: '#e0f7fa',
                color: '#00796b',
                minWidth: '400px',
                minHeight: '60px',
                fontSize: '1.2rem',
              },
            },
            error: {
              duration: 10000,
              style: {
                background: '#ffebee',
                color: '#c62828',
                minWidth: '400px',
                minHeight: '60px',
                fontSize: '1.2rem',
              },
            },
          }}
        />
      </body>
    </html>
  );
}

