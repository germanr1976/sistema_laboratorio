export interface Study {
  id: string
  patientName: string
  dni?: string
  study?: string
  obraSocial?: string
  date: string
  status: "Completado" | "Parcial" | "En Proceso" | "Anulado"
  doctor: string
  pdfUrl?: string
  pdfs?: string[]
}
