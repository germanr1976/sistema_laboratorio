// app/layout.tsx
import "./globals.css";

import { Sidebar } from "../componentes/SideBar";
import { Bell } from "lucide-react";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans min-h-screen">
        <div className="flex">
          <Sidebar />
          <div className="flex-1 flex flex-col">
            {/* Header global, siempre visible */}
            <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">¡Bienvenido!</h1>
              <div className="flex items-center gap-4">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="text-gray-600">Jueves 11 de septiembre 2025</span>
              </div>
            </div>
            <main className="flex-1 bg-gray-50 p-8">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}

