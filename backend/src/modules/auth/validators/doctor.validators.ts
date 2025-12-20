import Joi from 'joi';

const DoctorSchema = Joi.object({
    firstName: Joi.string().min(2).required(),
    lastName: Joi.string().min(2).required(),
    dni: Joi.string().required().min(8).max(18).alphanum(),
    license: Joi.string().required().min(4).alphanum(),
    email: Joi.string().email().required(),
    password: Joi.string().required().min(8)
});

export function validateDoctor(data: any){
    return DoctorSchema.validate(data)
}