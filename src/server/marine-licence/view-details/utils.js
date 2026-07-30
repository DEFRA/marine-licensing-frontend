import { formatDate } from '#src/config/nunjucks/filters/format-date.js'
import { getTagStyle } from '#src/server/common/helpers/ui/get-tag-style.js'
import { PROJECT_STATUS } from '#src/server/common/constants/projects.js'
import escapeHtml from 'lodash/escape.js'

export const buildApplicationDetailsCardData = (marineLicence) => {
  const { applicationReference, status, submittedAt, transferredDate } =
    marineLicence

  return {
    applicationReference,
    submittedAt: formatDate(submittedAt, 'd MMM yyyy'),
    transferredDate: formatDate(transferredDate, 'd MMM yyyy'),
    isTransferred: status === PROJECT_STATUS.TRANSFERRED,
    statusTag: `<strong class="govuk-tag ${getTagStyle(status)}">${escapeHtml(status)}</strong>`
  }
}
