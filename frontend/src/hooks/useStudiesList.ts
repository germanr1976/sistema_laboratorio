import { useState, useEffect } from 'react'
import authFetch from '../utils/authFetch'
import type { Study, StudyResponse } from '../types/Study'

interface UseSudiesListOptions {
    page?: number
    limit?: number
    status?: 'IN_PROGRESS' | 'PARTIAL' | 'COMPLETED'
}

export function useStudiesList(options: UseSudiesListOptions = {}) {
    const {
        page = 1,
        limit = 10,
        status
    } = options

    const [studies, setStudies] = useState<Study[]>([])
    const [pagination, setPagination] = useState<StudyResponse['pagination'] | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const loadStudies = async () => {
            try {
                setLoading(true)
                setError(null)

                const params = new URLSearchParams({
                    page: page.toString(),
                    limit: limit.toString()
                })

                if (status) {
                    params.append('status', status)
                }

                const response = await authFetch(`/api/studies/list?${params}`)

                if (!response.ok) {
                    throw new Error('Error al cargar estudios')
                }

                const data: StudyResponse = await response.json()

                setStudies(data.studies || [])
                setPagination(data.pagination || null)
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Error desconocido'
                setError(message)
                console.error('Error cargando estudios:', err)
            } finally {
                setLoading(false)
            }
        }

        loadStudies()
    }, [page, limit, status])

    return { studies, pagination, loading, error }
}