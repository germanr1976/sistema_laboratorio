
"use client"

import { useEffect, useState } from "react"
import { CargarNuevo } from "../../componentes/Cargar-Nuevo"
import { RevisarEstudio } from "../../componentes/Revisar-Estudio"
import Dashboard from "../../componentes/Dashboard"


export type EstudioData = {
  nombreApellido: string
  dni: string
  fecha: string
  obraSocial: string
  medico: string
  pdfFile: File | null
  pdfUrl: string
  id?: string
  status?: "completado" | "parcial" | "en-proceso"
}

export default function Home() {
  const [currentView, setCurrentView] = useState<"dashboard" | "cargar" | "revisar">("dashboard")
  const [estudioData, setEstudioData] = useState<EstudioData | null>(null)
  const [estudios, setEstudios] = useState<EstudioData[]>([])
  // Debug: persistir el estudio actualmente en revisión para diagnosticar flujo
  useEffect(() => {
    try {
      console.debug('[revision] estudioData changed:', estudioData)
      localStorage.setItem('estudio_in_memory', JSON.stringify(estudioData))
    } catch (e) {
      console.warn('[revision] no se pudo persistir estudio_in_memory', e)
    }
  }, [estudioData])
  // Load estudios from localStorage + resolve PDFs from IndexedDB
  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const raw = localStorage.getItem('estudios_metadata')
        if (!raw) return
        const metas = JSON.parse(raw) as Array<Partial<EstudioData> & { id?: string; pdfUrl?: string }>
        // For each meta, try to get blob from IndexedDB
        const resolved: EstudioData[] = await Promise.all(
          metas.map(async (m) => {
            // Ensure all required fields are present and fallback to empty string if missing
            const nombreApellido = m.nombreApellido ?? "";
            const dni = m.dni ?? "";
            const fecha = m.fecha ?? "";
            const obraSocial = m.obraSocial ?? "";
            const medico = m.medico ?? "";
            let pdfUrl = m.pdfUrl ?? "";
            if (m.id) {
              try {
                const { getPdf } = await import('../../utils/estudiosStore')
                const blob = await getPdf(m.id)
                if (blob) {
                  pdfUrl = URL.createObjectURL(blob);
                }
              } catch (e) {
                console.warn('No se pudo cargar PDF para', m.id, e)
              }
            }
            return {
              nombreApellido,
              dni,
              fecha,
              obraSocial,
              medico,
              pdfFile: null,
              pdfUrl,
              id: m.id,
              status: m.status
            };
          })
        )
        if (mounted) {
          console.debug('[revision] estudios cargados desde storage:', resolved)
          setEstudios(resolved)
        }
      } catch (e) {
        console.error('Error cargando estudios desde localStorage', e)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  const handleCargarEstudio = (data: EstudioData, opts?: { autoComplete?: boolean }) => {
    console.debug('[revision] handleCargarEstudio', data, opts)
    if (opts?.autoComplete) {
      const nuevoEstudio = { ...data, status: 'completado' as const }
      try {
        const raw = localStorage.getItem('estudios_metadata')
        const metas = raw ? JSON.parse(raw) as Array<Record<string, unknown>> : []
        const rest = { ...nuevoEstudio } as Record<string, unknown>
        // @ts-ignore - remove runtime-only
        delete rest['pdfFile']
        metas.push(rest)
        localStorage.setItem('estudios_metadata', JSON.stringify(metas))
      } catch (e) {
        console.error('Error persisting metadata on load', e)
      }
      setEstudios((prev) => [...prev, nuevoEstudio])
      setEstudioData(null)
      setCurrentView('dashboard')
      return
    }
    setEstudioData(data)
    setCurrentView('revisar')
  }

  const handleVolver = () => {
    setCurrentView("cargar")
  }

  const handleCompletado = () => {
    if (estudioData) {
      const nuevoEstudio = { ...estudioData, status: "completado" as const };
      console.debug('[revision] marcar completado (start):', nuevoEstudio)

      // Defensive immediate write to localStorage so we can confirm persistence
      try {
        const raw = localStorage.getItem('estudios_metadata')
        const metas = raw ? JSON.parse(raw) as Array<Record<string, unknown>> : []
        const rest = { ...nuevoEstudio } as Record<string, unknown>
        // @ts-ignore - remove runtime-only field before persisting
        delete rest['pdfFile']
        metas.push(rest)
        localStorage.setItem('estudios_metadata', JSON.stringify(metas))
        console.debug('[revision] defensive write to localStorage:', metas)
      } catch (err) {
        console.error('[revision] error writing defensive metadata to localStorage', err)
      }

      // Update in-memory state for immediate UI update
      setEstudios((prev) => {
        const next = [...prev, nuevoEstudio]
        return next
      })

      setEstudioData(null)
      // Provide immediate feedback and navigate to the list so user can verify
      try {
        // small UX feedback
        // eslint-disable-next-line no-alert
        alert('Estudio marcado como completado y guardado localmente')
      } catch (e) {
        /* ignore */
      }
      // redirect to the completed list (uses same origin/port as current app)
      try {
        window.location.href = '/estudios/completados'
      } catch (e) {
        setCurrentView("dashboard")
      }
    }
  }

  const handleParcial = () => {
    if (estudioData) {
      const nuevoEstudio = { ...estudioData, status: "parcial" as const }
      console.debug('[revision] marcar parcial:', nuevoEstudio)
      setEstudios((prev) => {
        const next = [...prev, nuevoEstudio]
        const metadata = next.map((e) => {
          const rest = { ...e } as Record<string, unknown>
          // @ts-ignore deleting dynamic prop on unknown-typed record
          delete (rest as Record<string, unknown>)['pdfFile']
          return rest
        })
        console.debug('[revision] guardando en localStorage metadata:', metadata)
        localStorage.setItem('estudios_metadata', JSON.stringify(metadata))
        return next
      })
      setEstudioData(null)
      setCurrentView("dashboard")
    }
  }

  // Debug: log estudios whenever cambian
  useEffect(() => {
    console.debug('[revision] estudios state changed:', estudios)
  }, [estudios])

  // When switching to dashboard, reload metadata from localStorage to stay in sync
  useEffect(() => {
    if (currentView !== 'dashboard') return
    try {
      const raw = localStorage.getItem('estudios_metadata')
      if (!raw) return
      const metas = JSON.parse(raw) as Array<Partial<EstudioData> & { id?: string; pdfUrl?: string }>
      const resolved = metas.map(m => ({
        nombreApellido: m.nombreApellido ?? '',
        dni: m.dni ?? '',
        fecha: m.fecha ?? '',
        obraSocial: m.obraSocial ?? '',
        medico: m.medico ?? '',
        pdfFile: null,
        pdfUrl: m.pdfUrl ?? '',
        id: m.id,
        status: m.status as any
      })) as EstudioData[]
      setEstudios(resolved)
    } catch (e) {
      console.warn('[revision] no se pudo recargar metadata al entrar a dashboard', e)
    }
  }, [currentView])

  // funciones auxiliares no usadas actualmente en la UI

  return (
    <>
      {currentView === "dashboard" && (
        <Dashboard
          // Key dinámico para forzar remount cuando cambian los estudios (hotfix)
          key={`${estudios.length}-${estudios[estudios.length - 1]?.id ?? ''}`}
          completados={estudios.filter(e => e.status === "completado").length}
          totales={estudios.length}
          ultimoCompletado={estudios.filter(e => e.status === "completado").slice(-1)[0]}
        />
      )}
      {currentView === "cargar" && <CargarNuevo onCargarEstudio={handleCargarEstudio} />}
      {currentView === "revisar" && estudioData && (
        <RevisarEstudio
          estudioData={estudioData}
          onVolver={handleVolver}
          onCompletado={handleCompletado}
          onParcial={handleParcial}
        />
      )}
    </>
  )
}
