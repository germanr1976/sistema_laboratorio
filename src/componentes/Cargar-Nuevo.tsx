"use client"

import type React from "react"

import { useState, useRef } from "react"
import type { EstudioData } from "../app/revision/page"
import { savePdf } from "../utils/estudiosStore"

const Upload = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} points="7,10 12,5 17,10" />
    <line strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} x1="12" y1="5" x2="12" y2="15" />
  </svg>
)

const FileText = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2Z"
    />
    <polyline strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} points="14,2 14,8 20,8" />
    <line strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} x1="16" y1="13" x2="8" y2="13" />
    <line strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} x1="16" y1="17" x2="8" y2="17" />
    <polyline strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} points="10,9 9,9 8,9" />
  </svg>
)

const User = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} cx="12" cy="7" r="4" />
  </svg>
)

const X = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <line strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} x1="18" y1="6" x2="6" y2="18" />
    <line strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

interface CargarNuevoProps {
  onCargarEstudio: (data: EstudioData, opts?: { autoComplete?: boolean }) => void
}

export function CargarNuevo({ onCargarEstudio }: CargarNuevoProps) {
  const [formData, setFormData] = useState({
    nombreApellido: "",
    dni: "",
    fecha: "",
    obraSocial: "",
    medico: "",
  })
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleFileChange = (file: File | null) => {
    if (file && file.type === "application/pdf") {
      setPdfFile(file)
    } else if (file) {
      alert("Por favor, selecciona un archivo PDF")
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    handleFileChange(file)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    handleFileChange(file)
  }

  const handleRemoveFile = () => {
    setPdfFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSubmit = async (autoComplete = false) => {
    // Validar que todos los campos estén completos
    if (!formData.nombreApellido || !formData.dni || !formData.fecha || !formData.obraSocial || !formData.medico) {
      alert("Por favor, complete todos los campos")
      return
    }

    if (!pdfFile) {
      alert("Por favor, seleccione un archivo PDF")
      return
    }

    // Guardar PDF en IndexedDB y crear un id para referenciarlo
    const id = `estudio_${Date.now()}_${Math.floor(Math.random() * 10000)}`
    let saveSucceeded = false
    console.debug('[cargar] handleSubmit start', { formData, fileName: pdfFile?.name, id })
    try {
      await savePdf(id, pdfFile)
      saveSucceeded = true
      console.debug('[cargar] savePdf succeeded', id)
    } catch (err) {
      console.error('[cargar] Error guardando PDF en IndexedDB', err)
      // continuar: queremos que el padre reciba metadata para debugging
    }

    // Crear URL del PDF para visualizacion temporal
    const pdfUrl = pdfFile ? URL.createObjectURL(pdfFile) : ''

    const payload = {
      ...formData,
      pdfFile: null,
      pdfUrl,
      id,
    } as EstudioData

    // Persistir temporalmente para depuración (permite verificar en console si el hijo envió datos)
    try {
      localStorage.setItem('estudio_in_memory', JSON.stringify(payload))
      console.debug('[cargar] estudio_in_memory persisted', payload)
    } catch (e) {
      console.warn('[cargar] no se pudo persistir estudio_in_memory', e)
    }

    // Si se solicitó autoComplete, persistir metadata como fallback (redundancia)
    if (autoComplete) {
      try {
        const raw2 = localStorage.getItem('estudios_metadata')
        const metas = raw2 ? JSON.parse(raw2) as Array<Record<string, unknown>> : []
        const existingIds = new Set(metas.map(m => (m.id as string | undefined)))
        if (!existingIds.has(payload.id)) {
          const rest = { ...(payload as Record<string, unknown>), status: 'completado' } as Record<string, unknown>
          // @ts-ignore
          delete rest['pdfFile']
          metas.push(rest)
          localStorage.setItem('estudios_metadata', JSON.stringify(metas))
          console.debug('[cargar] fallback persisted estudios_metadata', metas)
        } else {
          console.debug('[cargar] fallback skipped persist because id already exists', payload.id)
        }
      } catch (e) {
        console.warn('[cargar] no se pudo persistir estudios_metadata en fallback', e)
      }
    }

    // Llamar al padre con manejo de errores
    try {
      onCargarEstudio(payload, { autoComplete })
      console.debug('[cargar] onCargarEstudio called', payload, { autoComplete })
    } catch (e) {
      console.error('[cargar] onCargarEstudio threw', e)
    }

    // Si se pidió autoComplete, redirigir al /revision para mostrar el dashboard actualizado
    if (autoComplete) {
      try {
        window.location.href = '/revision'
      } catch (e) {
        console.warn('[cargar] no se pudo redirigir a /revision', e)
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 w-full text-black">
      <div className="border-b border-gray-300 px-8 py-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mb-0">
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-black mb-1 text-left">Cargar Nuevo Estudio</h1>
            <p className="text-gray-700 text-base text-left">
              Complete la información del paciente y adjunte el archivo del estudio
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="space-y-8">
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-4">
              <User className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-black">Información del Paciente</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label htmlFor="nombre" className="text-sm font-medium text-black block">
                  Nombre y apellido
                </label>
                <input
                  id="nombre"
                  value={formData.nombreApellido}
                  onChange={(e) => handleInputChange("nombreApellido", e.target.value)}
                  className="w-full bg-white border-2 border-gray-300 rounded-lg px-4 py-3 text-black placeholder:text-gray-400 focus:outline-none focus:border-blue-600 transition-colors"
                  placeholder="Ingrese nombre completo"
                />
              </div>

              <div className="space-y-3">
                <label htmlFor="dni" className="text-sm font-medium text-black block">
                  DNI
                </label>
                <input
                  id="dni"
                  value={formData.dni}
                  onChange={(e) => handleInputChange("dni", e.target.value)}
                  className="w-full bg-white border-2 border-gray-300 rounded-lg px-4 py-3 text-black placeholder:text-gray-400 focus:outline-none focus:border-blue-600 transition-colors"
                  placeholder="Ingrese DNI"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label htmlFor="fecha" className="text-sm font-medium text-black block">
                Fecha del estudio
              </label>
              <input
                id="fecha"
                type="date"
                value={formData.fecha}
                onChange={(e) => handleInputChange("fecha", e.target.value)}
                className="w-full bg-white border-2 border-gray-300 rounded-lg px-4 py-3 text-black placeholder:text-gray-400 focus:outline-none focus:border-blue-600 transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label htmlFor="obra-social" className="text-sm font-medium text-black block">
                  Obra social
                </label>
                <input
                  id="obra-social"
                  value={formData.obraSocial}
                  onChange={(e) => handleInputChange("obraSocial", e.target.value)}
                  className="w-full bg-white border-2 border-gray-300 rounded-lg px-4 py-3 text-black placeholder:text-gray-400 focus:outline-none focus:border-blue-600 transition-colors"
                  placeholder="Ej: OSDE, Swiss Medical"
                />
              </div>

              <div className="space-y-3">
                <label htmlFor="medico" className="text-sm font-medium text-black block">
                  Médico
                </label>
                <input
                  id="medico"
                  value={formData.medico}
                  onChange={(e) => handleInputChange("medico", e.target.value)}
                  className="w-full bg-white border-2 border-gray-300 rounded-lg px-4 py-3 text-black placeholder:text-gray-400 focus:outline-none focus:border-blue-600 transition-colors"
                  placeholder="Dr./Dra. Nombre"
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-4">
              <Upload className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-black">Archivo del Estudio</h2>
            </div>

            {!pdfFile ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-16 text-center transition-all cursor-pointer group ${isDragging
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-300 hover:border-blue-400 hover:bg-blue-50/50"
                  }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
                <div className="space-y-4">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto group-hover:bg-blue-200 transition-colors">
                    <Upload className="w-8 h-8 text-blue-600" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-lg font-medium text-gray-900">Seleccionar archivo</p>
                    <p className="text-sm text-gray-600">
                      Arrastra y suelta tu archivo aquí o haz clic para seleccionar
                    </p>
                    <p className="text-xs text-gray-500">PDF • Máximo 10MB</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border-2 border-blue-600 rounded-xl p-6 bg-blue-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{pdfFile.name}</p>
                      <p className="text-sm text-gray-600">{(pdfFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <button
                    onClick={handleRemoveFile}
                    className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center hover:bg-red-200 transition-colors"
                  >
                    <X className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-8">
            <button
              onClick={() => window.location.reload()}
              className="flex-1 bg-white border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-lg font-semibold shadow-sm hover:bg-blue-50 hover:border-blue-700 hover:text-blue-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => handleSubmit(false)}
              className="flex-1 bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold shadow-sm hover:bg-blue-700 transition-colors"
            >
              Cargar Estudio
            </button>
          </div>

          <div className="bg-red-50 rounded-lg p-6 border border-red-200">
            <div className="flex gap-3">
              <div className="w-5 h-5 bg-red-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-red-600 text-xs font-bold">!</span>
              </div>
              <p className="text-sm text-red-600">
                Verifique que todos los datos sean correctos antes de cargar el archivo. El estudio será procesado y
                enviado al paciente
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
