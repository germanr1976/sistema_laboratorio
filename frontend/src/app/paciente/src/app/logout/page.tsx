"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    // Limpiar datos de sesión
    localStorage.removeItem("authToken");
    localStorage.removeItem("userType");
    localStorage.removeItem("userData");

    // Redirigir a home después de 1.5 segundos
    const timer = setTimeout(() => {
      router.push("/");
    }, 1500);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4 text-red-600">Cerrar sesión</h1>
        <p className="text-gray-600">Has cerrado sesión correctamente.</p>
        <p className="text-sm text-gray-500 mt-4">Redirigiendo...</p>
      </div>
    </div>
  );
}
