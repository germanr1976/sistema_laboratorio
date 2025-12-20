import Joi from 'joi';

const LoginSchema = Joi.object({
    dni: Joi.string().required().min(8).max(18).alphanum(),
    password: Joi.string().optional().min(8)

});

export function validateLogin(data: any){
    return LoginSchema.validate(data)
}