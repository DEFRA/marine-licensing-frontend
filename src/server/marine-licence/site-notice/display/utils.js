import { PUBLIC_NOTICE_REQUEST_RELATES_TO } from '#src/server/common/constants/site-notice.js'
import dayjs from 'dayjs'
import { formatDate as formatDateString } from '#src/server/common/helpers/dates/date-utils.js'

export const MAX_SITE_NOTICE_LOCATIONS = 30

export const getDisplayConditions = (marineLicence, taskData = {}) => {
  const { requestRelatesTo } = taskData

  const showCommunityUserSection =
    requestRelatesTo === PUBLIC_NOTICE_REQUEST_RELATES_TO.BOTH ||
    requestRelatesTo === PUBLIC_NOTICE_REQUEST_RELATES_TO.COMMUNITY_USERS

  const showMarineUserSection =
    requestRelatesTo === PUBLIC_NOTICE_REQUEST_RELATES_TO.BOTH ||
    requestRelatesTo === PUBLIC_NOTICE_REQUEST_RELATES_TO.MARINE_USERS

  const showMultipleSitesSection = (marineLicence.siteDetails?.length ?? 0) > 1

  return {
    showCommunityUserSection,
    showMarineUserSection,
    showMultipleSitesSection
  }
}

const formatDate = (date) => {
  if (!date) {
    return null
  }

  const { day, month, year } = date
  return dayjs(`${year}-${month}-${day}`).format('D MMMM YYYY')
}

export const getEvidenceSubmission = (task) =>
  task.resolvedAt
    ? {
        resolvedAt: formatDateString(task.resolvedAt),
        resolvedByName: task.resolvedByName
      }
    : null

export const isSiteNoticeEvidenceComplete = (siteNoticeEvidence) =>
  siteNoticeEvidence.length > 0 &&
  siteNoticeEvidence.every(
    ({ locationName, dateDisplayed, closeUpPhoto, positionPhoto }) =>
      locationName && dateDisplayed && closeUpPhoto && positionPhoto
  )

export const getSiteNoticeValues = (marineLicence) => {
  const siteNoticeEvidence = marineLicence.siteNoticeEvidence ?? []

  return siteNoticeEvidence.map((evidence) => ({
    locationName: evidence.locationName,
    dateDisplayed: formatDate(evidence.dateDisplayed),
    closeUpPhoto: evidence.closeUpPhoto
      ? evidence.closeUpPhoto.uploadedFile.filename
      : undefined,
    positionPhoto: evidence.positionPhoto
      ? evidence.positionPhoto.uploadedFile.filename
      : undefined
  }))
}

export const getCanAddLocation = (siteNoticeEvidence, evidenceSubmission) => {
  return (
    !evidenceSubmission && siteNoticeEvidence.length < MAX_SITE_NOTICE_LOCATIONS
  )
}
