export interface Study {
  id: string
  patientName: string
  obraSocial: string
  date: string
  status: "Completado" | "Parcial" | "En Proceso"
  doctor: string
  pdfUrl?: string
  pdfs?: string[]
}
