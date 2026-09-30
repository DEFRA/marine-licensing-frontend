import { PUBLIC_NOTICE_REQUEST_RELATES_TO } from '#src/server/common/constants/site-notice.js'

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
