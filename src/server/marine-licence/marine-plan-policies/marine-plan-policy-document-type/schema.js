import joi from 'joi'
import {
  MPP_DOCUMENT_TYPE_OTHER,
  MPP_DOCUMENT_TYPE_OTHER_MAX_LENGTH,
  MPP_DOCUMENT_TYPES
} from '#src/server/marine-licence/marine-plan-policies/marine-plan-policy-document-type/constants.js'

export const marinePlanPolicyDocumentTypeSchema = joi.object({
  documentType: joi
    .string()
    .valid(...Object.keys(MPP_DOCUMENT_TYPES))
    .required()
    .messages({
      'any.only': 'DOCUMENT_TYPE_REQUIRED',
      'any.required': 'DOCUMENT_TYPE_REQUIRED',
      'string.empty': 'DOCUMENT_TYPE_REQUIRED'
    }),
  documentTypeOther: joi.when('documentType', {
    is: MPP_DOCUMENT_TYPE_OTHER,
    then: joi
      .string()
      .trim()
      .max(MPP_DOCUMENT_TYPE_OTHER_MAX_LENGTH)
      .required()
      .messages({
        'string.empty': 'DOCUMENT_TYPE_OTHER_REQUIRED',
        'any.required': 'DOCUMENT_TYPE_OTHER_REQUIRED',
        'string.max': 'DOCUMENT_TYPE_OTHER_MAX_LENGTH'
      }),
    otherwise: joi.any().strip()
  })
})

export const marinePlanPolicyDocumentTypeParamsSchema = joi.object({
  documentId: joi.string().guid().required().messages({
    'string.guid': 'DOCUMENT_ID_INVALID',
    'any.required': 'DOCUMENT_ID_REQUIRED'
  })
})
