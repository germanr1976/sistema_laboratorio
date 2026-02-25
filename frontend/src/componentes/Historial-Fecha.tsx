"use client"

import { Eye, Download, CircleOff } from "lucide-react"
import type { Study } from "../utils/tipos"
import { getStatusBadgeClass } from "../utils/uiClasses"

interface StudiesTableProps {
  studies: Study[]
  onCancelStudy?: (studyId: string) => void | Promise<void>
  cancellingStudyId?: string | null
}

export function StudiesTable({ studies, onCancelStudy, cancellingStudyId = null }: StudiesTableProps) {

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
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
            <th className="px-4 py-3 text-left font-medium text-gray-700">Paciente</th>
            <th className="px-4 py-3 text-left font-medium text-gray-700">DNI</th>
            <th className="px-4 py-3 text-left font-medium text-gray-700">Obra social</th>
            <th className="px-4 py-3 text-left font-medium text-gray-700">Estado</th>
            <th className="px-4 py-3 text-left font-medium text-gray-700">Médico</th>
            <th className="px-4 py-3 text-right font-medium text-gray-700">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {studies.map((study) => (
            <tr key={study.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-gray-900">{formatDate(study.date)}</td>
              <td className="px-4 py-3 text-gray-900">{study.patientName}</td>
              <td className="px-4 py-3 text-gray-900">{study.dni || "-"}</td>
              <td className="px-4 py-3 text-gray-900">{study.obraSocial || study.study || "Sin obra social"}</td>
              <td className="px-4 py-3">
                <span
                  className={getStatusBadgeClass(study.status)}
                >
                  {study.status}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-600">{study.doctor}</td>
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
    </div>
  )
}
