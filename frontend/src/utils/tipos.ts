export interface Study {
  id: string
  patientName: string
  study: string
  date: string
  status: "Completado" | "Parcial" | "En Proceso"
  doctor: string
}
