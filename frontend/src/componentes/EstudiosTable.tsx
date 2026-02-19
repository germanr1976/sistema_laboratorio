"use client"

import Link from 'next/link'
import { useEffect, useState } from 'react'
import authFetch from '../utils/authFetch'
import { FileText, Plus, Trash2, Edit2, Download, Ban } from 'lucide-react'
import Clock from './Clock'
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
    badgeAnulado,
} from '../utils/uiClasses'
import Toast from './Toast'
import { cancelStudy } from '../utils/studiesApi'

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"

interface Estudio {
    id: string | number
    nombreApellido: string
    dni: string
    fechaEstudio: string
    obraSocial: string
    medico: string
    pdfs?: string[]
    estado?: 'completado' | 'en_proceso' | 'parcial' | 'anulado'
    status?: 'completado' | 'en_proceso' | 'parcial' | 'anulado'
}

export function EstudiosTable() {
    const [estudios, setEstudios] = useState<Estudio[]>([])
    const [filtroEstado, setFiltroEstado] = useState<'todos' | 'completado' | 'en_proceso' | 'parcial' | 'anulado'>('todos')
    const [mostrarAnulados, setMostrarAnulados] = useState(false)
    const [busquedaDni, setBusquedaDni] = useState('')
    const [busquedaNombre, setBusquedaNombre] = useState('')
    const [fechaInicio, setFechaInicio] = useState('')
    const [fechaFin, setFechaFin] = useState('')
    const [paginaActual, setPaginaActual] = useState(1)
    const [estudiosPorPagina] = useState(10)
    const [loading, setLoading] = useState(true)
    const [showToast, setShowToast] = useState(false)
    const [toastMessage, setToastMessage] = useState('')
    const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info')
    const [showConfirmacion, setShowConfirmacion] = useState(false)
    const [estudioAAnular, setEstudioAAnular] = useState<string | number | null>(null)

    // Cargar estudios al montar el componente
    useEffect(() => {
        cargarEstudios()
    }, [])

    const cargarEstudios = async () => {
        setLoading(true)

        try {
            // Intentar cargar desde el backend primero
            const response = await authFetch(`${API_URL}/api/studies/biochemist/me`)

            if (response.ok) {
                const result = await response.json()
                const estudiosApi = (result.data || result.studies || []).map((study: any) => {
                    const nombrePaciente = study.patient?.profile
                        ? `${study.patient.profile.firstName || ''} ${study.patient.profile.lastName || ''}`.trim()
                        : (study.patient?.fullName || study.studyName || '')

                    // Obtener nombre del bioquímico (usar fullName del formatter o construir desde profile)
                    const nombreBioquimico = study.biochemist?.fullName
                        || (study.biochemist?.profile
                            ? `${study.biochemist.profile.firstName || ''} ${study.biochemist.profile.lastName || ''}`.trim()
                            : '')

                    // Normalizar PDFs: preferir attachments (array de objetos), luego campo pdfs (array de strings), luego pdfUrl
                    const pdfsFromAttachments = Array.isArray(study.attachments)
                        ? study.attachments.map((a: any) => a.url)
                        : []
                    const pdfsNormalized = pdfsFromAttachments.length > 0
                        ? pdfsFromAttachments
                        : (Array.isArray(study.pdfs) ? study.pdfs : (study.pdfUrl ? [study.pdfUrl] : []))

                    console.log(`Estudio ${study.id} - Bioquímico:`, {
                        fullName: study.biochemist?.fullName,
                        profile: study.biochemist?.profile,
                        nombreFinal: nombreBioquimico
                    })

                    // La fecha ya viene formateada como YYYY-MM-DD del backend, usarla tal cual
                    const formatearFechaParaTabla = (dateStr: string): string => {
                        if (!dateStr) return 'Sin fecha'
                        return dateStr
                    }

                    const estadoNormalizado = study.status?.name?.toLowerCase() === 'completed' ? 'completado'
                        : study.status?.name?.toLowerCase() === 'partial' ? 'parcial'
                            : study.status?.name?.toLowerCase() === 'cancelled' ? 'anulado'
                                : 'en_proceso'
                    // Mostrar el doctor si existe, sin importar el estado
                    const medicoFinal = study.doctor || ''
                    return {
                        id: study.id,
                        nombreApellido: nombrePaciente,
                        dni: study.patient?.dni || '',
                        fechaEstudio: study.studyDate ? formatearFechaParaTabla(study.studyDate) : 'Sin fecha',
                        obraSocial: study.socialInsurance || '',
                        medico: medicoFinal,
                        pdfs: pdfsNormalized,
                        estado: estadoNormalizado,
                        status: estadoNormalizado,
                    }
                })

                console.log('Estudios cargados desde backend:', estudiosApi)
                setEstudios(estudiosApi)

                // También guardar en localStorage para sincronización
                if (estudiosApi.length > 0) {
                    try {
                        localStorage.setItem('estudios_metadata', JSON.stringify(estudiosApi))
                    } catch (e) {
                        console.warn('No se pudo sincronizar con localStorage')
                    }
                }
            } else {
                console.warn('Backend no respondió correctamente, usando localStorage')
                cargarDelLocalStorage()
            }
        } catch (error) {
            console.warn('Backend no disponible, usando localStorage:', error)
            cargarDelLocalStorage()
        } finally {
            setLoading(false)
        }
    }

    const cargarDelLocalStorage = () => {
        try {
            const raw = localStorage.getItem('estudios_metadata')
            const metas = raw ? JSON.parse(raw) : []
            setEstudios(metas)
        } catch (error) {
            console.error('Error cargando del localStorage:', error)
            setEstudios([])
        }
    }

    const mostrarToast = (mensaje: string, tipo: 'success' | 'error' | 'info' = 'info') => {
        setToastMessage(mensaje)
        setToastType(tipo)
        setShowToast(true)
    }

    const anularEstudio = async (id: string | number) => {
        console.log('🔔 anularEstudio llamado con ID:', id, 'tipo:', typeof id)
        // Mostrar modal de confirmación personalizado
        setEstudioAAnular(id)
        setShowConfirmacion(true)
    }

    const confirmarAnulacion = async () => {
        if (!estudioAAnular) return

        try {
            mostrarToast('Anulando estudio...', 'info')

            // Usar directamente el ID del estudio que ya es el backendId
            const estudio = estudios.find((e: any) => e.id === estudioAAnular)

            if (!estudio) {
                console.error('❌ No se encontró el estudio con ID:', estudioAAnular)
                mostrarToast('No se encontró el estudio', 'error')
                setShowConfirmacion(false)
                setEstudioAAnular(null)
                return
            }

            console.log('🚀 Intentando anular estudio:', {
                estudioAAnular,
                estudioEncontrado: estudio,
                idParaAPI: estudio.id,
                tipoId: typeof estudio.id
            })

            // Convertir a número si es string
            const studyId = typeof estudio.id === 'string' ? parseInt(estudio.id) : estudio.id

            console.log('📡 Llamando a cancelStudy con ID:', studyId, 'tipo:', typeof studyId)

            const response = await cancelStudy(studyId)

            console.log('✅ Respuesta de cancelStudy:', response)

            if (response) {
                mostrarToast('Estudio anulado exitosamente', 'success')
                // Recargar estudios del backend
                await cargarEstudios()
            }
            setShowConfirmacion(false)
            setEstudioAAnular(null)
        } catch (error: any) {
            console.error('❌ Error anulando estudio:', error)
            console.error('❌ Stack:', error.stack)
            mostrarToast(error.message || 'Error al anular el estudio', 'error')
            setShowConfirmacion(false)
            setEstudioAAnular(null)
        }
    }

    const cancelarAnulacion = () => {
        setShowConfirmacion(false)
        setEstudioAAnular(null)
    }

    const getEstadoBadgeClass = (estado?: string) => {
        switch (estado?.toLowerCase()) {
            case 'completado':
                return badgeCompletado
            case 'en_proceso':
                return badgeEnProceso
            case 'parcial':
                return badgeParcial
            case 'anulado':
            case 'cancelled':
                return badgeAnulado
            default:
                return badgeParcial
        }
    }

    const getEstadoLabel = (estado?: string) => {
        switch (estado?.toLowerCase()) {
            case 'completado':
                return 'Completado'
            case 'en_proceso':
                return 'En Proceso'
            case 'parcial':
                return 'Parcial'
            case 'anulado':
            case 'cancelled':
                return 'Anulado'
            default:
                return 'Desconocido'
        }
    }

    const getEstadoIcon = (estado?: string) => {
        switch (estado?.toLowerCase()) {
            case 'completado':
                return (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                    </svg>
                )
            case 'en_proceso':
                return (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
                    </svg>
                )
            case 'parcial':
                return (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-8-6z" />
                    </svg>
                )
            case 'anulado':
            case 'cancelled':
                return (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
                    </svg>
                )
            default:
                return null
        }
    }

    const renderEstadoBadge = (estado?: string) => {
        return (
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-semibold text-white ${getEstadoBadgeClass(estado)}`}>
                {getEstadoIcon(estado)}
                <span>{getEstadoLabel(estado)}</span>
            </div>
        )
    }

    // Función para normalizar fechas al formato YYYY-MM-DD sin procesar zona horaria
    const normalizarFecha = (fecha: string): string => {
        if (!fecha) return ''

        // Si ya está en formato YYYY-MM-DD, devolverlo sin procesamiento
        if (/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
            return fecha
        }

        // Si está en formato DD/MM/YYYY o D/M/YYYY
        if (fecha.includes('/')) {
            const partes = fecha.split('/')
            if (partes.length === 3) {
                const dia = partes[0].padStart(2, '0')
                const mes = partes[1].padStart(2, '0')
                const año = partes[2]
                return `${año}-${mes}-${dia}`
            }
        }

        // Para fechas ISO, solo extraer la parte de fecha sin convertir
        if (fecha.includes('T')) {
            return fecha.split('T')[0]
        }

        return fecha
    }

    const estudiosFiltrados = (() => {
        const base = filtroEstado === 'todos'
            ? estudios
            : estudios.filter(e => (e.estado || e.status) === filtroEstado)

        if (filtroEstado === 'anulado') return base
        return mostrarAnulados ? base : base.filter(e => (e.estado || e.status) !== 'anulado')
    })()

    // Aplicar filtro adicional por DNI si hay búsqueda
    const estudiosConDni = busquedaDni.trim()
        ? estudiosFiltrados.filter(e => e.dni.includes(busquedaDni.trim()))
        : estudiosFiltrados

    // Aplicar filtro adicional por nombre si hay búsqueda
    const estudiosConNombre = busquedaNombre.trim()
        ? estudiosConDni.filter(e => e.nombreApellido.toLowerCase().includes(busquedaNombre.trim().toLowerCase()))
        : estudiosConDni

    // Aplicar filtro por rango de fechas
    const estudiosFinales = (fechaInicio || fechaFin)
        ? estudiosConNombre.filter(e => {
            const fechaEstudioNorm = normalizarFecha(e.fechaEstudio)
            const cumpleFechaInicio = !fechaInicio || fechaEstudioNorm >= fechaInicio
            const cumpleFechaFin = !fechaFin || fechaEstudioNorm <= fechaFin
            const incluir = cumpleFechaInicio && cumpleFechaFin
            if (!incluir) {
                console.log(`❌ EXCLUIDO: ${e.nombreApellido} - ${e.fechaEstudio} (normalizado: ${fechaEstudioNorm}) - Rango: ${fechaInicio} a ${fechaFin}`)
            }
            return incluir
        })
        : estudiosConNombre

    // Calcular paginación
    const totalPaginas = Math.ceil(estudiosFinales.length / estudiosPorPagina)
    const indiceInicio = (paginaActual - 1) * estudiosPorPagina
    const indiceFin = indiceInicio + estudiosPorPagina
    const estudiosPaginados = estudiosFinales.slice(indiceInicio, indiceFin)

    // Resetear a página 1 si los filtros hacen que la página actual sea inválida
    if (paginaActual > totalPaginas && totalPaginas > 0) {
        setPaginaActual(1)
    }

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center justify-center py-8">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                    <p className="text-center text-gray-600">Cargando estudios...</p>
                </div>
            </div>
        )
    }

    if (estudios.length === 0) {
        return (
            <div className="space-y-4">
                {showToast && (
                    <Toast
                        message={toastMessage}
                        onClose={() => setShowToast(false)}
                        type={toastType}
                    />
                )}
                <div className="bg-white rounded-lg border border-gray-200 border-dashed p-12">
                    <div className="flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                            <FileText className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">No hay estudios</h3>
                        <p className="text-sm text-gray-600 mb-6">
                            Comienza cargando tu primer estudio
                        </p>
                        <Link
                            href="/cargar-nuevo"
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors inline-flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Continuar
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {showToast && (
                <Toast
                    message={toastMessage}
                    onClose={() => setShowToast(false)}
                    type={toastType}
                />
            )}

            {/* Header y controles */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Estudios Cargados</h2>
                    <p className="text-base text-gray-600">Lista de todos los estudios del sistema</p>
                </div>
                <div className="flex items-center gap-4">
                    <Clock boxBg="bg-blue-50" boxBorder="border-blue-200" iconColor="text-blue-600" showDate={true} showIcon={true} />
                    <Link
                        href="/cargar-nuevo"
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors inline-flex items-center gap-2 text-base"
                    >
                        <Plus className="w-5 h-5" />
                        Nuevo Estudio
                    </Link>
                </div>
            </div>

            {/* Filtros */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="space-y-4">
                    {/* Primera fila: Estado + Nombre del paciente + DNI */}
                    <div className="flex items-center gap-4 flex-wrap">
                        <label className="text-base font-semibold text-gray-700">Filtrar por estado:</label>
                        <select
                            value={filtroEstado}
                            onChange={(e) => setFiltroEstado(e.target.value as any)}
                            className="px-3.5 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="todos">Todos ({estudios.length})</option>
                            <option value="completado">Completados ({estudios.filter(e => (e.estado || e.status) === 'completado').length})</option>
                            <option value="en_proceso">En Proceso ({estudios.filter(e => (e.estado || e.status) === 'en_proceso').length})</option>
                            <option value="parcial">Parciales ({estudios.filter(e => (e.estado || e.status) === 'parcial').length})</option>
                            <option value="anulado">Anulados ({estudios.filter(e => (e.estado || e.status) === 'anulado').length})</option>
                        </select>

                        <label className="inline-flex items-center gap-2 text-base font-semibold text-gray-700">
                            <input
                                type="checkbox"
                                checked={mostrarAnulados}
                                onChange={(e) => setMostrarAnulados(e.target.checked)}
                                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            Mostrar anulados
                        </label>

                        <label className="text-base font-semibold text-gray-700">Buscar paciente:</label>
                        <input
                            type="text"
                            value={busquedaNombre}
                            onChange={(e) => setBusquedaNombre(e.target.value)}
                            placeholder="Por nombre o apellido"
                            className="px-3.5 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-50"
                        />
                        {busquedaNombre && (
                            <button
                                onClick={() => setBusquedaNombre('')}
                                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Limpiar
                            </button>
                        )}

                        <label className="text-base font-semibold text-gray-700">Buscar por DNI:</label>
                        <input
                            type="text"
                            value={busquedaDni}
                            onChange={(e) => setBusquedaDni(e.target.value)}
                            placeholder="Ingrese DNI del paciente"
                            className="px-3.5 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-50"
                        />
                        {busquedaDni && (
                            <button
                                onClick={() => setBusquedaDni('')}
                                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Limpiar
                            </button>
                        )}
                    </div>

                    {/* Segunda fila: Rango de fechas */}
                    <div className="border-t border-gray-200 pt-4">
                        <div className="flex items-center gap-4 flex-wrap">
                            <label className="text-base font-semibold text-gray-700">Rango de fechas:</label>
                            <input
                                type="date"
                                value={fechaInicio}
                                onChange={(e) => setFechaInicio(e.target.value)}
                                className="px-3.5 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Desde"
                            />
                            <span className="text-gray-700 font-medium">hasta</span>
                            <input
                                type="date"
                                value={fechaFin}
                                onChange={(e) => setFechaFin(e.target.value)}
                                className="px-3.5 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Hasta"
                                min={fechaInicio}
                            />

                            {(fechaInicio || fechaFin) && (
                                <button
                                    onClick={() => {
                                        setFechaInicio('')
                                        setFechaFin('')
                                    }}
                                    className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Limpiar fechas
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabla de estudios - Desktop */}
            <div className="hidden lg:block bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-base">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left font-semibold text-gray-900 text-lg">Estado</th>
                                <th className="px-6 py-3 text-left font-semibold text-gray-900 text-lg">Paciente</th>
                                <th className="px-6 py-3 text-left font-semibold text-gray-900 text-lg">DNI</th>
                                <th className="px-6 py-3 text-left font-semibold text-gray-900 text-lg">Fecha</th>
                                <th className="px-6 py-3 text-left font-semibold text-gray-900 text-lg">Obra Social</th>
                                <th className="px-6 py-3 text-left font-semibold text-gray-900 text-lg">Médico</th>
                                <th className="px-6 py-3 text-left font-semibold text-gray-900 text-lg">PDFs</th>
                                <th className="px-6 py-3 text-right font-semibold text-gray-900 text-lg">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {estudiosPaginados.map((estudio) => (
                                <tr key={estudio.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        {renderEstadoBadge(estudio.estado || estudio.status)}
                                    </td>
                                    <td className="px-6 py-4 font-semibold text-gray-900">{estudio.nombreApellido}</td>
                                    <td className="px-6 py-4 text-gray-800">{estudio.dni}</td>
                                    <td className="px-6 py-4 text-gray-800">
                                        {estudio.fechaEstudio ? estudio.fechaEstudio : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-gray-800">{estudio.obraSocial || '-'}</td>
                                    <td className="px-6 py-4 text-gray-800">{estudio.medico || '-'}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1 text-gray-800">
                                            <FileText className="w-5 h-5 text-gray-500" />
                                            <span>{estudio.pdfs?.length || 0}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {((estudio.estado || estudio.status) === 'parcial' || (estudio.estado || estudio.status) === 'en_proceso') && (
                                                <>
                                                    <Link
                                                        href={`/cargar-nuevo?id=${estudio.id}`}
                                                        className="px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-900 font-semibold text-sm rounded transition-colors inline-flex items-center gap-1"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                        Cambiar Estado
                                                    </Link>
                                                    {(estudio.estado || estudio.status) === 'en_proceso' && (
                                                        <button
                                                            onClick={() => anularEstudio(estudio.id)}
                                                            className="p-2.5 text-orange-600 hover:bg-orange-50 rounded transition-colors"
                                                            title="Anular estudio"
                                                        >
                                                            <Ban className="w-5 h-5" />
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {/* Controles de paginación - Desktop */}
                {totalPaginas > 1 && (
                    <div className="flex items-center justify-between gap-4 p-4 border-t border-gray-200 bg-gray-50">
                        <div className="text-sm font-medium text-gray-700">
                            Mostrando {indiceInicio + 1} - {Math.min(indiceFin, estudiosFinales.length)} de {estudiosFinales.length} estudios
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPaginaActual(Math.max(1, paginaActual - 1))}
                                disabled={paginaActual === 1}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                ← Anterior
                            </button>
                            <div className="flex items-center gap-1">
                                {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((pagina) => (
                                    <button
                                        key={pagina}
                                        onClick={() => setPaginaActual(pagina)}
                                        className={`px-3 py-2 rounded-lg font-medium transition-colors ${paginaActual === pagina
                                            ? 'bg-blue-600 text-white'
                                            : 'border border-gray-300 text-gray-700 hover:bg-gray-100'
                                            }`}
                                    >
                                        {pagina}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => setPaginaActual(Math.min(totalPaginas, paginaActual + 1))}
                                disabled={paginaActual === totalPaginas}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Siguiente →
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Tarjetas de estudios - Mobile */}
            <div className="lg:hidden space-y-3">
                {estudiosPaginados.map((estudio) => (
                    <div key={estudio.id} className="bg-white rounded-lg border border-gray-200 p-4">
                        <div className="space-y-3">
                            {/* Estado y acciones */}
                            <div className="flex items-start justify-between gap-3">
                                {renderEstadoBadge(estudio.estado || estudio.status)}
                                <div className="flex items-center gap-2">
                                    {((estudio.estado || estudio.status) === 'parcial' || (estudio.estado || estudio.status) === 'en_proceso') && (
                                        <>
                                            <Link
                                                href={`/cargar-nuevo?id=${estudio.id}`}
                                                className="p-2 text-amber-600 hover:bg-amber-50 rounded transition-colors"
                                                title="Cambiar estado"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </Link>
                                            {(estudio.estado || estudio.status) === 'en_proceso' && (
                                                <button
                                                    onClick={() => anularEstudio(estudio.id)}
                                                    className="p-2 text-orange-600 hover:bg-orange-50 rounded transition-colors"
                                                    title="Anular estudio"
                                                >
                                                    <Ban className="w-4 h-4" />
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Datos principales */}
                            <div>
                                <p className="font-bold text-gray-900">{estudio.nombreApellido}</p>
                                <p className="text-base text-gray-600">DNI: {estudio.dni}</p>
                            </div>

                            {/* Detalles */}
                            <div className="space-y-1 text-base text-gray-600">
                                <p>📅 {estudio.fechaEstudio ? estudio.fechaEstudio : '-'}</p>
                                <p>🏥 {estudio.obraSocial || '-'}</p>
                                <p>👨‍⚕️ {estudio.medico || '-'}</p>
                                <p className="flex items-center gap-1">
                                    <FileText className="w-5 h-5" /> {estudio.pdfs?.length || 0} PDF(s)
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
                {/* Controles de paginación - Mobile */}
                {totalPaginas > 1 && (
                    <div className="bg-white rounded-lg border border-gray-200 p-4 mt-4">
                        <div className="flex flex-col items-center gap-3">
                            <div className="text-sm font-medium text-gray-700">
                                Página {paginaActual} de {totalPaginas}
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setPaginaActual(Math.max(1, paginaActual - 1))}
                                    disabled={paginaActual === 1}
                                    className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                                >
                                    ← Anterior
                                </button>
                                <button
                                    onClick={() => setPaginaActual(Math.min(totalPaginas, paginaActual + 1))}
                                    disabled={paginaActual === totalPaginas}
                                    className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                                >
                                    Siguiente →
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Mensaje si no hay estudios filtrados */}
            {
                estudiosFinales.length === 0 && (
                    <div className="bg-white rounded-lg border border-gray-200 border-dashed p-8 text-center">
                        <p className="text-gray-600 text-base">
                            {busquedaDni.trim()
                                ? `No se encontraron estudios para el DNI "${busquedaDni}"`
                                : fechaInicio || fechaFin
                                    ? `No hay estudios en el rango de fechas seleccionado (${fechaInicio || 'inicio'} - ${fechaFin || 'fin'})`
                                    : `No hay estudios con estado "${getEstadoLabel(filtroEstado)}"`
                            }
                        </p>
                    </div>
                )
            }

            {/* Modal de confirmación para anular estudio */}
            {showConfirmacion && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="shrink-0">
                                <svg className="h-6 w-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0 4v2M6.343 3.665c1.519-1.159 3.7-1.159 5.219 0l8.485 6.479c1.519 1.16 1.519 3.04 0 4.199l-8.485 6.479c-1.519 1.159-3.7 1.159-5.219 0l-8.485-6.479c-1.519-1.16-1.519-3.04 0-4.199L6.343 3.665z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">¿Anular este estudio?</h3>
                        </div>

                        <p className="text-gray-600 mb-6">
                            ¿Estás seguro de que deseas anular este estudio? Esta acción no se puede deshacer.
                        </p>

                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={cancelarAnulacion}
                                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmarAnulacion}
                                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium transition-colors"
                            >
                                Sí, Anular
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div >
    )
}
