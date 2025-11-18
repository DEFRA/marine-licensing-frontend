import Joi from 'joi'
import {
  requiredQueryParams,
  activityTypes,
  articleCodes
} from '#src/server/common/constants/mcms-context.js'

const { ACTIVITY_TYPE, ARTICLE, pdfDownloadUrl } = requiredQueryParams

export const paramsSchema = Joi.object({
  [ACTIVITY_TYPE]: Joi.string()
    .valid(...Object.values(activityTypes).map((a) => a.value))
    .required(),
  [ARTICLE]: Joi.string()
    .valid(...articleCodes)
    .required(),
  [pdfDownloadUrl]: Joi.string()
    // https://{subdomain}.marinemanagement.org.uk/{path}/journey/self-service/outcome-document/{guid}
    .pattern(
      /^https:\/\/[^/]+\.marinemanagement\.org\.uk\/[^/]+\/journey\/self-service\/outcome-document\/[a-zA-Z0-9-]+$/
    )
    .required()
})
  .unknown(true)
  .custom((value) => {
    return {
      activityType: value[ACTIVITY_TYPE],
      article: value[ARTICLE],
      pdfDownloadUrl: value[pdfDownloadUrl]
    }
  })
