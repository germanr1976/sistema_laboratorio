"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"

import { savePdf } from "../utils/estudiosStore"
import authFetch from "../utils/authFetch"

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

const Search = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} cx="11" cy="11" r="8" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-4.35-4.35" />
  </svg>
)

const CheckCircle = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const X = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <line strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} x1="18" y1="6" x2="6" y2="18" />
    <line strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

type EstadoEstudio = "en_proceso" | "parcial" | "completado"

interface EstudioData {
  id?: string | number
  dni: string
  nombreApellido: string
  obraSocial: string
  fecha: string
  medico: string
  tipoEstudio?: string
  status?: EstadoEstudio
}

interface CargarNuevoProps {
  onCargarEstudio: (data: EstudioData, opts?: { autoComplete?: boolean }) => void
  initialId?: string
  initialData?: Partial<EstudioData>
}

interface PatientData {
  dni: string
  nombreApellido: string
  obraSocial: string
}

export function CargarNuevo({ onCargarEstudio, initialId, initialData }: CargarNuevoProps) {
  const router = useRouter()

  // PASO 1: Búsqueda/creación de paciente
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1)
  const [searchDni, setSearchDni] = useState("")
  const [patientFound, setPatientFound] = useState(false)
  const [isNewPatient, setIsNewPatient] = useState(false)
  const [patientData, setPatientData] = useState<PatientData>({
    dni: "",
    nombreApellido: "",
    obraSocial: ""
  })

  // PASO 2: Datos del estudio - siempre inicializar en "en_proceso"
  const [studyData, setStudyData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    medico: "",
    tipoEstudio: "",
    estado: "en_proceso" as EstadoEstudio
  })

  // PASO 3: Archivo (opcional según estado)
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [showPdfViewer, setShowPdfViewer] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [studyCreatedId, setStudyCreatedId] = useState<string | null>(null)
  const [editingExistingStudy, setEditingExistingStudy] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [now, setNow] = useState<Date>(new Date())
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(t)
  }, [])

  // Asegurar que estado siempre sea "en_proceso" al cargar nueva carga
  useEffect(() => {
    // Si no hay datos iniciales, asegurar que está en en_proceso
    if (!initialData && !initialId) {
      setStudyData(prev => ({
        ...prev,
        estado: "en_proceso"
      }))
    }
  }, [initialData, initialId])

  // Crear URL del PDF y limpiarla cuando cambie o se desmonte
  useEffect(() => {
    if (pdfFile) {
      const url = URL.createObjectURL(pdfFile)
      setPdfUrl(url)
      return () => URL.revokeObjectURL(url)
    } else {
      setPdfUrl(null)
    }
  }, [pdfFile])

  // Cargar estudio existente si viene con ID o initialData
  useEffect(() => {
    if (initialData) {
      // Si viene initialData (desde la API), usarla directamente
      console.log('[CargarNuevo] Loaded initialData:', initialData)

      setPatientData({
        dni: initialData.dni || "",
        nombreApellido: initialData.nombreApellido || "",
        obraSocial: initialData.obraSocial || ""
      })

      setStudyData({
        fecha: initialData.fecha || new Date().toISOString().split('T')[0],
        medico: initialData.medico || "",
        tipoEstudio: "",
        estado: (initialData.status as EstadoEstudio) || "en_proceso"
      })

      setStudyCreatedId(initialData.id?.toString() || null)
      setEditingExistingStudy(true)
      setPatientFound(true)
      setCurrentStep(3)
    } else if (initialId) {
      // Si solo hay initialId, buscar en localStorage
      try {
        const raw = localStorage.getItem('estudios_metadata')
        const metas = raw ? JSON.parse(raw) : []
        const found = metas.find((m: any) => m.id === initialId)

        if (found) {
          // Precarga los datos del paciente
          setPatientData({
            dni: found.dni || "",
            nombreApellido: found.nombreApellido || "",
            obraSocial: found.obraSocial || ""
          })

          // Precarga los datos del estudio
          setStudyData({
            fecha: found.fecha || new Date().toISOString().split('T')[0],
            medico: found.medico || "",
            tipoEstudio: found.tipoEstudio || "",
            estado: found.estado || "parcial"
          })

          // Salta al paso 3 para cargar archivo
          setCurrentStep(3)
          setEditingExistingStudy(true)
          setStudyCreatedId(initialId)
        }
      } catch (e) {
        console.error('Error loading existing study:', e)
      }
    }
  }, [initialId, initialData])
  const handleSearchPatient = async () => {
    if (!searchDni.trim()) {
      alert("Ingrese un DNI para buscar")
      return
    }

    try {
      // Buscar en el backend
      const response = await authFetch(`http://localhost:3000/api/studies/patient/${searchDni.trim()}`)

      if (response.ok) {
        const result = await response.json()
        const patient = result?.data
        console.log('Paciente encontrado:', patient)

        // Estructura de respuesta esperada del backend (study.controllers.getPatientByDni):
        // { id, dni, firstName, lastName, email }
        const firstName = patient?.firstName ?? patient?.profile?.firstName ?? ""
        const lastName = patient?.lastName ?? patient?.profile?.lastName ?? ""
        const nombreCompleto = `${firstName} ${lastName}`.trim()

        console.log('Datos extraídos:', { firstName, lastName, nombreCompleto })

        // Paciente encontrado - autocompletar datos con seguridad
        setPatientData({
          dni: patient?.dni ?? searchDni.trim(),
          nombreApellido: nombreCompleto || "Paciente sin nombre",
          obraSocial: patient?.socialInsurance ?? ""
        })
        setPatientFound(true)
        setIsNewPatient(false)
        console.log('Estado actualizado: paciente encontrado')
      } else {
        // Paciente no encontrado
        console.log('Paciente no encontrado, status:', response.status)
        setPatientData({
          dni: searchDni.trim(),
          nombreApellido: "",
          obraSocial: ""
        })
        setPatientFound(false)
        setIsNewPatient(true)
        console.log('Estado actualizado: paciente nuevo')
      }
    } catch (e) {
      console.error('Error searching patient:', e)
      // Si hay error, asumir que no existe
      setPatientData({
        dni: searchDni.trim(),
        nombreApellido: "",
        obraSocial: ""
      })
      setPatientFound(false)
      setIsNewPatient(true)
    }
  }

  // Guardar/actualizar paciente
  const handleSavePatient = async () => {
    console.log('handleSavePatient llamado con:', { patientData, patientFound, isNewPatient })

    if (!patientData.dni || !patientData.nombreApellido) {
      alert("Complete DNI y Nombre del paciente")
      return
    }

    try {
      // Si el paciente ya existe (fue encontrado), solo pasar al siguiente paso
      if (patientFound) {
        console.log('Paciente ya existe, avanzando al paso 2')
        setCurrentStep(2)
        return
      }

      // Si es nuevo, registrarlo en el backend
      const [firstName, ...lastNameParts] = patientData.nombreApellido.split(' ')
      const lastName = lastNameParts.join(' ') || firstName

      const response = await authFetch('http://localhost:3000/api/auth/register-patient', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          dni: patientData.dni,
          firstName,
          lastName,
          birthDate: new Date().toISOString().split('T')[0]
        })
      })

      // Si ya existe, tratarlo como encontrado y avanzar
      if (response.status === 409) {
        setPatientFound(true)
        setIsNewPatient(false)
        setCurrentStep(2)
        return
      }

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Error al registrar paciente')
      }

      const result = await response.json()
      console.log('Paciente registrado:', result)

      // Pasar al siguiente paso
      setCurrentStep(2)
    } catch (e: any) {
      console.error('Error saving patient:', e)
      alert(e.message || 'Error al guardar paciente')
    }
  }

  // Crear estudio (sin archivo obligatorio)
  const handleCreateStudy = async () => {
    // Validar según el estado
    if (studyData.estado !== "en_proceso") {
      // Para parcial y completado, se requieren fecha, médico y obra social
      if (!studyData.fecha || !studyData.medico) {
        alert("Complete fecha y médico")
        return
      }
      if (!patientData.obraSocial) {
        alert("Complete la obra social")
        return
      }
    }
    // Para en_proceso no se requiere nada especial

    try {
      // Preparar FormData para enviar al backend
      const formData = new FormData()
      formData.append('dni', patientData.dni)
      formData.append('studyName', studyData.tipoEstudio || 'Estudio médico')
      formData.append('studyDate', studyData.fecha)
      if (patientData.obraSocial) {
        formData.append('socialInsurance', patientData.obraSocial)
      }
      if (studyData.medico) {
        formData.append('medico', studyData.medico)
      }

      const response = await authFetch('http://localhost:3000/api/studies', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Error al crear estudio')
      }

      const result = await response.json()
      console.log('Estudio creado:', result)

      setStudyCreatedId(result.data.id.toString())

      // Si el estado es "en_proceso", podemos finalizar aquí
      if (studyData.estado === "en_proceso") {
        alert("✓ Estudio creado exitosamente en estado: EN PROCESO")
        router.push('/dashboard')
      } else {
        // Si es parcial o completado, pasar al paso 3 para subir archivo
        setCurrentStep(3)
      }
    } catch (e: any) {
      console.error('Error creating study:', e)
      alert(e.message || 'Error al crear estudio')
    }
  }

  // Manejar archivo
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

  const handleRequestFinish = () => {
    if (studyData.estado === "completado" && !pdfFile) {
      alert("El archivo es obligatorio para estudios completados")
      return
    }
    setShowConfirm(true)
  }

  // Finalizar con archivo
  const handleFinishWithFile = async () => {
    if (!pdfFile && studyData.estado === "completado") {
      alert("El archivo es obligatorio para estudios completados")
      return
    }

    if (!studyCreatedId) {
      alert("Error: No se encontró el ID del estudio")
      return
    }

    try {
      // Si hay PDF, actualizar el estudio con el archivo
      if (pdfFile) {
        const formData = new FormData()
        formData.append('dni', patientData.dni)
        formData.append('studyName', studyData.tipoEstudio || 'Estudio médico')
        formData.append('studyDate', studyData.fecha)
        if (patientData.obraSocial) {
          formData.append('socialInsurance', patientData.obraSocial)
        }
        if (studyData.medico) {
          formData.append('medico', studyData.medico)
        }
        formData.append('pdf', pdfFile)

        // Actualizar el estudio existente o crear uno nuevo con PDF
        const response = await authFetch('http://localhost:3000/api/studies', {
          method: 'POST',
          body: formData
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.message || 'Error al cargar archivo')
        }

        const result = await response.json()
        console.log('Estudio actualizado con PDF:', result)
      }

      // Si necesitamos actualizar el estado
      if (studyData.estado !== "en_proceso") {
        const statusMap: Record<string, string> = {
          en_proceso: 'IN_PROGRESS',
          parcial: 'PARTIAL',
          completado: 'COMPLETED'
        }

        const response = await authFetch(`http://localhost:3000/api/studies/${studyCreatedId}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            statusName: statusMap[studyData.estado]
          })
        })

        if (!response.ok) {
          console.warn('No se pudo actualizar el estado')
        }
      }

      alert(`✓ Estudio finalizado exitosamente con estado: ${studyData.estado.toUpperCase()}`)
      router.push('/dashboard')
    } catch (e: any) {
      console.error('Error finishing study:', e)
      alert(e.message || 'Error al finalizar estudio')
    }
  }

  const handleCancel = () => {
    router.back()
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  return (
    <div className="min-h-screen bg-gray-50 w-full text-black">
      {/* Header fijo con fecha y hora */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-300 px-8 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-black mb-1">Cargar Estudio</h1>
            <p className="text-gray-600 text-sm">
              Proceso paso a paso para registro profesional de estudios
            </p>
          </div>
          <div className="flex gap-4">
            <div className="bg-white border border-gray-300 rounded-lg px-4 py-2 shadow-sm">
              <p className="text-sm text-gray-600">Fecha</p>
              <p className="text-base font-semibold text-gray-800 capitalize">{formatDate(now)}</p>
            </div>
            <div className="bg-white border border-gray-300 rounded-lg px-4 py-2 shadow-sm">
              <p className="text-sm text-gray-600">Hora</p>
              <p className="text-base font-semibold text-gray-800">{formatTime(now)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Indicador de pasos */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-4">
            {/* Paso 1 */}
            <div className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold ${currentStep === 1 ? 'bg-blue-600 text-white' :
                currentStep > 1 ? 'bg-green-500 text-white' :
                  'bg-gray-300 text-gray-600'
                }`}>
                {currentStep > 1 ? <CheckCircle className="w-6 h-6" /> : '1'}
              </div>
              <span className="ml-2 text-sm font-medium">Paciente</span>
            </div>

            <div className="w-16 h-1 bg-gray-300"></div>

            {/* Paso 2 */}
            <div className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold ${currentStep === 2 ? 'bg-blue-600 text-white' :
                currentStep > 2 ? 'bg-green-500 text-white' :
                  'bg-gray-300 text-gray-600'
                }`}>
                {currentStep > 2 ? <CheckCircle className="w-6 h-6" /> : '2'}
              </div>
              <span className="ml-2 text-sm font-medium">Estudio</span>
            </div>

            <div className="w-16 h-1 bg-gray-300"></div>

            {/* Paso 3 */}
            <div className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold ${currentStep === 3 ? 'bg-blue-600 text-white' :
                'bg-gray-300 text-gray-600'
                }`}>
                3
              </div>
              <span className="ml-2 text-sm font-medium">Archivo</span>
            </div>
          </div>
        </div>

        {/* PASO 1: Identificar/Crear Paciente */}
        {currentStep === 1 && (
          <div className="bg-white rounded-xl shadow-md p-8 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
              <User className="w-6 h-6 text-blue-600" />
              <div>
                <h2 className="text-xl font-semibold text-black">Paso 1: Identificar Paciente</h2>
                <p className="text-sm text-gray-600">Busque por DNI o cree un nuevo paciente</p>
              </div>
            </div>

            {/* Búsqueda por DNI */}
            <div className="space-y-4">
              <label className="text-sm font-medium text-black block">
                Buscar por DNI
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={searchDni}
                  onChange={(e) => setSearchDni(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchPatient()}
                  className="flex-1 bg-white border-2 border-gray-300 rounded-lg px-4 py-3 text-black placeholder:text-gray-400 focus:outline-none focus:border-blue-600 transition-colors"
                  placeholder="Ingrese DNI del paciente"
                />
                <button
                  onClick={handleSearchPatient}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold shadow-sm hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Search className="w-5 h-5" />
                  Buscar / Crear
                </button>
              </div>

              {/* Mensaje de resultado */}
              {patientFound && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-800">¡Paciente encontrado!</p>
                    <p className="text-sm text-green-700">Los datos se han autocompletado.</p>
                  </div>
                </div>
              )}

              {isNewPatient && !patientFound && searchDni && (
                <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 flex items-start gap-3">
                  <div className="w-5 h-5 bg-amber-300 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-amber-700 text-xs font-bold">!</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-amber-900">Paciente no encontrado en el sistema</p>
                    <p className="text-sm text-amber-800">Realice la carga completando los datos requeridos a continuación.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Formulario de paciente */}
            {(patientFound || isNewPatient) && (
              <div className="space-y-4 pt-4 border-t border-gray-200">
                <h3 className="font-medium text-gray-900">Datos del Paciente</h3>

                {/* Selector de estado */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-black block">
                    Estado del Estudio <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={studyData.estado}
                    onChange={(e) => setStudyData({ ...studyData, estado: e.target.value as EstadoEstudio })}
                    className="w-full bg-white border-2 border-gray-300 rounded-lg px-4 py-3 text-black focus:outline-none focus:border-blue-600 transition-colors"
                  >
                    <option value="en_proceso">🟡 En Proceso (Paso 1 - Recomendado)</option>
                    <option value="parcial">🟠 Parcial (Con datos iniciales)</option>
                    <option value="completado">🟢 Completado (Estudio finalizado)</option>
                  </select>
                  <p className="text-xs text-gray-600">
                    {studyData.estado === "en_proceso" && "✓ Registra solo DNI y nombre. Podrás agregar más detalles después."}
                    {studyData.estado === "parcial" && "Requiere fecha y médico. Para estudios con resultados preliminares."}
                    {studyData.estado === "completado" && "Requiere fecha, médico y PDF obligatorio. Para estudios finalizados."}
                  </p>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium text-black block">DNI</label>
                  <input
                    type="text"
                    value={patientData.dni}
                    disabled
                    className="w-full bg-gray-100 border-2 border-gray-300 rounded-lg px-4 py-3 text-gray-600"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium text-black block">
                    Nombre y Apellido <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={patientData.nombreApellido}
                    onChange={(e) => setPatientData({ ...patientData, nombreApellido: e.target.value })}
                    disabled={patientFound}
                    className={`w-full ${patientFound ? 'bg-gray-100' : 'bg-white'} border-2 border-gray-300 rounded-lg px-4 py-3 text-black placeholder:text-gray-400 focus:outline-none focus:border-blue-600 transition-colors`}
                    placeholder="Ingrese nombre completo"
                  />
                </div>

                {/* Obra Social solo aparece si NO es "en_proceso" */}
                {studyData.estado !== "en_proceso" && (
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-black block">Obra Social</label>
                    <input
                      type="text"
                      value={patientData.obraSocial}
                      onChange={(e) => setPatientData({ ...patientData, obraSocial: e.target.value })}
                      className="w-full bg-white border-2 border-gray-300 rounded-lg px-4 py-3 text-black placeholder:text-gray-400 focus:outline-none focus:border-blue-600 transition-colors"
                      placeholder="Ej: OSDE, Swiss Medical"
                    />
                  </div>
                )}

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={handleCancel}
                    className="flex-1 bg-white border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSavePatient}
                    className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold shadow-sm hover:bg-blue-700 transition-colors"
                  >
                    Continuar al Paso 2
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PASO 2: Crear Estudio */}
        {currentStep === 2 && (
          <div className="bg-white rounded-xl shadow-md p-8 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
              <FileText className="w-6 h-6 text-blue-600" />
              <div>
                <h2 className="text-xl font-semibold text-black">Paso 2: Crear Estudio</h2>
                <p className="text-sm text-gray-600">Registre el estudio (el archivo se carga después)</p>
              </div>
            </div>

            {/* Resumen del paciente */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase">Paciente seleccionado</p>
              <p className="font-medium text-gray-900">{patientData.nombreApellido}</p>
              <p className="text-sm text-gray-600">DNI: {patientData.dni}</p>
              {patientData.obraSocial && <p className="text-sm text-gray-600">Obra Social: {patientData.obraSocial}</p>}
            </div>

            {/* Datos del estudio */}
            <div className="space-y-4">
              {/* Solo mostrar estos campos si NO es "en_proceso" */}
              {studyData.estado !== "en_proceso" && (
                <>
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-black block">
                      Obra Social <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={patientData.obraSocial}
                      onChange={(e) => setPatientData({ ...patientData, obraSocial: e.target.value })}
                      className="w-full bg-white border-2 border-gray-300 rounded-lg px-4 py-3 text-black placeholder:text-gray-400 focus:outline-none focus:border-blue-600 transition-colors"
                      placeholder="Ej: OSDE, Swiss Medical"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-medium text-black block">
                      Fecha del Estudio <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={studyData.fecha}
                      onChange={(e) => setStudyData({ ...studyData, fecha: e.target.value })}
                      className="w-full bg-white border-2 border-gray-300 rounded-lg px-4 py-3 text-black focus:outline-none focus:border-blue-600 transition-colors"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-medium text-black block">
                      Profesional/Médico <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={studyData.medico}
                      onChange={(e) => setStudyData({ ...studyData, medico: e.target.value })}
                      className="w-full bg-white border-2 border-gray-300 rounded-lg px-4 py-3 text-black placeholder:text-gray-400 focus:outline-none focus:border-blue-600 transition-colors"
                      placeholder="Dr./Dra. Nombre"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-medium text-black block">Tipo de Estudio</label>
                    <input
                      type="text"
                      value={studyData.tipoEstudio}
                      onChange={(e) => setStudyData({ ...studyData, tipoEstudio: e.target.value })}
                      className="w-full bg-white border-2 border-gray-300 rounded-lg px-4 py-3 text-black placeholder:text-gray-400 focus:outline-none focus:border-blue-600 transition-colors"
                      placeholder="Ej: Hemograma, Perfil lipídico"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Información importante */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
              <div className="w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-blue-600 text-xs font-bold">i</span>
              </div>
              <p className="text-sm text-blue-700">
                El estudio se creará con el estado seleccionado.
                {studyData.estado === "en_proceso" && " No es necesario cargar el archivo ahora."}
                {studyData.estado !== "en_proceso" && " En el siguiente paso podrá cargar el archivo del estudio."}
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                onClick={() => setCurrentStep(1)}
                className="flex-1 bg-white border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Volver
              </button>
              <button
                onClick={handleCreateStudy}
                className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold shadow-sm hover:bg-green-700 transition-colors"
              >
                {studyData.estado === "en_proceso" ? "Crear Estudio" : "Crear y Continuar"}
              </button>
            </div>
          </div>
        )}

        {/* PASO 3: Cargar Archivo (opcional según estado) */}
        {currentStep === 3 && (
          <div className="bg-white rounded-xl shadow-md p-8 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
              <Upload className="w-6 h-6 text-blue-600" />
              <div>
                <h2 className="text-xl font-semibold text-black">Paso 3: Cargar Archivo</h2>
                <p className="text-sm text-gray-600">
                  {editingExistingStudy
                    ? "Complete la carga del estudio parcial"
                    : `Adjunte el PDF del estudio (${studyData.estado === "completado" ? "obligatorio" : "opcional"})`}
                </p>
              </div>
            </div>

            {/* Resumen del paciente */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase">Paciente seleccionado</p>
              <p className="font-medium text-gray-900">{patientData.nombreApellido || 'Sin nombre'}</p>
              <p className="text-sm text-gray-600">DNI: {patientData.dni}</p>
              {patientData.obraSocial && <p className="text-sm text-gray-600">Obra Social: {patientData.obraSocial}</p>}
            </div>

            {/* Resumen del estudio */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase">Estudio</p>
              <div className="flex gap-4 text-sm text-gray-600">
                <span>Fecha: {studyData.fecha}</span>
                <span>•</span>
                <span>Médico: {studyData.medico || 'Sin asignar'}</span>
              </div>
              <div className="pt-2 flex items-center justify-between">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${studyData.estado === "completado" ? "bg-green-100 text-green-700" :
                  studyData.estado === "parcial" ? "bg-orange-100 text-orange-700" :
                    "bg-yellow-100 text-yellow-700"
                  }`}>
                  {studyData.estado === "completado" ? "🟢 Completado" :
                    studyData.estado === "parcial" ? "🟠 Parcial" :
                      "🟡 En Proceso"}
                </span>
                {editingExistingStudy && (
                  <select
                    value={studyData.estado}
                    onChange={(e) => setStudyData({ ...studyData, estado: e.target.value as EstadoEstudio })}
                    className="text-xs px-3 py-1 border border-gray-300 rounded bg-white"
                  >
                    <option value="en_proceso">En Proceso</option>
                    <option value="parcial">Parcial</option>
                    <option value="completado">Completado</option>
                  </select>
                )}
              </div>
            </div>

            {/* Área de carga de archivo */}
            <div className="space-y-4">
              {!pdfFile ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer group ${isDragging
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
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto group-hover:bg-blue-200 transition-colors">
                      <Upload className="w-8 h-8 text-blue-600" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-lg font-medium text-gray-900">Seleccionar archivo PDF</p>
                      <p className="text-sm text-gray-600">
                        Arrastra y suelta tu archivo aquí o haz clic para seleccionar
                      </p>
                      <p className="text-xs text-gray-500">PDF • Máximo 50MB</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-blue-600 rounded-xl overflow-hidden bg-blue-50">
                  {/* Vista previa del PDF */}
                  <div className="bg-gray-100 p-4">
                    {pdfUrl && (
                      <iframe
                        src={pdfUrl}
                        className="w-full h-96 rounded-lg border-2 border-gray-300 bg-white"
                        title="Vista previa del PDF"
                      />
                    )}
                  </div>

                  {/* Información del archivo */}
                  <div className="p-6">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                          <FileText className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{pdfFile.name}</p>
                          <p className="text-sm text-gray-600">{(pdfFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShowPdfViewer(true)}
                          className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
                        >
                          Ver en grande
                        </button>
                        <button
                          onClick={handleRemoveFile}
                          className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center hover:bg-red-200 transition-colors"
                        >
                          <X className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Advertencia si es obligatorio */}
            {studyData.estado === "completado" && !pdfFile && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <div className="w-5 h-5 bg-red-200 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-red-600 text-xs font-bold">!</span>
                </div>
                <p className="text-sm text-red-700">
                  El archivo es obligatorio para estudios completados. Por favor, cargue el PDF antes de finalizar.
                </p>
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <button
                onClick={() => setCurrentStep(2)}
                className="flex-1 bg-white border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Volver a editar datos
              </button>
              <button
                onClick={handleRequestFinish}
                disabled={studyData.estado === "completado" && !pdfFile}
                className={`flex-1 px-6 py-3 rounded-lg font-semibold shadow-sm transition-colors ${studyData.estado === "completado" && !pdfFile
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
              >
                {editingExistingStudy ? "Confirmar y finalizar" : "Confirmar y finalizar"}
              </button>
            </div>
          </div>
        )}
      </div>

      {showPdfViewer && pdfUrl && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <div>
                <p className="text-sm font-semibold text-gray-600">Vista previa</p>
                <p className="text-base font-bold text-gray-900 truncate">{pdfFile?.name || "Archivo PDF"}</p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-2 bg-gray-100 text-gray-800 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors"
                >
                  Abrir en nueva pestaña
                </a>
                <button
                  onClick={() => setShowPdfViewer(false)}
                  className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center"
                  aria-label="Cerrar vista PDF"
                >
                  <X className="w-5 h-5 text-gray-700" />
                </button>
              </div>
            </div>
            <div className="flex-1 bg-gray-50">
              <iframe
                src={pdfUrl}
                className="w-full h-full rounded-b-2xl"
                title="Vista previa del PDF"
              />
            </div>
          </div>
        </div>
      )}

      {showConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-black">Confirmar carga</h3>
              <button
                onClick={() => setShowConfirm(false)}
                className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="space-y-3 text-sm text-gray-700">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">Paciente</p>
                <p className="font-medium text-black">{patientData.nombreApellido || "Sin nombre"}</p>
                <p>DNI: {patientData.dni || "-"}</p>
                {patientData.obraSocial && <p>Obra Social: {patientData.obraSocial}</p>}
              </div>

              <div className="pt-2">
                <p className="text-xs font-semibold text-gray-500 uppercase">Estudio</p>
                <p>Fecha: {studyData.fecha}</p>
                <p>Médico: {studyData.medico || "-"}</p>
                <p>Tipo: {studyData.tipoEstudio || "-"}</p>
                <p>Estado: {studyData.estado === "completado" ? "Completado" : studyData.estado === "parcial" ? "Parcial" : "En proceso"}</p>
              </div>

              <div className="pt-2">
                <p className="text-xs font-semibold text-gray-500 uppercase">Archivo</p>
                {pdfFile ? (
                  <p className="text-sm text-gray-800">• {pdfFile.name}</p>
                ) : (
                  <p className="text-gray-600">No hay archivos seleccionados</p>
                )}
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-800">
                Revisa bien antes de confirmar. El paso final no permite modificaciones.
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 bg-white border-2 border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Volver a editar
              </button>
              <button
                onClick={() => {
                  setShowConfirm(false)
                  handleFinishWithFile()
                }}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold shadow-sm hover:bg-blue-700 transition-colors"
              >
                Confirmar y finalizar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
