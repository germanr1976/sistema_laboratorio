import Joi from 'joi';

export const createStudyRequestSchema = Joi.object({
    requestedDate: Joi.alternatives().try(Joi.date(), Joi.string().isoDate()).required(),
    doctorName: Joi.string().min(2).max(255).required(),
    insuranceName: Joi.string().min(2).max(255).required(),
    medicalOrderPhotoUrl: Joi.string().uri().max(500).optional().allow(null, ''),
    observations: Joi.string().max(2000).optional().allow(null, ''),
});

export const studyRequestQuerySchema = Joi.object({
    dni: Joi.string().min(7).max(18).alphanum().optional(),
    status: Joi.string().valid('PENDING', 'VALIDATED', 'REJECTED', 'CONVERTED').optional(),
});

export const rejectStudyRequestSchema = Joi.object({
    observations: Joi.string().max(2000).optional().allow(null, ''),
});
