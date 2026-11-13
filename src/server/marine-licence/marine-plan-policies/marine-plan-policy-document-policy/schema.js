import joi from 'joi'

const LOCATION_FIELD = /^location-/
export const MPP_DOCUMENT_LOCATION_MAX_LENGTH = 70

const validateLocation = (value, helpers) => {
  const code = helpers.state.path.at(-1).replace(LOCATION_FIELD, '')
  const selected = helpers.state.ancestors[0].supportedPolicies ?? []

  if (!selected.includes(code)) {
    return value
  }

  const location = typeof value === 'string' ? value.trim() : ''

  if (!location) {
    return helpers.message('DOCUMENT_LOCATION_REQUIRED')
  }

  if (location.length > MPP_DOCUMENT_LOCATION_MAX_LENGTH) {
    return helpers.message('DOCUMENT_LOCATION_MAX_LENGTH')
  }

  return location
}

export const marinePlanPolicyDocumentPolicySchema = joi
  .object({
    supportedPolicies: joi
      .array()
      .items(joi.string())
      .single()
      .min(1)
      .required()
      .messages({
        'any.required': 'POLICY_LINKS_REQUIRED',
        'array.min': 'POLICY_LINKS_REQUIRED'
      })
  })
  .pattern(LOCATION_FIELD, joi.any().custom(validateLocation))

export const marinePlanPolicyDocumentPolicyParamsSchema = joi.object({
  documentId: joi.string().guid().required()
})
