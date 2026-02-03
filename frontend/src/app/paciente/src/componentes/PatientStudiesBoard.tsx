"use client"

import { useEffect, useMemo, useState } from "react"
import { Download, FileText, Loader2, Share2, Calendar, Building2, UserRound, FileCheck, Clock, AlertCircle } from "lucide-react"
import authFetch from "../../../../utils/authFetch"

export type StudyStatus = "completed" | "in-progress" | "pending" | "partial"
export type StudyFilter = "all" | StudyStatus | "open"

export type Study = {
  id: string
  patientName: string
  dni: string
  date: string
  status: StudyStatus
  obraSocial: string
  medico: string
  pdfUrl?: string
  pdfs?: string[]
  studyName?: string
}

const statusConfig: Record<StudyStatus, { label: string; badgeClass: string; dotClass: string }> = {
  "completed": {
    label: "Completado",
    badgeClass: "bg-green-100 text-green-700",
    dotClass: "bg-green-500",
  },
  "in-progress": {
    label: "En proceso",
    badgeClass: "bg-orange-100 text-orange-700",
    dotClass: "bg-orange-500",
  },
  "pending": {
    label: "Pendiente",
    badgeClass: "bg-red-100 text-red-700",
    dotClass: "bg-red-500",
  },
  "partial": {
    label: "Parcial",
    badgeClass: "bg-yellow-100 text-yellow-700",
    dotClass: "bg-yellow-500",
  },
}

const filters: { id: StudyFilter; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "completed", label: "Completados" },
  { id: "in-progress", label: "En proceso" },
  { id: "pending", label: "Pendientes" },
]

type Props = {
  title?: string
  subtitle?: string
  initialFilter?: StudyFilter
  emptyHint?: string
}

function formatDate(value?: string) {
  if (!value) return "-"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" })
}

function mapStatus(name?: string): StudyStatus {
  if (!name) return "pending"
  const normalized = name.toUpperCase()

  // Log para debugging
  if (typeof window !== 'undefined') {
    console.log("Status recibido del backend:", name, "->", normalized)
  }

  if (normalized === "COMPLETED" || normalized === "COMPLETADO") return "completed"
  if (normalized === "IN_PROGRESS" || normalized === "EN_PROCESO" || normalized === "INPROGRESS") return "in-progress"
  if (normalized === "PARTIAL" || normalized === "PARCIAL") return "partial"
  if (normalized === "PENDING" || normalized === "PENDIENTE") return "pending"

  // Si no coincide con ninguno, asumimos que es el estado por defecto
  console.warn("Estado desconocido:", name)
  return "pending"
}

export default function PatientStudiesBoard({
  title = "¡Bienvenido!",
  subtitle = "Revisa tus resultados y el estado de tus estudios.",
  initialFilter = "all",
  emptyHint = "No hay estudios para mostrar aún.",
}: Props) {
  const [studies, setStudies] = useState<Study[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<StudyFilter>(initialFilter)

  useEffect(() => {
    let mounted = true
    const loadStudies = async () => {
      try {
        const response = await authFetch("http://localhost:3000/api/studies/patient/me")
        if (!response.ok) {
          console.error("Error fetching studies:", response.statusText)
          return
        }
        const result = await response.json()
        const backendStudies = result?.data || []

        const transformed: Study[] = backendStudies.map((s: any) => {
          const pdfs = Array.isArray(s.pdfs) ? s.pdfs : (s.pdfUrl ? [s.pdfUrl] : [])
          const pdfLinks = pdfs.map((p: string) => p.startsWith('http') ? p : `http://localhost:3000${p}`)
          return {
            id: s.id?.toString() || crypto.randomUUID(),
            patientName: `${s.patient?.profile?.firstName || ""} ${s.patient?.profile?.lastName || ""}`.trim() || "Paciente",
            dni: s.patient?.dni || "-",
            date: formatDate(s.studyDate),
            status: mapStatus(s.status?.name),
            obraSocial: s.socialInsurance || "Sin obra social",
            // Médico: solo desde campo 'doctor'; no usar bioquímico como fallback
            medico: s.doctor || "Sin asignar",
            pdfUrl: pdfLinks[0],
            pdfs: pdfLinks,
            studyName: s.studyName || "Estudio médico"
          }
        })

        if (mounted) setStudies(transformed)
      } catch (e) {
        console.error("Error loading studies:", e)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadStudies()
    return () => {
      mounted = false
    }
  }, [])

  const stats = useMemo(() => {
    const totals = { total: studies.length, completed: 0, inProgress: 0, pending: 0, partial: 0 }
    studies.forEach((s) => {
      if (s.status === "completed") totals.completed += 1
      else if (s.status === "in-progress") totals.inProgress += 1
      else if (s.status === "partial") totals.partial += 1
      else totals.pending += 1
    })
    return totals
  }, [studies])

  const filteredStudies = useMemo(() => {
    if (activeFilter === "all") return studies
    if (activeFilter === "open") return studies.filter((s) => s.status !== "completed")
    return studies.filter((s) => s.status === activeFilter)
  }, [activeFilter, studies])

  const copyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      alert('Enlace copiado al portapapeles')
    } catch (e) {
      console.warn('No se pudo copiar. Mostrando prompt.')
      prompt('Copiá el enlace:', url)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
        <p className="text-base text-gray-600">{subtitle}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl bg-white border-2 border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Estudios Totales</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white border-2 border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
              <FileCheck className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Completados</p>
              <p className="text-3xl font-bold text-gray-900">{stats.completed}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white border-2 border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">En Proceso</p>
              <p className="text-3xl font-bold text-gray-900">{stats.inProgress}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white border-2 border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Parcial</p>
              <p className="text-3xl font-bold text-gray-900">{stats.partial}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border-2 border-gray-200 p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-base font-semibold text-gray-700">Filtrar por estado:</label>
          {filters.map((filter) => {
            const isActive = activeFilter === filter.id
            return (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`rounded-lg px-4 py-2.5 text-base font-semibold border-2 transition-all ${isActive
                  ? "bg-blue-600 text-white border-blue-600 shadow-md"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
                  }`}
              >
                {filter.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Studies List */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="rounded-xl border-2 border-gray-200 bg-gray-50 p-6 animate-pulse" />
            ))}
          </div>
        ) : filteredStudies.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-12 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-base font-medium text-gray-600">{emptyHint}</p>
          </div>
        ) : (
          filteredStudies.map((study) => {
            const status = statusConfig[study.status]
            const isProcessing = study.status === "in-progress" || study.status === "pending" || study.status === "partial"

            return (
              <article key={study.id} className="rounded-xl border-2 border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-all">
                <div className="space-y-4">
                  {/* Header with Status */}
                  <div className="flex items-start justify-between gap-4 pb-4 border-b border-gray-200">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{study.studyName || "Estudio Médico"}</h3>
                      <p className="text-sm text-gray-600 mt-1">Estudio ID: {study.id}</p>
                    </div>
                    <span className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold whitespace-nowrap ${status.badgeClass}`}>
                      <span className={`h-2.5 w-2.5 rounded-full ${status.dotClass}`} />
                      {status.label}
                    </span>
                  </div>

                  {/* Study Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-500 uppercase">Fecha del Estudio</p>
                        <p className="text-base font-semibold text-gray-900">{study.date}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-500 uppercase">Obra Social</p>
                        <p className="text-base font-semibold text-gray-900 truncate">{study.obraSocial}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                        <UserRound className="w-5 h-5 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-500 uppercase">Médico</p>
                        <p className="text-base font-semibold text-gray-900 truncate">{study.medico}</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 border-t border-gray-200">
                    {isProcessing ? (
                      <div className="flex items-center justify-center gap-3 rounded-lg bg-amber-50 border-2 border-amber-200 px-4 py-3">
                        <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
                        <span className="text-base font-semibold text-amber-900">
                          {study.status === "in-progress" && "Estudio en proceso de análisis..."}
                          {study.status === "pending" && "Estudio pendiente de revisión..."}
                          {study.status === "partial" && "Resultados parciales disponibles pronto..."}
                        </span>
                      </div>
                    ) : study.pdfs && study.pdfs.length > 0 ? (
                      <div className="space-y-3">
                        <p className="text-sm font-semibold text-gray-700">Documentos disponibles:</p>
                        <div className="flex flex-wrap gap-3">
                          {study.pdfs.map((link, idx) => (
                            <div key={idx} className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg px-4 py-3 shadow-md">
                              <FileText className="w-5 h-5" />
                              <span className="text-sm font-semibold">PDF {idx + 1}</span>
                              <div className="flex items-center gap-1 ml-2 border-l border-blue-400 pl-2">
                                <a
                                  href={link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 hover:bg-blue-500 rounded transition-colors"
                                  title="Ver PDF"
                                >
                                  <FileText className="w-4 h-4" />
                                </a>
                                <a
                                  href={link}
                                  download
                                  className="p-1.5 hover:bg-blue-500 rounded transition-colors"
                                  title="Descargar PDF"
                                >
                                  <Download className="w-4 h-4" />
                                </a>
                                <button
                                  onClick={() => copyLink(link)}
                                  className="p-1.5 hover:bg-blue-500 rounded transition-colors"
                                  title="Compartir enlace"
                                >
                                  <Share2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-3 rounded-lg bg-gray-50 border-2 border-gray-200 px-4 py-3">
                        <FileText className="h-5 w-5 text-gray-400" />
                        <span className="text-base font-medium text-gray-600">No hay documentos disponibles aún</span>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            )
          })
        )}
      </div>
    </div>
  )
}
