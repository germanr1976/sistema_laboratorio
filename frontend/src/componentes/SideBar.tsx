"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useRouter } from "next/navigation"
import { Home, BarChart3, ChevronDown, ChevronRight, User, Settings, HelpCircle, LogOut } from "lucide-react"

interface SidebarProps {
  className?: string
}

export function Sidebar({ className = "" }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isEstudiosOpen, setIsEstudiosOpen] = useState(pathname?.startsWith("/estudios"))
  const [userName, setUserName] = useState<string>("Usuario")
  const [userDni, setUserDni] = useState<string>("")
  const [userRole, setUserRole] = useState<string>("")
  const [userInitials, setUserInitials] = useState<string>("U")

  useEffect(() => {
    // Obtener datos del usuario desde localStorage
    try {
      const userDataStr = localStorage.getItem('userData')
      const userType = localStorage.getItem('userType')

      if (userDataStr) {
        const userData = JSON.parse(userDataStr)

        // Obtener nombre completo desde profile
        let fullName = "Usuario";
        if (userData.profile?.firstName && userData.profile?.lastName) {
          fullName = `${userData.profile.firstName} ${userData.profile.lastName}`;
        } else if (userData.profile?.firstName) {
          fullName = userData.profile.firstName;
        } else if (userData.profile?.lastName) {
          fullName = userData.profile.lastName;
        }

        setUserName(fullName)

        // Obtener DNI
        if (userData.dni) {
          setUserDni(userData.dni)
        }

        // Calcular iniciales
        const initials = fullName
          .split(' ')
          .map((n: string) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2)
        setUserInitials(initials)

        // Establecer rol
        if (userType === 'professional') {
          setUserRole(userData.role || 'PROFESIONAL')
        } else if (userType === 'patient') {
          setUserRole('PACIENTE')
        }
      }
    } catch (e) {
      console.error('Error loading user data', e)
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('userType')
    localStorage.removeItem('userData')
    sessionStorage.setItem('justLoggedOut', 'true')
    router.push('/')
  }

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: Home, href: "/dashboard" },
    {
      id: "estudios",
      label: "Gestionar Estudios",
      icon: BarChart3,
      hasSubmenu: true,
      submenu: [
        { id: "cargar-nuevo", label: "Cargar Estudio", href: "/cargar-nuevo" },
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
    <div className={`fixed left-0 top-0 h-screen w-64 flex flex-col bg-white border-r border-gray-200 z-40 ${className}`}>
      {/* Logo Section */}
      <div className="p-4 border-b border-gray-200 flex justify-center">
        <img
          src="/icons/logo_lab.png"
          alt="Icono laboratorio"
          className="h-16 w-16 object-contain rounded-full border-2 border-blue-300 bg-white cursor-pointer hover:scale-105 transition-transform"
          onClick={() => router.push("/")}
        />
      </div>

      {/* User Profile Section */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">
            {userInitials}
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            {userRole && <span className="text-xs text-gray-500 uppercase tracking-wide">{userRole}</span>}
            <span className="text-sm font-medium text-gray-900 truncate">{userName}</span>
            {userDni && <span className="text-xs text-gray-600">DNI: {userDni}</span>}
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
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
            onClick={(e) => {
              if (item.id === 'cerrar-sesion') {
                e.preventDefault()
                handleLogout()
              }
            }}
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