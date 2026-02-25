import { Request, Response } from 'express';
import {
    createStudyRequestSchema,
    rejectStudyRequestSchema,
    studyRequestQuerySchema,
} from '../validators/studyRequest.validators';
import * as studyRequestService from '../services/studyRequest.services';

const { STUDY_REQUEST_STATUS } = studyRequestService;

export const createStudyRequest = async (req: Request, res: Response) => {
    try {
        const patientId = req.user?.id;
        const roleName = req.user?.role?.name;

        if (!patientId || roleName !== 'PATIENT') {
            return res.status(403).json({
                success: false,
                message: 'Solo pacientes autenticados pueden crear solicitudes',
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

        const uploadedOrderPhoto = (req as any).file as Express.Multer.File | undefined;
        const uploadedOrderUrl = uploadedOrderPhoto ? `/uploads/orders/${uploadedOrderPhoto.filename}` : null;

        const created = await studyRequestService.createStudyRequest({
            patientId,
            dni: req.user!.dni,
            requestedDate: new Date(value.requestedDate),
            doctorName: value.doctorName,
            insuranceName: value.insuranceName,
            medicalOrderPhotoUrl: uploadedOrderUrl || value.medicalOrderPhotoUrl || null,
            observations: value.observations || null,
        });

        return res.status(201).json({
            success: true,
            message: 'Solicitud de estudio creada exitosamente',
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
                message: 'Solo pacientes autenticados pueden ver sus solicitudes',
            });
        }

        const rows = await studyRequestService.getStudyRequestsByPatient(patientId);

        return res.status(200).json({
            success: true,
            message: 'Solicitudes obtenidas exitosamente',
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

        const rows = await studyRequestService.listStudyRequestsForProfessional({
            dni: value.dni,
            status: value.status,
        });

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
