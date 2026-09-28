import { formatDate } from '#src/config/nunjucks/filters/format-date.js'
import { getTagStyle } from '#src/server/common/helpers/ui/get-tag-style.js'
import { PROJECT_STATUS } from '#src/server/common/constants/projects.js'
import { getStatusLabelText } from '#src/server/dashboard/utils.js'
import { wrapRedactionLabels } from '#src/server/common/helpers/marine-licence/redaction-label.js'

const APPLICATION_DATE_FORMAT = 'd MMMM yyyy'

const isObject = (value) => typeof value === 'object' && value !== null

const isTextRedaction = (value) => isObject(value) && 'redactedText' in value

const buildRedaction = (redaction) => {
  return {
    ...redaction,
    redactedText: wrapRedactionLabels(redaction.redactedText),
    redactedTextValue: redaction.redactedText
  }
}

const buildRedactionValue = (value) => {
  if (!isObject(value)) {
    return value
  }

  if (isTextRedaction(value)) {
    return buildRedaction(value)
  }

  return buildRedactionsForView(value)
}

/**
 * Redactions are stored under the dotted fieldKey the backend was sent, so they
 * nest as deeply as that key goes:
 *
 *   projectName                  -> redactions.projectName
 *   specialLegalPowers.details   -> redactions.specialLegalPowers.details
 *   siteDetails.siteName         -> redactions.siteDetails.0.siteName
 *
 * Walk down through the groups until a redaction is reached, and build that.
 */
export const buildRedactionsForView = (group) => {
  const result = {}

  for (const [key, value] of Object.entries(group ?? {})) {
    result[key] = buildRedactionValue(value)
  }

  return result
}

export const buildApplicationDetailsCardData = (marineLicence) => {
  const {
    applicationReference,
    status,
    submittedAt,
    rejectedDate,
    rejectedReasons,
    rejectedInformation,
    transferredDate,
    withdrawnAt
  } = marineLicence

  const isTransferred = status === PROJECT_STATUS.TRANSFERRED
  const isRejected = status === PROJECT_STATUS.REJECTED
  const isWithdrawn = status === PROJECT_STATUS.WITHDRAWN

  return {
    applicationReference,
    submittedAt: formatDate(submittedAt, APPLICATION_DATE_FORMAT),
    transferredDate: formatDate(transferredDate, APPLICATION_DATE_FORMAT),
    withdrawnAt: formatDate(withdrawnAt, APPLICATION_DATE_FORMAT),
    rejectedDate: formatDate(rejectedDate, APPLICATION_DATE_FORMAT),
    rejectedReasons: rejectedReasons
      ? rejectedReasons.split(',')
      : rejectedReasons,
    rejectedInformation,
    isTransferred,
    isRejected,
    isWithdrawn,
    status,
    statusTag: `<strong class="govuk-tag ${getTagStyle(status)}">${getStatusLabelText(status)}</strong>`
  }
}
