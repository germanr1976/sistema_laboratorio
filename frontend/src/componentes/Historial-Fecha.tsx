"use client"

import { useEffect, useMemo, useState } from "react"
import { Eye, Download, CircleOff } from "lucide-react"
import type { Study } from "../utils/tipos"
import { getStatusBadgeClass } from "../utils/uiClasses"

interface StudiesTableProps {
  studies: Study[]
  onCancelStudy?: (studyId: string) => void | Promise<void>
  cancellingStudyId?: string | null
}

export function StudiesTable({ studies, onCancelStudy, cancellingStudyId = null }: StudiesTableProps) {
  const studiesPerPage = 10
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = Math.max(1, Math.ceil(studies.length / studiesPerPage))

  useEffect(() => {
    setCurrentPage(1)
  }, [studies])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const { pageStudies, startIndex, endIndex } = useMemo(() => {
    const start = (currentPage - 1) * studiesPerPage
    const end = Math.min(start + studiesPerPage, studies.length)
    return {
      pageStudies: studies.slice(start, end),
      startIndex: start,
      endIndex: end,
    }
  }, [currentPage, studies])

  const formatDate = (dateString: string) => {
    const match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/)
    if (match) {
      return `${match[3]}/${match[2]}/${match[1]}`
    }

    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "UTC",
    })
  }

  if (studies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-gray-600">No se encontraron estudios en el rango de fechas seleccionado</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-md border border-gray-200">
      <table className="w-full text-sm table-auto">
        <thead className="border-b border-gray-200 bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-gray-700">Fecha</th>
            <th className="px-4 py-3 text-left font-medium text-gray-700">Médico</th>
            <th className="px-4 py-3 text-left font-medium text-gray-700">Obra social</th>
            <th className="px-4 py-3 text-left font-medium text-gray-700">Estado</th>
            <th className="px-4 py-3 text-left font-medium text-gray-700">Paciente</th>
            <th className="px-4 py-3 text-left font-medium text-gray-700">DNI</th>
            <th className="px-4 py-3 text-right font-medium text-gray-700">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {pageStudies.map((study) => (
            <tr key={study.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-gray-900">{formatDate(study.date)}</td>
              <td className="px-4 py-3 text-gray-600">{study.doctor}</td>
              <td className="px-4 py-3 text-gray-900">{study.obraSocial || study.study || "Sin obra social"}</td>
              <td className="px-4 py-3">
                <span
                  className={getStatusBadgeClass(study.status)}
                >
                  {study.status}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-900">{study.patientName}</td>
              <td className="px-4 py-3 text-gray-900">{study.dni || "-"}</td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                  {study.pdfUrl && (
                    <a
                      href={study.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-md p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                      title="Ver PDF"
                    >
                      <Eye className="h-4 w-4" />
                    </a>
                  )}
                  {study.pdfUrl ? (
                    <a
                      href={study.pdfUrl}
                      download
                      className="rounded-md p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                      title="Descargar PDF"
                    >
                      <Download className="h-4 w-4" />
                    </a>
                  ) : (
                    <span className="text-xs text-gray-500">Sin PDF</span>
                  )}

                  {onCancelStudy && study.status !== "Anulado" && (
                    <button
                      type="button"
                      onClick={() => onCancelStudy(study.id)}
                      disabled={cancellingStudyId === study.id}
                      className="rounded-md p-2 text-red-600 hover:bg-red-50 hover:text-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
                      title="Anular estudio"
                    >
                      <CircleOff className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div className="flex flex-col gap-3 border-t border-gray-200 bg-gray-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-gray-600 sm:text-sm">
            Mostrando {startIndex + 1}-{endIndex} de {studies.length} estudios
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
            >
              Anterior
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={`rounded-md px-2.5 py-1.5 text-xs font-medium sm:text-sm ${page === currentPage
                      ? "bg-blue-600 text-white"
                      : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                    }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
