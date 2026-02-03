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
export const badgeBase = 'flex items-center justify-center w-28 h-8 text-sm font-semibold rounded-full whitespace-nowrap'
export const badgeCompletado = `${badgeBase} bg-green-500 text-white`
export const badgeParcial = `${badgeBase} bg-yellow-500 text-white`
export const badgeEnProceso = `${badgeBase} bg-blue-500 text-white`
export const badgeAnulado = `${badgeBase} bg-gray-400 text-white`

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
}
