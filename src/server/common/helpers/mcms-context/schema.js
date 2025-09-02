import Joi from 'joi'
import {
  requiredQueryParams,
  validActivitySubtypes,
  activityTypes,
  articleCodes
} from '~/src/server/common/constants/mcms-context.js'

const { ACTIVITY_TYPE, ARTICLE, pdfDownloadUrl } = requiredQueryParams

export const paramsSchema = Joi.object({
  [ACTIVITY_TYPE]: Joi.string()
    .valid(...Object.values(activityTypes).map((a) => a.value))
    .required(),
  [ARTICLE]: Joi.string()
    .valid(...articleCodes)
    .required(),
  [pdfDownloadUrl]: Joi.string().required(),
  EXE_ACTIVITY_SUBTYPE_CONSTRUCTION: Joi.when(ACTIVITY_TYPE, {
    is: activityTypes.CON.value,
    then: Joi.string()
      .valid(...validActivitySubtypes)
      .required(),
    otherwise: Joi.forbidden()
  }),
  EXE_ACTIVITY_SUBTYPE_DEPOSIT: Joi.when(ACTIVITY_TYPE, {
    is: activityTypes.DEPOSIT.value,
    then: Joi.string()
      .valid(...validActivitySubtypes)
      .required(),
    otherwise: Joi.forbidden()
  }),
  EXE_ACTIVITY_SUBTYPE_REMOVAL: Joi.when(ACTIVITY_TYPE, {
    is: activityTypes.REMOVAL.value,
    then: Joi.string()
      .valid(...validActivitySubtypes)
      .required(),
    otherwise: Joi.forbidden()
  }),
  EXE_ACTIVITY_SUBTYPE_DREDGING: Joi.when(ACTIVITY_TYPE, {
    is: activityTypes.DREDGE.value,
    then: Joi.string()
      .valid(...validActivitySubtypes)
      .required(),
    otherwise: Joi.forbidden()
  })
})
  .unknown(true)
  .custom((value) => {
    const activitySubtype =
      value.EXE_ACTIVITY_SUBTYPE_CONSTRUCTION ||
      value.EXE_ACTIVITY_SUBTYPE_DEPOSIT ||
      value.EXE_ACTIVITY_SUBTYPE_REMOVAL ||
      value.EXE_ACTIVITY_SUBTYPE_DREDGING ||
      undefined

    return {
      activityType: value[ACTIVITY_TYPE],
      activitySubtype,
      article: value[ARTICLE],
      pdfDownloadUrl: value[pdfDownloadUrl]
    }
  })
