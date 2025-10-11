import Joi from 'joi';

const analysesSchema = Joi.object({
    id: Joi.number().integer().positive()
})


export function validateAnalysisRequest(data: any){
    return analysesSchema.validate(data)
}