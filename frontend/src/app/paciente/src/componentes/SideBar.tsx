"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, User, Settings, HelpCircle, LogOut, FilePlus2 } from "lucide-react"

interface SidebarProps {
  className?: string
}

function getPatientSidebarUserData() {
  if (typeof window === 'undefined') {
    return { userName: 'Paciente', userInitials: 'P', userDni: '' }
  }

  try {
    const userDataStr = localStorage.getItem('userData')
    if (!userDataStr) {
      return { userName: 'Paciente', userInitials: 'P', userDni: '' }
    }

    const userData = JSON.parse(userDataStr)
    let fullName = 'Paciente'
    if (userData.profile?.firstName && userData.profile?.lastName) {
      fullName = `${userData.profile.firstName} ${userData.profile.lastName}`
    } else if (userData.profile?.firstName) {
      fullName = userData.profile.firstName
    } else if (userData.profile?.lastName) {
      fullName = userData.profile.lastName
    }

    const initials = fullName
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'P'

    return {
      userName: fullName,
      userInitials: initials,
      userDni: userData.dni || '',
    }
  } catch (e) {
    console.error('Error loading user data', e)
    return { userName: 'Paciente', userInitials: 'P', userDni: '' }
  }
}

export function Sidebar({ className = "" }: SidebarProps) {
  const pathname = usePathname()
  const basePath = "/paciente"
  const { userName, userInitials, userDni } = getPatientSidebarUserData()

  const menuItems = [
    { id: "dashboard", label: "Mis estudios", icon: Home, href: `${basePath}/dashboard` },
    { id: "solicitar-estudio", label: "Solicitar estudio", icon: FilePlus2, href: `${basePath}/solicitar-estudio` },
    { id: "historial", label: "Historial", icon: User, href: `${basePath}/historial` },
  ]

  const bottomMenuItems = [
    { id: "configuraciones", label: "Configuraciones", icon: Settings, href: `${basePath}/configuraciones` },
    { id: "ayuda", label: "Ayuda", icon: HelpCircle, href: `${basePath}/ayuda` },
    { id: "cerrar-sesion", label: "Cerrar sesión", icon: LogOut, href: `${basePath}/logout`, destructive: true },
  ]

  return (
    <div className={`flex h-screen w-64 flex-col bg-linear-to-b from-slate-900 to-slate-800 border-r border-slate-700 ${className}`}>
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
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {menuItems.map((item) => (
          <Link
            key={item.id}
            href={item.href || "#"}
            className={`flex items-center px-2 py-2 rounded-md text-left 
              ${pathname === item.href ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-700/50 hover:text-white"}`}
          >
            <item.icon className="mr-3 h-4 w-4" />
            {item.label}
          </Link>
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

