import Joi from 'joi'
import { config } from '#src/config/config.js'
import {
  requiredQueryParams,
  activityTypes,
  articleCodes,
  allowedOutcomeDocumentHosts
} from '#src/server/common/constants/mcms-context.js'

const { ACTIVITY_TYPE, ARTICLE, pdfDownloadUrl } = requiredQueryParams

const NEW_DOC_PATH = /^\/outcome-documents\/[A-Za-z0-9_-]+$/
const LEGACY_DOC_PATH =
  /^\/[^/]+\/journey\/self-service\/outcome-document\/[A-Za-z0-9_-]+$/

function appHost() {
  try {
    return new URL(config.get('appBaseUrl')).host
  } catch {
    return null
  }
}

function isLegacyHost(host) {
  return /^[^.]+\.marinemanagement\.org\.uk$/.test(host)
}

function isNewAllowedHost(host) {
  return allowedOutcomeDocumentHosts.includes(host) || host === appHost()
}

function isAllowedPath(pathname) {
  return NEW_DOC_PATH.test(pathname) || LEGACY_DOC_PATH.test(pathname)
}

function validatePdfDownloadUrl(value, helpers) {
  let url
  try {
    url = new URL(value)
  } catch {
    return helpers.error('any.invalid')
  }
  if (isLegacyHost(url.host)) {
    if (url.protocol !== 'https:') {
      return helpers.error('any.invalid')
    }
    if (!LEGACY_DOC_PATH.test(url.pathname)) {
      return helpers.error('any.invalid')
    }
    return value
  }
  if (isNewAllowedHost(url.host)) {
    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      return helpers.error('any.invalid')
    }
    if (!isAllowedPath(url.pathname)) {
      return helpers.error('any.invalid')
    }
    return value
  }
  return helpers.error('any.invalid')
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
