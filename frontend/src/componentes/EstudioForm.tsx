"use client"

import React, { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import authFetch from '../utils/authFetch'
import { savePdf, getPdf } from '../utils/estudiosStore'
import Toast from './Toast'
import {
    cardClasses,
    leftColClasses,
    nameClasses,
    metaClasses,
    rightActionsClasses,
    btnPdf,
    btnNoFile,
    iconBtn,
    badgeCompletado,
    badgeParcial,
    badgeEnProceso,
} from '../utils/uiClasses'
import { Loader2, X, FileText, Upload, CheckCircle2, Clock, FileEdit, Save, Eye } from 'lucide-react'

type EstadoEstudio = "en_proceso" | "parcial" | "completado"

interface EstudioFormProps {
    estudioExistente?: {
        id: string | number
        backendId?: string | number
        nombreApellido: string
        dni: string
        fechaEstudio: string
        obraSocial: string
        medico: string
        pdfs?: string[]
        attachments?: Array<{ id: number; url: string; filename?: string }>
        estado?: EstadoEstudio
    }
    modoEdicion?: boolean
    permitirCambioEstado?: boolean
    onSuccess?: () => void
}

export function EstudioForm({
    estudioExistente,
    modoEdicion = false,
    permitirCambioEstado = false,
    onSuccess,
}: EstudioFormProps) {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [showToast, setShowToast] = useState(false)
    const [toastMessage, setToastMessage] = useState('')
    const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success')

    // Mostrar fecha y hora actual al abrir el formulario
    useEffect(() => {
        const now = new Date()
        const fecha = now.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
        const hora = now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
        setToastMessage(`Hoy es ${fecha} • ${hora}`)
        setToastType('info')
        setShowToast(true)
        const t = setTimeout(() => setShowToast(false), 4000)
        return () => clearTimeout(t)
    }, [])

    // Determinar estado inicial
    const estadoInicial = (): EstadoEstudio => {
        if (estudioExistente?.estado) {
            return estudioExistente.estado
        }
        return 'en_proceso'
    }

    const todayLocal = () => {
        const d = new Date()
        const y = d.getFullYear()
        const m = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        return `${y}-${m}-${day}`
    }

    // Estado del formulario
    const [estado, setEstado] = useState<EstadoEstudio>(estadoInicial())
    const [nombreApellido, setNombreApellido] = useState(estudioExistente?.nombreApellido || '')
    const [dni, setDni] = useState(estudioExistente?.dni || '')
    const [fechaEstudio, setFechaEstudio] = useState(estudioExistente?.fechaEstudio || todayLocal())
    const [obraSocial, setObraSocial] = useState(estudioExistente?.obraSocial || '')
    const [medico, setMedico] = useState(estudioExistente?.medico || '')
    const [pdfs, setPdfs] = useState<File[]>([])
    const [isDragging, setIsDragging] = useState(false)
    const [pacienteEncontrado, setPacienteEncontrado] = useState(false)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [previewName, setPreviewName] = useState<string | null>(null)

    // Actualizar el formulario cuando cambien los datos del estudio existente
    useEffect(() => {
        if (estudioExistente) {
            console.log('Actualizando formulario con:', estudioExistente)
            setNombreApellido(estudioExistente.nombreApellido || '')
            setDni(estudioExistente.dni || '')
            setFechaEstudio(estudioExistente.fechaEstudio || '')
            setObraSocial(estudioExistente.obraSocial || '')
            setMedico(estudioExistente.medico || '')
            // Si está en modo cambio de estado y el estado es "en_proceso", cambiar a "parcial" por defecto
            if (permitirCambioEstado && estudioExistente.estado === 'en_proceso') {
                setEstado('parcial')
            } else {
                setEstado(estudioExistente.estado || 'en_proceso')
            }
            setPacienteEncontrado(!!estudioExistente.dni)
        }
    }, [estudioExistente, permitirCambioEstado])

    // Buscar paciente cuando cambia el DNI (solo si no es modo edición)
    useEffect(() => {
        if (modoEdicion || dni.length < 7) {
            if (!modoEdicion) setPacienteEncontrado(false)
            return
        }

        const buscarPaciente = async () => {
            try {
                const response = await authFetch(`${API_URL}/api/studies/patient/${dni.trim()}`)
                if (response.ok) {
                    const result = await response.json()
                    const patient = result?.data

                    if (patient) {
                        const firstName = patient?.firstName ?? patient?.profile?.firstName ?? ''
                        const lastName = patient?.lastName ?? patient?.profile?.lastName ?? ''
                        setNombreApellido(`${firstName} ${lastName}`.trim())
                        // Solo precargar obra social si NO es en_proceso (es decir, si es parcial o completado)
                        if (patient?.socialInsurance && estado !== 'en_proceso') {
                            setObraSocial(patient.socialInsurance)
                            console.log('✅ Paciente cargado - Obra Social:', patient?.socialInsurance)
                        }
                        setPacienteEncontrado(true)
                    } else {
                        setPacienteEncontrado(false)
                    }
                }
            } catch (error) {
                console.error('Error buscando paciente:', error)
                setPacienteEncontrado(false)
            }
        }

        const timeoutId = setTimeout(buscarPaciente, 500)
        return () => clearTimeout(timeoutId)
    }, [dni, modoEdicion])

    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        const pdfFiles = files.filter(file => file.type === 'application/pdf')

        if (files.length !== pdfFiles.length) {
            showToastMessage('Solo se aceptan archivos PDF', 'error')
            return
        }

        setPdfs(prev => [...prev, ...pdfFiles])
    }, [])

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(true)
    }

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)

        const files = Array.from(e.dataTransfer.files)
        const pdfFiles = files.filter(file => file.type === 'application/pdf')

        if (files.length !== pdfFiles.length) {
            showToastMessage('Solo se aceptan archivos PDF', 'error')
            return
        }

        setPdfs(prev => [...prev, ...pdfFiles])
    }

    const removeFile = useCallback((index: number) => {
        setPdfs(prev => prev.filter((_, i) => i !== index))
    }, [])

    const openPreviewFromFile = (file: File) => {
        try {
            const url = URL.createObjectURL(file)
            setPreviewUrl(url)
            setPreviewName(file.name)
        } catch (e) {
            console.error('No se pudo abrir vista previa del PDF', e)
            showToastMessage('No se pudo abrir la vista previa', 'error')
        }
    }

    const openPreviewFromUrl = (url: string, name?: string) => {
        // Si es una URL relativa del backend, construir la URL completa
        const fullUrl = url.startsWith('http')
            ? url
            : url.startsWith('/uploads')
                ? `${API_URL}${url}`
                : `${API_URL}/uploads/pdfs/${url}`
        setPreviewUrl(fullUrl)
        setPreviewName(name || 'Estudio PDF')
    }

    const closePreview = () => {
        if (previewUrl && previewUrl.startsWith('blob:')) {
            try { URL.revokeObjectURL(previewUrl) } catch { }
        }
        setPreviewUrl(null)
        setPreviewName(null)
    }

    const handleDeleteAttachment = async (attachmentId: number) => {
        if (!confirm('¿Estás seguro de que deseas eliminar este archivo?')) return;

        const studyId = estudioExistente?.backendId || estudioExistente?.id;
        if (!studyId) {
            showToastMessage('Error: No se pudo identificar el estudio', 'error');
            return;
        }

        try {
            showToastMessage('Eliminando archivo...', 'info');
            const response = await authFetch(
                `${API_URL}/api/studies/${studyId}/attachments/${attachmentId}`,
                { method: 'DELETE' }
            );

            if (!response.ok) {
                throw new Error('Error al eliminar el archivo');
            }

            showToastMessage('Archivo eliminado exitosamente', 'success');

            // Recargar la página o actualizar el estado
            if (onSuccess) {
                onSuccess();
            } else {
                window.location.reload();
            }
        } catch (e: any) {
            console.error('Error al eliminar attachment:', e);
            showToastMessage(e.message || 'Error al eliminar archivo', 'error');
        }
    }

    const showToastMessage = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
        setToastMessage(message)
        setToastType(type)
        setShowToast(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        console.log('🔵 ENVIANDO FORMULARIO - Valores actuales:')
        console.log('Estado:', estado)
        console.log('Fecha Estudio:', fechaEstudio)
        console.log('Obra Social:', obraSocial)
        console.log('Médico:', medico)
        console.log('DNI:', dni)
        console.log('Nombre:', nombreApellido)

        try {
            // Validaciones básicas siempre requeridas
            if (!nombreApellido.trim() || !dni.trim()) {
                showToastMessage('Complete DNI y Nombre del paciente', 'error')
                setIsSubmitting(false)
                return
            }

            // Validaciones según estado
            if (estado !== 'en_proceso') {
                // Para parcial y completado, requiere todos los campos
                if (!fechaEstudio || !obraSocial.trim() || !medico.trim()) {
                    showToastMessage('Complete todos los campos requeridos (Fecha, Obra Social y Médico)', 'error')
                    setIsSubmitting(false)
                    return
                }
            }

            // Si es nuevo y el estado es "completado", requiere PDF obligatorio
            if (!modoEdicion && estado === 'completado' && pdfs.length === 0) {
                showToastMessage('Debe cargar al menos un PDF para estudios completados', 'error')
                setIsSubmitting(false)
                return
            }

            // Si se está cambiando de estado desde "en_proceso" a parcial/completado, requiere PDF
            if (modoEdicion && permitirCambioEstado && estado !== 'en_proceso' && pdfs.length === 0 && (!estudioExistente?.attachments || estudioExistente.attachments.length === 0)) {
                showToastMessage('Debe cargar al menos un PDF al cambiar de estado', 'error')
                setIsSubmitting(false)
                return
            }

            // Crear ID único
            const studyId = estudioExistente?.id || `estudio_${Date.now()}_${Math.floor(Math.random() * 10000)}`

            // Guardar PDFs en IndexedDB si existen
            for (const pdf of pdfs) {
                const pdfId = `${studyId}_${Date.now()}_${Math.random()}`
                await savePdf(pdfId, pdf)
            }

            // Preparar datos del estudio
            const estudioData = {
                id: studyId,
                nombreApellido,
                dni,
                fechaEstudio: fechaEstudio || todayLocal(), // Asegurar que siempre haya fecha
                obraSocial,
                medico,
                estado,
                status: estado, // Para compatibilidad con backend
                pdfs: pdfs.map(f => f.name),
                tipoEstudio: 'general',
            }

            // Guardar en localStorage
            try {
                const raw = localStorage.getItem('estudios_metadata')
                const metas = raw ? JSON.parse(raw) : []

                if (modoEdicion && estudioExistente) {
                    // Actualizar estudio existente
                    const index = metas.findIndex((m: any) => m.id === estudioExistente.id)
                    if (index >= 0) {
                        metas[index] = { ...metas[index], ...estudioData }
                    }
                } else {
                    // Crear nuevo estudio
                    metas.push(estudioData)
                }

                localStorage.setItem('estudios_metadata', JSON.stringify(metas))

                // Disparar evento para que otros componentes se actualicen
                window.dispatchEvent(new Event('storage'))
            } catch (error) {
                console.error('Error guardando en localStorage:', error)
            }

            // Guardar en el backend
            try {
                // Helper para mapear estado local a backend
                const mapEstadoToStatusName = (est: EstadoEstudio): string | null => {
                    if (est === 'completado') return 'COMPLETED'
                    if (est === 'parcial') return 'PARTIAL'
                    return 'IN_PROGRESS'
                }

                // Paso 1: Verificar/Crear paciente (solo cuando se crea un nuevo estudio)
                let pacienteId = null

                if (!modoEdicion) {
                    // Buscar si el paciente ya existe
                    const buscarResponse = await authFetch(`${API_URL}/api/studies/patient/${dni}`)

                    if (buscarResponse.ok) {
                        const pacienteData = await buscarResponse.json()
                        pacienteId = pacienteData.data?.id
                        console.log('Paciente encontrado:', pacienteData.data)
                    } else if (buscarResponse.status === 404) {
                        // El paciente no existe, crearlo
                        console.log('Paciente no encontrado, creando nuevo...')

                        const [nombre, ...apellidos] = nombreApellido.split(' ')
                        const apellido = apellidos.join(' ') || nombre

                        const crearPacienteResponse = await authFetch(`${API_URL}/api/auth/register-patient`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                dni,
                                firstName: nombre,
                                lastName: apellido,
                                birthDate: new Date().toISOString().split('T')[0] // Fecha por defecto
                            })
                        })

                        if (crearPacienteResponse.ok) {
                            const nuevoPaciente = await crearPacienteResponse.json()
                            pacienteId = nuevoPaciente.data?.user?.id
                            console.log('Paciente creado:', nuevoPaciente.data)
                        } else {
                            const errorData = await crearPacienteResponse.json()
                            throw new Error(`No se pudo crear el paciente: ${errorData.message}`)
                        }
                    } else {
                        throw new Error('Error al buscar paciente')
                    }
                }

                // Paso 2: Crear o actualizar estudio
                if (!modoEdicion) {
                    // Validaciones fuertes según estado
                    if (estado !== 'en_proceso') {
                        if (!fechaEstudio) throw new Error('La fecha del estudio es obligatoria en Parcial/Completo')
                        if (!medico) throw new Error('El médico es obligatorio en Parcial/Completo')
                        if (!obraSocial) throw new Error('La obra social es obligatoria en Parcial/Completo')
                    }

                    // Crear el estudio
                    const formData = new FormData()

                    // Campos requeridos por el backend
                    formData.append('dni', dni)
                    formData.append('studyName', nombreApellido)
                    // Usar la fecha del formulario o fecha actual si está vacía
                    const fechaFinal = fechaEstudio || todayLocal()
                    console.log('📅 Guardando estudio con fecha:', fechaFinal, 'Estado:', estado)
                    formData.append('studyDate', fechaFinal)

                    // Campos opcionales - Enviar siempre, incluso en "en_proceso"
                    // Si están vacíos, se enviarán como strings vacíos y el backend los convertirá a null
                    if (obraSocial) {
                        formData.append('socialInsurance', obraSocial)
                    }
                    if (medico) {
                        formData.append('doctor', medico)
                    }

                    // Agregar PDFs si existen (múltiples)
                    if (pdfs.length > 0) {
                        pdfs.forEach((file) => {
                            formData.append('pdfs', file)
                        })
                    }

                    console.log('Creando estudio para paciente:', pacienteId)
                    console.log('FormData entries:');
                    for (let pair of formData.entries()) {
                        console.log(pair[0] + ':', pair[1]);
                    }

                    const response = await authFetch(`${API_URL}/api/studies`, {
                        method: 'POST',
                        body: formData,
                    })

                    console.log('Response status:', response.status, response.statusText)

                    if (response.ok) {
                        const result = await response.json()
                        console.log('Respuesta completa del backend:', result)
                        console.log('result?.data:', result?.data)
                        showToastMessage('Estudio guardado en la base de datos exitosamente', 'success')

                        // Actualizar estado si corresponde
                        const createdId = result?.data?.id ?? result?.id

                        // Guardar el id del backend en localStorage para futuras ediciones
                        try {
                            const rawMeta = localStorage.getItem('estudios_metadata')
                            const metas = rawMeta ? JSON.parse(rawMeta) : []
                            const idx = metas.findIndex((m: any) => m.id === studyId)
                            if (idx >= 0 && createdId) {
                                // Actualizar con los datos que devuelve el backend
                                // Intentar acceder a data en diferentes estructuras
                                const backendData = result?.data || result || {};
                                console.log('📤 Datos devueltos por backend:', backendData);
                                console.log('📤 doctor field:', backendData.doctor);
                                metas[idx].backendId = createdId
                                metas[idx].serverId = createdId
                                // Actualizar los campos que devuelve el backend
                                if (backendData.studyDate) {
                                    metas[idx].fechaEstudio = backendData.studyDate
                                    console.log('✅ Actualizando fechaEstudio:', backendData.studyDate)
                                }
                                if (backendData.doctor) {
                                    metas[idx].medico = backendData.doctor
                                    console.log('✅ Actualizando medico:', backendData.doctor)
                                    setMedico(backendData.doctor) // Actualizar estado del componente
                                }
                                if (backendData.socialInsurance) {
                                    metas[idx].obraSocial = backendData.socialInsurance
                                    console.log('✅ Actualizando obraSocial:', backendData.socialInsurance)
                                }
                                localStorage.setItem('estudios_metadata', JSON.stringify(metas))
                                console.log('💾 localStorage actualizado con datos del backend')
                            }
                        } catch (e) {
                            console.warn('No se pudo actualizar backendId en metadata local', e)
                        }
                        const statusName = mapEstadoToStatusName(estado)
                        if (createdId && statusName) {
                            try {
                                const respStatus = await authFetch(`${API_URL}/api/studies/${createdId}/status`, {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ statusName }),
                                })
                                const statusData = await respStatus.json()
                                if (!respStatus.ok) {
                                    console.warn('No se pudo actualizar el estado:', statusData?.message)
                                } else {
                                    console.log('Estado actualizado:', statusData?.data)
                                }
                            } catch (e) {
                                console.warn('Error actualizando estado del estudio:', e)
                            }
                        }
                    } else {
                        let errorMessage = 'Error desconocido'
                        try {
                            const errorData = await response.json()
                            console.error('Error del backend:', { status: response.status, statusText: response.statusText, data: errorData })
                            errorMessage = errorData.message || errorData.error || JSON.stringify(errorData)
                        } catch (parseError) {
                            console.error('No se pudo parsear respuesta de error:', parseError)
                            const textError = await response.text()
                            console.error('Respuesta como texto:', textError)
                            errorMessage = textError || `Error ${response.status}: ${response.statusText}`
                        }
                        showToastMessage(`Guardado localmente. Backend: ${errorMessage}`, 'info')
                    }
                } else if (modoEdicion && estudioExistente?.id) {
                    // Modo edición: actualizar estado, obra social y médico
                    const statusName = mapEstadoToStatusName(estado)

                    // Validaciones fuertes según estado
                    if (estado !== 'en_proceso') {
                        if (!fechaEstudio) throw new Error('La fecha del estudio es obligatoria en Parcial/Completo')
                        if (!medico) throw new Error('El médico es obligatorio en Parcial/Completo')
                        if (!obraSocial) throw new Error('La obra social es obligatoria en Parcial/Completo')
                    }

                    // Actualizar campos de estudio (obra social, médico, fecha)
                    const updatePayload: any = {}
                    // Agregar campos si cambiaron o si están vacíos en el existente y ahora tienen valor
                    if (obraSocial !== estudioExistente.obraSocial || (!estudioExistente.obraSocial && obraSocial)) {
                        updatePayload.socialInsurance = obraSocial
                    }
                    if (medico !== estudioExistente.medico || (!estudioExistente.medico && medico)) {
                        updatePayload.doctor = medico
                    }
                    if (fechaEstudio !== estudioExistente.fechaEstudio) {
                        updatePayload.studyDate = fechaEstudio
                    }

                    const targetId = estudioExistente.backendId || estudioExistente.id

                    // Actualizar estado si corresponde
                    if (permitirCambioEstado && statusName) {
                        try {
                            const respStatus = await authFetch(`${API_URL}/api/studies/${targetId}/status`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ statusName }),
                            })
                            const statusData = await respStatus.json()
                            if (!respStatus.ok) {
                                console.warn('No se pudo actualizar el estado:', statusData?.message)
                                showToastMessage(`No se pudo cambiar el estado: ${statusData?.message || 'Error'}`, 'info')
                            } else {
                                console.log('Estado actualizado:', statusData?.data)
                            }
                        } catch (e) {
                            console.warn('Error actualizando estado:', e)
                        }
                    }

                    // Actualizar campos básicos si hay cambios
                    if (Object.keys(updatePayload).length > 0) {
                        try {
                            console.log('📝 Actualizando campos del estudio:', updatePayload)
                            const respUpdate = await authFetch(`${API_URL}/api/studies/${targetId}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(updatePayload),
                            })
                            const updateData = await respUpdate.json()
                            if (!respUpdate.ok) {
                                console.warn('No se pudo actualizar el estudio:', updateData?.message)
                                showToastMessage(`No se actualizaron los campos: ${updateData?.message || 'Error'}`, 'info')
                            } else {
                                console.log('✅ Estudio actualizado:', updateData?.data)
                            }
                        } catch (e) {
                            console.warn('Error actualizando estudio:', e)
                        }
                    }

                    // Subir PDFs nuevos en modo edición si se agregaron
                    if (pdfs.length > 0) {
                        const fd = new FormData()
                        pdfs.forEach((file) => fd.append('pdfs', file))

                        try {
                            const respPdf = await authFetch(`${API_URL}/api/studies/${targetId}/pdf`, {
                                method: 'PATCH',
                                body: fd,
                            })
                            const dataPdf = await respPdf.json()
                            if (!respPdf.ok) {
                                console.warn('No se pudo subir el PDF:', dataPdf?.message)
                                showToastMessage(`PDF localmente guardado. Backend: ${dataPdf?.message || 'Error'}`, 'info')
                            } else {
                                console.log('PDF actualizado:', dataPdf?.data)
                                showToastMessage('PDF actualizado en la base de datos', 'success')
                            }
                        } catch (e) {
                            console.warn('Error subiendo PDF:', e)
                        }
                    }
                }
            } catch (error: any) {
                console.error('Error con el backend:', error)
                showToastMessage(`Guardado localmente. Error: ${error.message || 'Backend no disponible'}`, 'info')
            }

            showToastMessage(
                modoEdicion ? 'Estudio actualizado exitosamente' : 'Estudio guardado exitosamente',
                'success'
            )

            if (onSuccess) {
                onSuccess()
            } else {
                setTimeout(() => router.push('/dashboard'), 1500)
            }
        } catch (error) {
            console.error('Error al guardar estudio:', error)
            showToastMessage('Error al guardar el estudio', 'error')
        } finally {
            setIsSubmitting(false)
        }
    }

    const mostrarPdf = estado === 'completado' || estado === 'parcial'
    const camposDeshabilitados = modoEdicion && !permitirCambioEstado

    const getEstadoBadgeClass = (est: EstadoEstudio) => {
        switch (est) {
            case 'completado':
                return badgeCompletado
            case 'parcial':
                return badgeParcial
            case 'en_proceso':
                return badgeEnProceso
            default:
                return badgeParcial
        }
    }

    return (
        <>
            <div className="max-w-4xl mx-auto mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Cargar Nuevo Estudio</h1>
                <p className="text-gray-600">Completa el formulario para registrar un nuevo estudio</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto">
                {/* Toast */}
                {showToast && (
                    <Toast
                        message={toastMessage}
                        onClose={() => setShowToast(false)}
                        type={toastType}
                    />
                )}

                {/* Información del Paciente */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-1">Información del Paciente</h2>
                    <p className="text-sm text-gray-600 mb-4">
                        {modoEdicion
                            ? permitirCambioEstado
                                ? 'Puedes cambiar el estado del estudio y agregar PDFs'
                                : 'Datos del paciente (solo lectura)'
                            : estado === 'en_proceso'
                                ? 'Completa los datos del paciente (sin PDFs). Luego podrás cambiar el estado y agregar archivos.'
                                : 'Completa los datos del paciente y selecciona el estado'}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Selector de Estado */}
                        {(!modoEdicion || permitirCambioEstado) && (
                            <div className="md:col-span-2">
                                <label htmlFor="estado" className="block text-sm font-medium text-gray-700 mb-2">
                                    Estado del Estudio
                                </label>
                                <select
                                    id="estado"
                                    value={estado}
                                    onChange={(e) => setEstado(e.target.value as EstadoEstudio)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    {!modoEdicion && (
                                        <>
                                            <option value="en_proceso">En Proceso - Solo cargar datos del paciente (sin PDF)</option>
                                            <option value="parcial">Parcial - Agregar algunos PDFs</option>
                                            <option value="completado">Completado - Todos los PDFs cargados</option>
                                        </>
                                    )}
                                    {permitirCambioEstado && (
                                        <>
                                            <option value="parcial">Parcial - Agregar algunos PDFs</option>
                                            <option value="completado">Completado - Todos los PDFs cargados</option>
                                        </>
                                    )}
                                </select>
                                {permitirCambioEstado && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        Estado actual: {estudioExistente?.estado?.replace(/_/g, ' ')}. Selecciona un nuevo estado para cambiar.
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Estado actual en modo edición sin permiso de cambio */}
                        {modoEdicion && !permitirCambioEstado && estudioExistente && (
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Estado del Estudio
                                </label>
                                <div className={`inline-block px-4 py-2 rounded-lg ${getEstadoBadgeClass(estudioExistente.estado || 'en_proceso')}`}>
                                    <span className="font-medium capitalize">
                                        {estudioExistente.estado?.replace(/_/g, ' ')}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Nombre y Apellido */}
                        <div>
                            <label htmlFor="nombreApellido" className="block text-sm font-medium text-gray-700 mb-2">
                                Nombre y Apellido
                            </label>
                            <input
                                id="nombreApellido"
                                type="text"
                                placeholder="Juan Pérez"
                                value={nombreApellido}
                                onChange={(e) => setNombreApellido(e.target.value)}
                                disabled={camposDeshabilitados || pacienteEncontrado}
                                required
                                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${camposDeshabilitados || pacienteEncontrado ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
                                    } text-gray-900`}
                            />
                        </div>

                        {/* DNI */}
                        <div>
                            <label htmlFor="dni" className="block text-sm font-medium text-gray-700 mb-2">
                                DNI
                            </label>
                            <input
                                id="dni"
                                type="text"
                                placeholder="12345678"
                                value={dni}
                                onChange={(e) => setDni(e.target.value)}
                                disabled={camposDeshabilitados}
                                required
                                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${camposDeshabilitados ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
                                    } text-gray-900`}
                            />
                            {pacienteEncontrado && (
                                <p className="text-xs text-green-600 mt-1">✓ Paciente encontrado</p>
                            )}
                            {!pacienteEncontrado && dni.length >= 7 && !modoEdicion && (
                                <p className="text-xs text-amber-700 mt-1">⚠ Paciente no encontrado en el sistema - Realice la carga completando los datos</p>
                            )}
                        </div>

                        {/* Fecha del Estudio */}
                        <div>
                            <label htmlFor="fechaEstudio" className="block text-sm font-medium text-gray-700 mb-2">
                                Fecha del Estudio
                            </label>
                            <input
                                id="fechaEstudio"
                                type="date"
                                value={fechaEstudio}
                                onChange={(e) => {
                                    console.log('📅 Fecha cambiada a:', e.target.value)
                                    setFechaEstudio(e.target.value)
                                }}
                                disabled={camposDeshabilitados}
                                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${camposDeshabilitados ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
                                    } text-gray-900`}
                            />
                        </div>

                        {/* Obra Social */}
                        <div>
                            <label htmlFor="obraSocial" className="block text-sm font-medium text-gray-700 mb-2">
                                Obra Social
                            </label>
                            <input
                                id="obraSocial"
                                type="text"
                                placeholder="OSDE, Swiss Medical, etc."
                                value={obraSocial}
                                onChange={(e) => {
                                    console.log('🏥 Obra Social cambiada a:', e.target.value)
                                    setObraSocial(e.target.value)
                                }}
                                disabled={camposDeshabilitados}
                                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${camposDeshabilitados ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
                                    } text-gray-900`}
                            />
                        </div>

                        {/* Médico */}
                        <div className="md:col-span-2">
                            <label htmlFor="medico" className="block text-sm font-medium text-gray-700 mb-2">
                                Médico
                            </label>
                            <input
                                id="medico"
                                type="text"
                                placeholder="Dr. María García"
                                value={medico}
                                onChange={(e) => {
                                    console.log('👨‍⚕️ Médico cambiado a:', e.target.value)
                                    setMedico(e.target.value)
                                }}
                                disabled={camposDeshabilitados}
                                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${camposDeshabilitados ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
                                    } text-gray-900`}
                            />
                        </div>
                    </div>
                </div>

                {/* Carga de PDF - solo mostrar si NO es en_proceso O si está en modo edición */}
                {(estado !== 'en_proceso' || modoEdicion) && (
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-1">Documentos PDF</h2>
                        <p className="text-sm text-gray-600 mb-4">
                            {modoEdicion
                                ? 'Agrega más archivos PDF a este estudio'
                                : estado === 'parcial'
                                    ? 'Puedes agregar archivos ahora y más tarde'
                                    : 'Sube el archivo PDF del estudio'}
                        </p>

                        {/* PDFs existentes */}
                        {modoEdicion && estudioExistente?.attachments && estudioExistente.attachments.length > 0 && (
                            <div className="mb-4">
                                <p className="text-sm font-medium text-gray-700 mb-2">Archivos cargados anteriormente:</p>
                                <div className="flex flex-wrap gap-2">
                                    {estudioExistente.attachments.map((attachment) => (
                                        <div
                                            key={attachment.id}
                                            className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg text-sm"
                                        >
                                            <FileText className="w-4 h-4 text-gray-600" />
                                            <span className="truncate max-w-[200px]">{attachment.filename || attachment.url}</span>
                                            <button
                                                type="button"
                                                onClick={() => openPreviewFromUrl(attachment.url, attachment.filename)}
                                                className="ml-2 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                                            >
                                                Ver
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteAttachment(attachment.id)}
                                                className="ml-1 p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                                                title="Eliminar archivo"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Zona de carga */}
                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={`relative mb-4 border-2 border-dashed rounded-xl p-8 text-center transition-colors ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                                }`}
                        >
                            <input
                                type="file"
                                accept=".pdf"
                                multiple
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                id="pdf-upload"
                            />
                            <Upload className="w-10 h-10 mx-auto text-gray-400 mb-3" />
                            <p className="text-sm font-medium text-gray-900">
                                Arrastra archivos PDF aquí o haz clic para seleccionar
                            </p>
                            <p className="text-xs text-gray-600 mt-1">Solo archivos PDF</p>
                        </div>

                        {/* Lista de nuevos PDFs */}
                        {pdfs.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-gray-900">Nuevos archivos seleccionados:</p>
                                <div className="space-y-2">
                                    {pdfs.map((file, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg"
                                        >
                                            <div className="flex items-center gap-2 min-w-0">
                                                <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                                                <span className="text-sm truncate text-gray-900">{file.name}</span>
                                                <span className="text-xs text-gray-600 shrink-0">
                                                    ({(file.size / 1024).toFixed(1)} KB)
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeFile(index)}
                                                className="ml-2 p-1 hover:bg-blue-100 rounded shrink-0"
                                            >
                                                <X className="w-4 h-4 text-gray-600" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => openPreviewFromFile(file)}
                                                className="ml-2 p-1 hover:bg-blue-100 rounded shrink-0"
                                                title="Vista previa"
                                            >
                                                <Eye className="w-4 h-4 text-blue-600" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Botones de acción */}
                <div className="flex items-center justify-end gap-4 pb-4">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-4 py-2 text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Guardando...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                {modoEdicion ? 'Guardar Cambios' : estado === 'en_proceso' ? 'Guardar' : 'Continuar'}
                            </>
                        )}
                    </button>
                </div>
            </form>
            {/* Modal de vista previa PDF */}
            {previewUrl && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/60" onClick={closePreview} />
                    <div className="relative bg-white rounded-lg shadow-lg w-[92vw] max-w-[1100px] h-[85vh] overflow-hidden z-10">
                        <div className="flex items-center justify-between px-4 py-2 border-b">
                            <span className="font-medium text-gray-900 truncate">{previewName || 'Vista PDF'}</span>
                            <button onClick={closePreview} className="p-1 rounded hover:bg-gray-100">
                                <X className="w-5 h-5 text-gray-600" />
                            </button>
                        </div>
                        <iframe src={previewUrl} className="w-full h-[calc(85vh-44px)]" title="Vista PDF" />
                    </div>
                </div>
            )}
        </>
    )
}
