"use client";

import "../globals.css";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "./src/componentes/SideBar";

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const scrollContainerRef = useRef<HTMLElement | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [canAccess, setCanAccess] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const userType = (localStorage.getItem("userType") || "").toLowerCase();

    let role = "";
    try {
      const rawUser = localStorage.getItem("userData");
      const parsedUser = rawUser ? JSON.parse(rawUser) : null;
      role = String(parsedUser?.role || "").toUpperCase();
    } catch {
      role = "";
    }

    const isPatientRole = role === "PATIENT";
    const isProfessionalRole = role === "BIOCHEMIST" || role === "ADMIN";
    const isPatientType = userType === "patient";
    const isProfessionalType = userType === "professional";

    if (!token) {
      router.replace("/login-paciente");
      return;
    }

    if (isProfessionalRole || isProfessionalType) {
      router.replace("/dashboard");
      return;
    }

    if (!isPatientRole && !isPatientType) {
      router.replace("/");
      return;
    }

    setCanAccess(true);
  }, [router]);

  useEffect(() => {
    if (!canAccess) return;

    const el = scrollContainerRef.current;
    if (!el) return;

    const onScroll = () => {
      setIsScrolled(el.scrollTop > 4);
    };

    onScroll();
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, [canAccess]);

  if (!canAccess) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 text-black">
      <Sidebar className="shrink-0" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className={`sticky top-0 z-10 bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between transition-shadow ${isScrolled ? "shadow-md" : "shadow-none"}`}>
          <h1 className="text-2xl font-bold text-gray-900">Mis estudios</h1>
          <p className="text-sm text-gray-600">Acceso a estudios y resultados</p>
        </header>
        <main ref={scrollContainerRef} className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
