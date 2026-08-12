import { formatDate } from '#src/config/nunjucks/filters/format-date.js'
import { getTagStyle } from '#src/server/common/helpers/ui/get-tag-style.js'
import { PROJECT_STATUS } from '#src/server/common/constants/projects.js'
import { getStatusLabelText } from '#src/server/dashboard/utils.js'

const APPLICATION_DATE_FORMAT = 'd MMM yyyy'

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
    showApplicationDetailsCard: isTransferred || isRejected || isWithdrawn,
    status,
    statusTag: `<strong class="govuk-tag ${getTagStyle(status)}">${getStatusLabelText(status)}</strong>`
  }
}
