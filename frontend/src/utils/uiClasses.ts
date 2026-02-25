// Clases de utilidad compartidas para tarjetas y botones de la UI
export const cardClasses = 'p-4 border rounded-lg bg-white shadow-sm flex items-center justify-between'
export const leftColClasses = 'flex-1 min-w-0'
export const nameClasses = 'font-bold text-gray-900 truncate'
export const metaClasses = 'flex flex-wrap text-sm text-gray-600 gap-3'
export const rightActionsClasses = 'flex items-center gap-2 flex-none'
export const btnPrimary = 'px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded whitespace-nowrap'
export const btnPdf = 'bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded font-semibold whitespace-nowrap'
export const btnNoFile = 'px-4 py-2 rounded border text-sm text-gray-500 whitespace-nowrap'
export const iconBtn = 'p-2 rounded border text-gray-500 hover:bg-gray-100'
export const badgeBase = 'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap'
export const badgeCompletado = `${badgeBase} bg-green-100 text-green-800 border-green-200`
export const badgeParcial = `${badgeBase} bg-amber-100 text-amber-800 border-amber-200`
export const badgeEnProceso = `${badgeBase} bg-blue-100 text-blue-800 border-blue-200`
export const badgeAnulado = `${badgeBase} bg-red-100 text-red-800 border-red-200`

export const getStatusBadgeClass = (status?: string) => {
    switch ((status || '').toLowerCase()) {
        case 'completado':
        case 'completed':
            return badgeCompletado
        case 'parcial':
        case 'partial':
            return badgeParcial
        case 'en proceso':
        case 'en_proceso':
        case 'in_progress':
        case 'in-progress':
            return badgeEnProceso
        case 'anulado':
        case 'cancelled':
            return badgeAnulado
        default:
            return `${badgeBase} bg-gray-100 text-gray-800 border-gray-200`
    }
}

export default {
    cardClasses,
    leftColClasses,
    nameClasses,
    metaClasses,
    rightActionsClasses,
    btnPrimary,
    btnPdf,
    btnNoFile,
    iconBtn,
    badgeCompletado,
    badgeParcial,
    badgeEnProceso,
    badgeAnulado,
    getStatusBadgeClass,
}
