"use client"  //histoial de estudios

import { useState, useEffect } from "react"
import { Search, FileText, Calendar } from "lucide-react"
import { StudiesTable } from "../../componentes/Historial-Fecha"
import authFetch from "../../../../../utils/authFetch"
import type { Study } from "../../utils/tipos"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"

export default function LabHistoryPage() {
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc")
  const [allStudies, setAllStudies] = useState<Study[]>([])
  const [filteredStudies, setFilteredStudies] = useState<Study[]>([])
  const [loading, setLoading] = useState(true)

  const sortStudiesByDate = (studies: Study[], order: "desc" | "asc") => {
    return [...studies].sort((a, b) => {
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()

      if (Number.isNaN(dateA) && Number.isNaN(dateB)) return 0
      if (Number.isNaN(dateA)) return 1
      if (Number.isNaN(dateB)) return -1

      return order === "desc" ? dateB - dateA : dateA - dateB
    })
  }

  useEffect(() => {
    const loadStudies = async () => {
      try {
        const response = await authFetch(`${API_URL}/api/studies/patient/me`)
        if (!response.ok) {
          console.error('Error fetching studies:', response.statusText)
          setLoading(false)
          return
        }
        const result = await response.json()
        const backendStudiesRaw = result?.data?.items ?? result?.items ?? result?.data ?? []
        const backendStudies = Array.isArray(backendStudiesRaw) ? backendStudiesRaw : []

        if (!Array.isArray(backendStudiesRaw)) {
          console.warn('Formato inesperado en /patient/me:', result)
        }

        // Transformar datos del backend al formato del componente
        const transformedStudies: Study[] = backendStudies.map((s: any) => {
          const attachmentUrls = Array.isArray(s.attachments)
            ? s.attachments.map((a: any) => a?.url).filter(Boolean)
            : []
          const rawPdfs = attachmentUrls.length > 0
            ? attachmentUrls
            : (Array.isArray(s.pdfs) ? s.pdfs : (s.pdfUrl ? [s.pdfUrl] : []))

          const pdfLinks = rawPdfs
            .map((p: string) => (p?.startsWith("http") ? p : `${API_URL}${p}`))
            .filter(Boolean)

          return {
            id: s.id?.toString() || crypto.randomUUID(),
            patientName: `${s.patient?.profile?.firstName || ''} ${s.patient?.profile?.lastName || ''}`.toUpperCase(),
            obraSocial: s.socialInsurance || 'Sin obra social',
            date: s.studyDate,
            status: s.status?.name === "COMPLETED" ? "Completado" : s.status?.name === "PARTIAL" ? "Parcial" : "En Proceso",
            doctor: s.doctor || 'Sin asignar',
            pdfUrl: pdfLinks[0],
            pdfs: pdfLinks,
          }
        })

        const sortedStudies = sortStudiesByDate(transformedStudies, sortOrder)
        setAllStudies(sortedStudies)
        setFilteredStudies(sortedStudies)
        setLoading(false)
      } catch (e) {
        console.error('Error loading studies:', e)
        setLoading(false)
      }
    }
    loadStudies()
  }, [])

  const handleSearch = () => {
    if (!startDate && !endDate) {
      setFilteredStudies(sortStudiesByDate(allStudies, sortOrder))
      return
    }

    const filtered = allStudies.filter((study) => {
      const studyDate = new Date(study.date)
      const start = startDate ? new Date(startDate) : null
      const end = endDate ? new Date(endDate) : null

      if (start && end) {
        return studyDate >= start && studyDate <= end
      } else if (start) {
        return studyDate >= start
      } else if (end) {
        return studyDate <= end
      }
      return true
    })

    setFilteredStudies(sortStudiesByDate(filtered, sortOrder))
  }

  const handleClear = () => {
    setStartDate("")
    setEndDate("")
    setFilteredStudies(sortStudiesByDate(allStudies, sortOrder))
  }

  const handleSortChange = (newOrder: "desc" | "asc") => {
    setSortOrder(newOrder)
    setFilteredStudies((prev) => sortStudiesByDate(prev, newOrder))
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Historial de Estudios de Laboratorio</h1>
          <p className="text-gray-600">Busca y consulta los estudios realizados por rango de fechas</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-gray-600">Cargando historial...</p>
          </div>
        ) : (
          <>
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 p-6">
                <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900">
                  <Calendar className="h-5 w-5" />
                  Búsqueda
                </h2>
                <p className="mt-1 text-sm text-gray-600">Selecciona un rango de fechas para ver los estudios</p>
              </div>
              <div className="p-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <label htmlFor="start-date" className="text-sm font-medium text-gray-700">
                      Fecha Desde
                    </label>
                    <input
                      id="start-date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="end-date" className="text-sm font-medium text-gray-700">
                      Fecha Hasta
                    </label>
                    <input
                      id="end-date"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <button
                      onClick={handleSearch}
                      className="flex flex-1 items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      <Search className="h-4 w-4" />
                      Buscar
                    </button>
                    <button
                      onClick={handleClear}
                      className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      Limpiar
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 p-6">
                <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900">
                      <FileText className="h-5 w-5" />
                      Resultados
                    </h2>
                    <p className="mt-1 text-sm text-gray-600">Se encontraron {filteredStudies.length} estudios</p>
                  </div>
                  <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto sm:justify-end">
                    <label htmlFor="sort-order" className="text-sm font-medium text-gray-700">
                      Ordenar:
                    </label>
                    <select
                      id="sort-order"
                      value={sortOrder}
                      onChange={(e) => handleSortChange(e.target.value as "desc" | "asc")}
                      className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="desc">Más recientes</option>
                      <option value="asc">Más antiguos</option>
                    </select>
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
                      Total: {filteredStudies.length}
                    </span>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <StudiesTable studies={filteredStudies} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

