import { PUBLIC_NOTICE_REQUEST_RELATES_TO } from '#src/server/common/constants/site-notice.js'
import dayjs from 'dayjs'

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

export const getSiteNoticeValues = (marineLicence) => {
  const siteNoticeEvidence = marineLicence.siteNoticeEvidence ?? []

  return siteNoticeEvidence.map((evidence) => ({
    locationName: evidence.locationName,
    dateDisplayed: formatDate(evidence.dateDisplayed),
    closeUpPhoto: evidence.closeUpPhoto.uploadedFile.filename,
    positionPhoto: evidence.positionPhoto.uploadedFile.filename
  }))
}
