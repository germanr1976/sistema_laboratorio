import Joi from 'joi';

export const createTenantSchema = Joi.object({
    name: Joi.string().min(2).max(150).required(),
    slug: Joi.string().trim().lowercase().pattern(/^[a-z0-9-]+$/).min(2).max(80).required(),
    contactEmail: Joi.string().email().max(255).optional().allow(null, ''),
    supportPhone: Joi.string().max(50).optional().allow(null, ''),
    address: Joi.string().max(255).optional().allow(null, ''),
    initialPlanCode: Joi.string().trim().uppercase().max(60).optional().default('STARTER'),
});

export const updateTenantSchema = Joi.object({
    name: Joi.string().min(2).max(150).required(),
    slug: Joi.string().trim().lowercase().pattern(/^[a-z0-9-]+$/).min(2).max(80).required(),
    contactEmail: Joi.string().email().max(255).optional().allow(null, ''),
    supportPhone: Joi.string().max(50).optional().allow(null, ''),
    address: Joi.string().max(255).optional().allow(null, ''),
});

export const setTenantSuspendedByPlatformSchema = Joi.object({
    suspended: Joi.boolean().required(),
});

export const assignTenantPlanSchema = Joi.object({
    planCode: Joi.string().trim().uppercase().max(60).required(),
    status: Joi.string().valid('ACTIVE', 'SUSPENDED', 'CANCELED', 'TRIAL').optional().default('ACTIVE'),
    endsAt: Joi.date().optional().allow(null),
});

export const bootstrapPlatformAdminSchema = Joi.object({
    userId: Joi.number().integer().positive().optional(),
    dni: Joi.string().alphanum().min(7).max(18).optional(),
    email: Joi.string().email().max(255).optional(),
}).or('userId', 'dni', 'email');

export const createTenantAdminSchema = Joi.object({
    dni: Joi.string().alphanum().min(7).max(18).required(),
    email: Joi.string().email().max(255).required(),
    password: Joi.string().min(8).max(120).required(),
    firstName: Joi.string().min(2).max(100).required(),
    lastName: Joi.string().min(2).max(100).required(),
    birthDate: Joi.date().optional().allow(null),
    license: Joi.string().max(255).optional().allow(null, ''),
});
