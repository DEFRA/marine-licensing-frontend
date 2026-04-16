import joi from 'joi'
import {
  activitySubTypeCodesByType,
  activityTypeValues
} from '#src/server/marine-licence/site-details/type-of-activity/constants.js'

const subTypeSchema = (activityType) => {
  const requiredKey = `ACTIVITY_TYPE_${activityType.toUpperCase()}_REQUIRED`
  return joi
    .string()
    .valid(...activitySubTypeCodesByType[activityType])
    .required()
    .messages({
      'any.only': requiredKey,
      'string.empty': requiredKey,
      'any.required': requiredKey
    })
}

export const typeOfActivitySchema = joi.object({
  activityType: joi
    .string()
    .valid(...activityTypeValues)
    .required()
    .messages({
      'any.only': 'ACTIVITY_TYPE_REQUIRED',
      'string.empty': 'ACTIVITY_TYPE_REQUIRED',
      'any.required': 'ACTIVITY_TYPE_REQUIRED'
    }),
  activitySubTypeConstruction: joi.when('activityType', {
    is: 'construction',
    then: subTypeSchema('construction'),
    otherwise: joi.optional().allow('', null)
  }),
  activitySubTypeDeposit: joi.when('activityType', {
    is: 'deposit',
    then: subTypeSchema('deposit'),
    otherwise: joi.optional().allow('', null)
  }),
  activitySubTypeRemoval: joi.when('activityType', {
    is: 'removal',
    then: subTypeSchema('removal'),
    otherwise: joi.optional().allow('', null)
  })
})
