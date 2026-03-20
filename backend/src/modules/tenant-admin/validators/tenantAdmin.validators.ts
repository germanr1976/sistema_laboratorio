import Joi from 'joi';

export const createTenantUserSchema = Joi.object({
    dni: Joi.string().alphanum().min(7).max(18).required(),
    email: Joi.string().email().max(255).required(),
    password: Joi.string().min(8).max(120).required(),
    roleName: Joi.string().valid('ADMIN', 'BIOCHEMIST', 'PATIENT').required(),
    license: Joi.string().max(255).optional().allow(null, ''),
    firstName: Joi.string().min(2).max(100).required(),
    lastName: Joi.string().min(2).max(100).required(),
    birthDate: Joi.date().optional().allow(null),
});

export const updateTenantUserSchema = Joi.object({
    email: Joi.string().email().max(255).optional(),
    password: Joi.string().min(8).max(120).optional(),
    roleName: Joi.string().valid('ADMIN', 'BIOCHEMIST', 'PATIENT').optional(),
    license: Joi.string().max(255).optional().allow(null, ''),
    firstName: Joi.string().min(2).max(100).optional(),
    lastName: Joi.string().min(2).max(100).optional(),
    birthDate: Joi.date().optional().allow(null),
}).min(1);

export const updateTenantSettingsSchema = Joi.object({
    name: Joi.string().min(2).max(150).optional(),
    contactEmail: Joi.string().email().max(255).optional().allow(null, ''),
    supportPhone: Joi.string().max(50).optional().allow(null, ''),
    address: Joi.string().max(255).optional().allow(null, ''),
}).min(1);

export const setRolePermissionsSchema = Joi.object({
    roleName: Joi.string().valid('ADMIN', 'BIOCHEMIST', 'PATIENT').required(),
    permissionKeys: Joi.array().items(Joi.string().max(120)).required(),
});
