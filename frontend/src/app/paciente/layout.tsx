"use client";

import "../globals.css";
import { useEffect, useRef, useState } from "react";
import { Sidebar } from "./src/componentes/SideBar";

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  const scrollContainerRef = useRef<HTMLElement | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const onScroll = () => {
      setIsScrolled(el.scrollTop > 4);
    };

    onScroll();
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 text-black">
      <Sidebar className="shrink-0" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className={`sticky top-0 z-10 bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between transition-shadow ${isScrolled ? "shadow-md" : "shadow-none"}`}>
          <h1 className="text-2xl font-bold text-gray-900">Portal de Paciente</h1>
          <p className="text-sm text-gray-600">Acceso a estudios y resultados</p>
        </header>
        <main ref={scrollContainerRef} className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
