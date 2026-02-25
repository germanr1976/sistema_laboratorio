import Joi from 'joi';

const PatientSchema = Joi.object({
    firstName: Joi.string().min(2).required(),
    lastName: Joi.string().min(2).required(),
    dni: Joi.string().required().min(8).max(18).alphanum(),
    email: Joi.string().email().optional(),
    password: Joi.string().min(8).optional(),
    birthDate: Joi.alternatives().try(
        Joi.date(),
        Joi.string().isoDate()
    ).required()

})

export function validatePatient(data: any) {
    return PatientSchema.validate(data)
}