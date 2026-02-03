export interface Study {
    id: number
    userId: number
    studyName: string
    studyDate?: string | Date | null
    socialInsurance?: string
    pdfUrl?: string
    status?: {
        id?: number
        name: 'IN_PROGRESS' | 'PARTIAL' | 'COMPLETED'
    }
    // Relación usada por algunas vistas antiguas
    user?: {
        id?: number
        dni?: string
        profile?: {
            firstName?: string
            lastName?: string
            documentNumber?: string
        }
    }
    // Relaciones reales devueltas por el backend
    patient?: {
        id?: number
        dni?: string
        profile?: {
            firstName?: string
            lastName?: string
            documentNumber?: string
        }
    }
    biochemist?: {
        id?: number
        profile?: {
            firstName?: string
            lastName?: string
        }
    } | null
}

export interface StudyResponse {
    studies: Study[]
    pagination?: {
        page: number
        limit: number
        total: number
        pages: number
        hasMore?: boolean
    }
}
