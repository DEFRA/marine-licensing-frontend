import escapeHtml from 'lodash/escape.js'
import { formatDate } from '#src/config/nunjucks/filters/format-date.js'
import { getTagStyle } from '#src/server/common/helpers/ui/get-tag-style.js'
import { PROJECT_STATUS } from '#src/server/common/constants/projects.js'
import { getStatusLabelText } from '#src/server/dashboard/utils.js'

const APPLICATION_DATE_FORMAT = 'd MMMM yyyy'

export const REDACTION_LABEL = '***REDACTED***'
const REDACTION_LABEL_HTML = `<span class="app-redaction-label">${REDACTION_LABEL}</span>`

const wrapRedactionLabels = (text) =>
  escapeHtml(text ?? '').replaceAll(REDACTION_LABEL, REDACTION_LABEL_HTML)

export const buildRedactionsForView = (redactions) =>
  Object.fromEntries(
    Object.entries(redactions ?? {}).map(([fieldKey, redaction]) => [
      fieldKey,
      {
        ...redaction,
        redactedText: wrapRedactionLabels(redaction.redactedText),
        redactedTextValue: redaction.redactedText
      }
    ])
  )

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
