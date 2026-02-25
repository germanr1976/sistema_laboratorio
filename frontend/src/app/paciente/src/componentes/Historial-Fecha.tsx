"use client"

import { useState } from "react"
import { Eye, Download } from "lucide-react"
import type { Study } from "../utils/tipos"
import Toast from "../../../../componentes/Toast"
import { getStatusBadgeClass } from "../../../../utils/uiClasses"

interface StudiesTableProps {
  studies: Study[]
}

export function StudiesTable({ studies }: StudiesTableProps) {
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState("")
  const [toastType, setToastType] = useState<"success" | "error" | "info">("info")

  const showToastMessage = (message: string, type: "success" | "error" | "info" = "info") => {
    setToastMessage(message)
    setToastType(type)
    setShowToast(true)
  }

  const downloadPdf = async (pdfUrl: string) => {
    try {
      const response = await fetch(pdfUrl)
      if (!response.ok) throw new Error("No se pudo descargar el archivo")

      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = blobUrl
      link.download = "estudio-laboratorio.pdf"
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(blobUrl)
      showToastMessage("Descarga iniciada", "success")
    } catch (error) {
      console.error("Error descargando PDF:", error)
      showToastMessage("No se pudo descargar el PDF", "error")
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
    <>
      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setShowToast(false)}
        />
      )}

      <div className="overflow-x-auto rounded-md border border-gray-200">
        <table className="w-full text-sm table-auto">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Fecha</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Obra social</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Estado</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700 min-w-40">Médico</th>
              <th className="px-4 py-3 text-right font-medium text-gray-700 w-28">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {studies.map((study) => (
              <tr key={study.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-900">{formatDate(study.date)}</td>
                <td className="px-4 py-3 text-gray-900">{study.obraSocial}</td>
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
                    {study.pdfUrl ? (
                      <>
                        <a
                          href={study.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-md p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                          title="Ver PDF"
                        >
                          <Eye className="h-4 w-4" />
                        </a>
                        <button
                          type="button"
                          onClick={() => downloadPdf(study.pdfUrl!)}
                          className="rounded-md p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                          title="Descargar PDF"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <span className="text-xs text-gray-500">Sin PDF</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
