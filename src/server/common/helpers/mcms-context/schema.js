import Joi from 'joi'
import { config } from '#src/config/config.js'
import {
  requiredQueryParams,
  activityTypes,
  articleCodes
} from '#src/server/common/constants/mcms-context.js'

const { ACTIVITY_TYPE, ARTICLE, pdfDownloadUrl } = requiredQueryParams

const NEW_DOC_PATH =
  /^\/journey\/self-service\/outcome-document\/[A-Za-z0-9_-]+$/
const MCMS_DOC_PATH =
  /^\/[^/]+\/journey\/self-service\/outcome-document\/[A-Za-z0-9_-]+$/

function appHost() {
  try {
    return new URL(config.get('appBaseUrl')).host
  } catch {
    return null
  }
}

function isMcmsHost(host) {
  return /^[^.]+\.marinemanagement\.org\.uk$/.test(host)
}

function isOwnHost(host) {
  return host === appHost()
}

function validatePdfDownloadUrl(value, helpers) {
  const INVALID = 'any.invalid'
  let url
  try {
    url = new URL(value)
  } catch {
    return helpers.error(INVALID)
  }
  if (isMcmsHost(url.host)) {
    if (url.protocol !== 'https:') {
      return helpers.error(INVALID)
    }
    if (!MCMS_DOC_PATH.test(url.pathname)) {
      return helpers.error(INVALID)
    }
    return value
  }
  if (isOwnHost(url.host)) {
    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      return helpers.error(INVALID)
    }
    if (!NEW_DOC_PATH.test(url.pathname)) {
      return helpers.error(INVALID)
    }
    return value
  }
  return helpers.error(INVALID)
}

export const paramsSchema = Joi.object({
  [ACTIVITY_TYPE]: Joi.string()
    .valid(...Object.values(activityTypes).map((a) => a.value))
    .required(),
  [ARTICLE]: Joi.string()
    .valid(...articleCodes)
    .required(),
  [pdfDownloadUrl]: Joi.string()
    .custom(validatePdfDownloadUrl, 'pdfDownloadUrl validation')
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
