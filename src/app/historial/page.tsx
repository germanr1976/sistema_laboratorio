"use client"  //histoial de estudios

import { useState } from "react"
import { Search, FileText, Calendar } from "lucide-react"

import { mockStudies } from "../../utils/datos-simulacion"
import { StudiesTable } from "../../componentes/Historial-Fecha"

export default function LabHistoryPage() {
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [filteredStudies, setFilteredStudies] = useState(mockStudies)

  const handleSearch = () => {
    if (!startDate && !endDate) {
      setFilteredStudies(mockStudies)
      return
    }

    const filtered = mockStudies.filter((study) => {
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

    setFilteredStudies(filtered)
  }

  const handleClear = () => {
    setStartDate("")
    setEndDate("")
    setFilteredStudies(mockStudies)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Historial de Estudios de Laboratorio</h1>
          <p className="text-gray-600">Busca y consulta los estudios realizados por rango de fechas</p>
        </div>

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
            <div className="flex items-center justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900">
                  <FileText className="h-5 w-5" />
                  Resultados
                </h2>
                <p className="mt-1 text-sm text-gray-600">Se encontraron {filteredStudies.length} estudios</p>
              </div>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
                Total: {filteredStudies.length}
              </span>
            </div>
          </div>
          <div className="p-6">
            <StudiesTable studies={filteredStudies} />
          </div>
        </div>
      </div>
    </div>
  )
}

