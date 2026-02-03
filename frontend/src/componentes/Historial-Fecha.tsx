"use client"

import { Eye, Download } from "lucide-react"
import type { Study } from "../utils/tipos"

interface StudiesTableProps {
  studies: Study[]
}

export function StudiesTable({ studies }: StudiesTableProps) {
  const getStatusStyles = (status: string) => {
    switch (status) {
      case "Completado":
        return "bg-green-100 text-green-800 border-green-200"
      case "Parcial":
        return "bg-gray-100 text-gray-800 border-gray-300"
      case "En Proceso":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

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
      <table className="w-full text-sm">
        <thead className="border-b border-gray-200 bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-gray-700">ID</th>
            <th className="px-4 py-3 text-left font-medium text-gray-700">Paciente</th>
            <th className="px-4 py-3 text-left font-medium text-gray-700">Obra social</th>
            <th className="px-4 py-3 text-left font-medium text-gray-700">Fecha</th>
            <th className="px-4 py-3 text-left font-medium text-gray-700">Estado</th>
            <th className="px-4 py-3 text-left font-medium text-gray-700">Médico</th>
            <th className="px-4 py-3 text-right font-medium text-gray-700">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {studies.map((study) => (
            <tr key={study.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium text-gray-900">{study.id}</td>
              <td className="px-4 py-3 text-gray-900">{study.patientName}</td>
              <td className="px-4 py-3 text-gray-900">{study.study}</td>
              <td className="px-4 py-3 text-gray-900">{formatDate(study.date)}</td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getStatusStyles(study.status)}`}
                >
                  {study.status}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-600">{study.doctor}</td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                  {study.status !== "En Proceso" && (
                    <button className="rounded-md p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900">
                      <Eye className="h-4 w-4" />
                    </button>
                  )}
                  <button className="rounded-md p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900">
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
