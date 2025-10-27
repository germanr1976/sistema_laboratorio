"use client"

import type { EstudioData } from "../app/revision/page"

const ArrowLeft = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
)

interface RevisarEstudioProps {
  estudioData: EstudioData
  onVolver: () => void
  onCompletado: () => void
  onParcial: () => void
}

export function RevisarEstudio({ estudioData, onVolver, onCompletado, onParcial }: RevisarEstudioProps) {
  return (
    <div className="min-h-screen bg-gray-200 w-full">
      {/* Header con botón de volver */}
      <div className="bg-gray-200 px-6 py-4">
        <button
          onClick={onVolver}
          className="w-10 h-10 bg-white rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
      </div>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna izquierda - Datos del paciente */}
          <div className="space-y-4">
            <div className="bg-gray-300 rounded-lg p-4">
              <label className="text-xs text-gray-600 block mb-1">Nombre y apellido</label>
              <input
                type="text"
                value={estudioData.nombreApellido}
                readOnly
                tabIndex={-1}
                className="w-full bg-gray-100 border border-gray-400 rounded px-3 py-2 text-sm text-gray-800 opacity-70 cursor-not-allowed hover:bg-gray-200 focus:outline-none"
              />
            </div>

            <div className="bg-gray-300 rounded-lg p-4">
              <label className="text-xs text-gray-600 block mb-1">DNI</label>
              <input
                type="text"
                value={estudioData.dni}
                readOnly
                tabIndex={-1}
                className="w-full bg-gray-100 border border-gray-400 rounded px-3 py-2 text-sm text-gray-800 opacity-70 cursor-not-allowed hover:bg-gray-200 focus:outline-none"
              />
            </div>
            <div className="bg-gray-300 rounded-lg p-4">
              <label className="text-xs text-gray-600 block mb-1">Fecha del estudio</label>
              <input
                type="text"
                value={estudioData.fecha}
                readOnly
                tabIndex={-1}
                className="w-full bg-gray-100 border border-gray-400 rounded px-3 py-2 text-sm text-gray-800 opacity-70 cursor-not-allowed hover:bg-gray-200 focus:outline-none"
              />
            </div>

            <div className="bg-gray-300 rounded-lg p-4">
              <label className="text-xs text-gray-600 block mb-1">Obra social</label>
              <input
                type="text"
                value={estudioData.obraSocial}
                readOnly
                tabIndex={-1}
                className="w-full bg-gray-100 border border-gray-400 rounded px-3 py-2 text-sm text-gray-800 opacity-70 cursor-not-allowed hover:bg-gray-200 focus:outline-none"
              />
            </div>

            <div className="bg-gray-300 rounded-lg p-4">
              <label className="text-xs text-gray-600 block mb-1">Médico</label>
              <input
                type="text"
                value={estudioData.medico}
                readOnly
                tabIndex={-1}
                className="w-full bg-gray-100 border border-gray-400 rounded px-3 py-2 text-sm text-gray-800 opacity-70 cursor-not-allowed hover:bg-gray-200 focus:outline-none"
              />
            </div>
          </div>

          {/* Columna derecha - Visualizador de PDF */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden" style={{ height: "calc(100vh - 200px)" }}>
              <iframe src={estudioData.pdfUrl} className="w-full h-full" title="Visualizador de PDF" />
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end gap-4 mt-8">
          <button
            onClick={() => {
              console.debug('[revisar] Parcial clicked', estudioData)
              onParcial()
            }}
            className="px-8 py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors shadow-md"
          >
            Parcial
          </button>
          <button
            type="button"
            onClick={() => {
              console.debug('[revisar] Completado clicked', estudioData)
              onCompletado()
            }}
            className="px-8 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors shadow-md"
          >
            Completado
          </button>
        </div>
      </div>
    </div>
  )
}
