"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, BarChart3, ChevronDown, ChevronRight, User, Settings, HelpCircle, LogOut } from "lucide-react"

interface SidebarProps {
  className?: string
}

export function Sidebar({ className = "" }: SidebarProps) {
  const pathname = usePathname()
  const [isEstudiosOpen, setIsEstudiosOpen] = useState(pathname?.startsWith("/estudios"))

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: Home, href: "/dashboard" },
    {
      id: "estudios",
      label: "Gestionar Estudios",
      icon: BarChart3,
      hasSubmenu: true,
      submenu: [

        { id: "proceso", label: "En Proceso", href: "/estudios/proceso" },
        { id: "parciales", label: "Parcial", href: "/estudios/parciales" },
        { id: "completados", label: "Completados", href: "/estudios/completados" },
      ],
    },
    { id: "historial", label: "Historial", icon: User, href: "/historial" },
  ]

  const bottomMenuItems = [
    { id: "configuraciones", label: "Configuraciones", icon: Settings, href: "/configuraciones" },
    { id: "ayuda", label: "Ayuda", icon: HelpCircle, href: "/ayuda" },
    { id: "cerrar-sesion", label: "Cerrar sesión", icon: LogOut, href: "/logout", destructive: true },
  ]

  return (
    <div className={`flex min-h-screen w-64 flex-col bg-white border-r border-gray-200 ${className}`}>
      {/* User Profile Section */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold">
            AS
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-gray-500 uppercase tracking-wide">BOQUIMICO M.P1010</span>
            <span className="text-sm font-medium text-gray-900">Andrew Smith</span>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => (
          <div key={item.id}>
            {item.hasSubmenu ? (
              <div>
                <Link
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    setIsEstudiosOpen(!isEstudiosOpen)
                  }}
                  className={`w-full flex items-center rounded-md px-2 py-2 text-left 
                    ${isEstudiosOpen ? "bg-blue-500 text-white" : "text-gray-700 hover:bg-blue-500 hover:text-white"}`}
                >
                  <item.icon className="mr-3 h-4 w-4" />
                  {item.label}
                  {isEstudiosOpen ? (
                    <ChevronDown className="ml-auto h-4 w-4" />
                  ) : (
                    <ChevronRight className="ml-auto h-4 w-4" />
                  )}
                </Link>
                {isEstudiosOpen && (
                  <div className="ml-7 mt-1 space-y-1">
                    {item.submenu?.map((subItem) => (
                      <Link
                        key={subItem.label}
                        href={subItem.href}
                        className={`block w-full text-sm px-2 py-1 rounded-md text-left 
                          ${pathname === subItem.href ? "bg-blue-500 text-white" : "text-gray-700 hover:bg-blue-500 hover:text-white"}`}
                      >
                        {subItem.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link
                href={item.href || "#"}
                className={`flex items-center px-2 py-2 rounded-md text-left 
                  ${pathname === item.href ? "bg-blue-500 text-white" : "text-gray-700 hover:bg-blue-500 hover:text-white"}`}
              >
                <item.icon className="mr-3 h-4 w-4" />
                {item.label}
              </Link>
            )}
          </div>
        ))}
      </nav>

      {/* Bottom Menu Items */}
      <div className="p-4 border-t border-gray-200 space-y-1">
        {bottomMenuItems.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className={`flex items-center px-2 py-2 rounded-md text-left 
              ${item.destructive
                ? "text-red-600 hover:bg-red-50 hover:text-red-700"
                : pathname === item.href
                  ? "bg-blue-500 text-white"
                  : "text-gray-700 hover:bg-blue-500 hover:text-white"
              }`}
          >
            <item.icon className="mr-3 h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  )
}

