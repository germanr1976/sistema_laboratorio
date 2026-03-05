import { Request, Response } from 'express';
import {
    createStudyRequestSchema,
    rejectStudyRequestSchema,
    studyRequestQuerySchema,
} from '../validators/studyRequest.validators';
import * as studyRequestService from '../services/studyRequest.services';

const { STUDY_REQUEST_STATUS } = studyRequestService;

const DATE_ONLY_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;

function parseRequestedDate(value: unknown): Date | null {
    if (!(value instanceof Date) && typeof value !== 'string') {
        return null;
    }

    const raw = value instanceof Date ? value.toISOString() : value.trim();
    const match = raw.match(DATE_ONLY_REGEX);

    if (match) {
        const year = Number(match[1]);
        const month = Number(match[2]);
        const day = Number(match[3]);
        return new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
    }

    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) {
        return null;
    }

    return parsed;
}

export const createStudyRequest = async (req: Request, res: Response) => {
    try {
        const patientId = req.user?.id;
        const roleName = req.user?.role?.name;

        if (!patientId || roleName !== 'PATIENT') {
            return res.status(403).json({
                success: false,
                message: 'Solo pacientes autenticados pueden solicitar estudios',
            });
        }

        const { error, value } = createStudyRequestSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Datos de entrada inválidos',
                errors: error.details,
            });
        }

        const parsedRequestedDate = parseRequestedDate(value.requestedDate);
        if (!parsedRequestedDate) {
            return res.status(400).json({
                success: false,
                message: 'Fecha solicitada inválida',
            });
        }

        const created = await studyRequestService.createStudyRequest({
            patientId,
            dni: req.user!.dni,
            requestedDate: parsedRequestedDate,
            doctorName: value.doctorName,
            insuranceName: value.insuranceName,
            observations: value.observations || null,
        });

        // Debug log: mostrar resumen de la creación
        console.log('[study-requests] createStudyRequest -> created:', {
            id: created?.id,
            patientId: created?.patientId,
            status: created?.status,
        });

        return res.status(201).json({
            success: true,
            message: 'Solicitud de estudio creada y quedó en estado PENDING para validación profesional',
            data: created,
        });
    } catch (error) {
        console.error('Error creando solicitud de estudio:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
        });
    }
};

export const getMyStudyRequests = async (req: Request, res: Response) => {
    try {
        const patientId = req.user?.id;
        const roleName = req.user?.role?.name;

        if (!patientId || roleName !== 'PATIENT') {
            return res.status(403).json({
                success: false,
                message: 'Solo pacientes autenticados pueden ver sus estudios solicitados',
            });
        }

        const rows = await studyRequestService.getStudyRequestsByPatient(patientId);

        return res.status(200).json({
            success: true,
            message: 'Estudios solicitados obtenidos exitosamente',
            data: rows,
            count: rows.length,
        });
    } catch (error) {
        console.error('Error obteniendo solicitudes del paciente:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
        });
    }
};

export const listStudyRequestsForProfessional = async (req: Request, res: Response) => {
    try {
        const roleName = req.user?.role?.name;
        if (roleName !== 'BIOCHEMIST' && roleName !== 'ADMIN') {
            return res.status(403).json({
                success: false,
                message: 'Se requieren permisos de profesional',
            });
        }

        const { error, value } = studyRequestQuerySchema.validate(req.query);
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Parámetros de búsqueda inválidos',
                errors: error.details,
            });
        }

        const filters = { dni: value.dni, status: value.status };

        // Debug log: quién solicita la lista y con qué filtros
        console.log('[study-requests] listStudyRequestsForProfessional -> user:', {
            id: req.user?.id,
            role: roleName,
        }, 'filters:', filters);

        const rows = await studyRequestService.listStudyRequestsForProfessional(filters);

        // Debug log: mostrar cuantos rows devolvió y un ejemplo
        try {
            console.log('[study-requests] listStudyRequestsForProfessional -> rowsCount:', Array.isArray(rows) ? rows.length : 0);
            if (Array.isArray(rows) && rows.length > 0) {
                console.log('[study-requests] listStudyRequestsForProfessional -> sampleRow:', JSON.stringify(rows[0]));
            }
        } catch (logErr) {
            console.error('[study-requests] error logging rows:', logErr);
        }

        return res.status(200).json({
            success: true,
            message: 'Solicitudes obtenidas exitosamente',
            data: rows,
            count: rows.length,
        });
    } catch (error) {
        console.error('Error listando solicitudes para profesional:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
        });
    }
};

export const validateStudyRequest = async (req: Request, res: Response) => {
    try {
        const validatorId = req.user?.id;
        if (!validatorId) {
            return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
        }

        const id = Number(req.params.id);
        if (!Number.isFinite(id)) {
            return res.status(400).json({ success: false, message: 'ID inválido' });
        }

        const request = await studyRequestService.getStudyRequestById(id);
        if (!request) {
            return res.status(404).json({ success: false, message: 'Solicitud no encontrada' });
        }

        if (request.status !== STUDY_REQUEST_STATUS.PENDING) {
            return res.status(409).json({
                success: false,
                message: 'Solo se pueden validar solicitudes en estado PENDING',
            });
        }

        const updated = await studyRequestService.validateStudyRequest(id, validatorId);
        return res.status(200).json({
            success: true,
            message: 'Solicitud validada correctamente',
            data: updated,
        });
    } catch (error) {
        console.error('Error validando solicitud:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
        });
    }
};

export const rejectStudyRequest = async (req: Request, res: Response) => {
    try {
        const validatorId = req.user?.id;
        if (!validatorId) {
            return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
        }

        const id = Number(req.params.id);
        if (!Number.isFinite(id)) {
            return res.status(400).json({ success: false, message: 'ID inválido' });
        }

        const { error, value } = rejectStudyRequestSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Datos inválidos',
                errors: error.details,
            });
        }

        const request = await studyRequestService.getStudyRequestById(id);
        if (!request) {
            return res.status(404).json({ success: false, message: 'Solicitud no encontrada' });
        }

        if (request.status !== STUDY_REQUEST_STATUS.PENDING && request.status !== STUDY_REQUEST_STATUS.VALIDATED) {
            return res.status(409).json({
                success: false,
                message: 'Solo se pueden rechazar solicitudes PENDING o VALIDATED',
            });
        }

        const updated = await studyRequestService.rejectStudyRequest(id, validatorId, value.observations || null);
        return res.status(200).json({
            success: true,
            message: 'Solicitud rechazada correctamente',
            data: updated,
        });
    } catch (error) {
        console.error('Error rechazando solicitud:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
        });
    }
};

export const convertStudyRequest = async (req: Request, res: Response) => {
    try {
        const validatorId = req.user?.id;
        if (!validatorId) {
            return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
        }

        const id = Number(req.params.id);
        if (!Number.isFinite(id)) {
            return res.status(400).json({ success: false, message: 'ID inválido' });
        }

        const converted = await studyRequestService.convertStudyRequestToStudy(id, validatorId);

        return res.status(200).json({
            success: true,
            message: 'Solicitud convertida a estudio correctamente',
            data: converted,
        });
    } catch (error: any) {
        const message = error?.message || 'Error al convertir solicitud';
        const known = [
            'Solicitud no encontrada',
            'La solicitud no está asociada a un paciente',
            'Solo se pueden convertir solicitudes validadas',
            'La solicitud ya fue convertida a estudio',
            'Estado IN_PROGRESS no configurado',
        ];

        if (known.includes(message)) {
            return res.status(409).json({ success: false, message });
        }

        console.error('Error convirtiendo solicitud:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
        });
    }
};
