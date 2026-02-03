"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, BarChart3, ChevronDown, ChevronRight, User, Settings, HelpCircle, LogOut } from "lucide-react"

interface SidebarProps {
  className?: string
}

export function Sidebar({ className = "" }: SidebarProps) {
  const pathname = usePathname()
  const basePath = "/paciente"
  const studiesPaths = [`${basePath}/completados`, `${basePath}/pendientes`, `${basePath}/parciales`]
  const [isEstudiosOpen, setIsEstudiosOpen] = useState(
    studiesPaths.some((p) => pathname?.startsWith(p))
  )
  const [userName, setUserName] = useState<string>("Paciente")
  const [userInitials, setUserInitials] = useState<string>("P")
  const [userDni, setUserDni] = useState<string>("")

  useEffect(() => {
    // Cargar datos del usuario desde localStorage
    try {
      const userDataStr = localStorage.getItem("userData")
      if (userDataStr) {
        const userData = JSON.parse(userDataStr)

        // Obtener nombre completo desde profile
        let fullName = "Paciente"
        if (userData.profile?.firstName && userData.profile?.lastName) {
          fullName = `${userData.profile.firstName} ${userData.profile.lastName}`
        } else if (userData.profile?.firstName) {
          fullName = userData.profile.firstName
        } else if (userData.profile?.lastName) {
          fullName = userData.profile.lastName
        }

        setUserName(fullName)

        // Calcular iniciales
        const initials = fullName
          .split(" ")
          .map((n: string) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2)
        setUserInitials(initials)

        // Obtener DNI
        if (userData.dni) {
          setUserDni(userData.dni)
        }
      }
    } catch (e) {
      console.error("Error loading user data", e)
    }
  }, [])

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: Home, href: `${basePath}/dashboard` },
    {
      id: "estudios",
      label: "Mis estudios",
      icon: BarChart3,
      hasSubmenu: true,
      submenu: [
        { id: "completados", label: "Últimos estudios", href: `${basePath}/completados` },
        { id: "pendientes", label: "Pendientes", href: `${basePath}/pendientes` },
      ],
    },
    { id: "historial", label: "Historial", icon: User, href: `${basePath}/historial` },
  ]

  const bottomMenuItems = [
    { id: "configuraciones", label: "Configuraciones", icon: Settings, href: `${basePath}/configuraciones` },
    { id: "ayuda", label: "Ayuda", icon: HelpCircle, href: `${basePath}/ayuda` },
    { id: "cerrar-sesion", label: "Cerrar sesión", icon: LogOut, href: `${basePath}/logout`, destructive: true },
  ]

  return (
    <div className={`flex min-h-screen w-64 flex-col bg-gradient-to-b from-slate-900 to-slate-800 border-r border-slate-700 ${className}`}>
      {/* User Profile Section */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
            {userInitials}
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-xs text-slate-400 uppercase tracking-wide">PACIENTE</span>
            <span className="text-sm font-medium text-white truncate">{userName}</span>
            {userDni && <span className="text-xs text-slate-300 truncate">DNI: {userDni}</span>}
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
                    ${isEstudiosOpen ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-700/50 hover:text-white"}`}
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
                          ${pathname === subItem.href ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-700/50 hover:text-white"}`}
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
                  ${pathname === item.href ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-700/50 hover:text-white"}`}
              >
                <item.icon className="mr-3 h-4 w-4" />
                {item.label}
              </Link>
            )}
          </div>
        ))}
      </nav>

      {/* Bottom Menu Items */}
      <div className="p-4 border-t border-slate-700 space-y-1">
        {bottomMenuItems.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className={`flex items-center px-2 py-2 rounded-md text-left 
              ${item.destructive
                ? "text-red-400 hover:bg-red-900/20 hover:text-red-300"
                : pathname === item.href
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
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

