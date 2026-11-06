import joi from 'joi'

export const marinePlanPolicyDocumentTypeSchema = joi.object({})

export const marinePlanPolicyDocumentTypeParamsSchema = joi.object({
  documentId: joi.string().guid().required()
})
