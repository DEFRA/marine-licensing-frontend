import { formatDate } from '#src/config/nunjucks/filters/format-date.js'
import { getTagStyle } from '#src/server/common/helpers/ui/get-tag-style.js'
import { PROJECT_STATUS } from '#src/server/common/constants/projects.js'
import escapeHtml from 'lodash/escape.js'

export const buildApplicationDetailsCardData = (marineLicence) => {
  const {
    applicationReference,
    status,
    submittedAt,
    rejectedDate,
    rejectedReasons,
    rejectedInformation,
    transferredDate
  } = marineLicence

  return {
    applicationReference,
    submittedAt: formatDate(submittedAt, 'd MMM yyyy'),
    transferredDate: formatDate(transferredDate, 'd MMM yyyy'),
    rejectedDate: formatDate(rejectedDate, 'd MMM yyyy'),
    rejectedReasons: rejectedReasons ? rejectedReasons.split(',') : rejectedReasons,
    rejectedInformation,
    isTransferred: status === PROJECT_STATUS.TRANSFERRED,
    isRejected: status === PROJECT_STATUS.REJECTED,
    statusTag: `<strong class="govuk-tag ${getTagStyle(status)}">${escapeHtml(status)}</strong>`
  }
}
