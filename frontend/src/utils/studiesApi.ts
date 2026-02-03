import authFetch from './authFetch';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface Study {
    id: number;
    userId: number;
    studyName: string;
    studyDate: string | null;
    socialInsurance: string | null;
    pdfUrl: string | null;
    statusId: number;
    biochemistId: number | null;
    createdAt: string;
    updatedAt: string;
    status: {
        id: number;
        name: string;
    };
    patient: {
        id: number;
        dni: string;
        profile: {
            firstName: string;
            lastName: string;
        } | null;
    };
    biochemist: {
        id: number;
        dni: string;
        profile: {
            firstName: string;
            lastName: string;
        } | null;
    } | null;
    doctor?: string | null;
}

/**
 * Normalizar datos del backend: convertir doctor a medico
 */
function normalizeStudy(study: any): any {
    return {
        ...study,
        medico: study.doctor || null,
    };
}

/**
 * Obtener los estudios del bioquímico autenticado
 */
export async function getMyStudies(): Promise<Study[]> {
    try {
        const response = await authFetch(`${API_URL}/api/studies/biochemist/me`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Error al obtener estudios');
        }

        return (data.data || []).map(normalizeStudy);
    } catch (error) {
        console.error('Error fetching studies:', error);
        throw error;
    }
}

/**
 * Obtener un estudio por ID
 */
export async function getStudyById(id: number): Promise<Study> {
    try {
        const response = await authFetch(`${API_URL}/api/studies/${id}`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Error al obtener estudio');
        }

        return normalizeStudy(data.data);
    } catch (error) {
        console.error('Error fetching study:', error);
        throw error;
    }
}

/**
 * Actualizar el estado de un estudio
 */
export async function updateStudyStatus(id: number, statusName: string): Promise<Study> {
    try {
        const response = await authFetch(`${API_URL}/api/studies/${id}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ statusName }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Error al actualizar estado');
        }

        return normalizeStudy(data.data);
    } catch (error) {
        console.error('Error updating study status:', error);
        throw error;
    }
}

/**
 * Anular un estudio
 */
export async function cancelStudy(id: number): Promise<Study> {
    try {
        const response = await authFetch(`${API_URL}/api/studies/${id}/cancel`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Error al anular estudio');
        }

        return normalizeStudy(data.data);
    } catch (error) {
        console.error('Error cancelling study:', error);
        throw error;
    }
}