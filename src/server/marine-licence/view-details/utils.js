import { formatDate } from '#src/config/nunjucks/filters/format-date.js'
import { getTagStyle } from '#src/server/common/helpers/ui/get-tag-style.js'
import escapeHtml from 'lodash/escape.js'

export const buildApplicationDetailsCardData = (marineLicence) => {
  const { applicationReference, status, submittedAt, transferredDate } =
    marineLicence

  return {
    applicationReference,
    submittedAt: formatDate(submittedAt, 'd MMM yyyy'),
    transferredDate: formatDate(transferredDate, 'd MMM yyyy'),
    status,
    statusTag: `<strong class="govuk-tag ${getTagStyle(status)}">${escapeHtml(status)}</strong>`
  }
}
