import { getUserSession } from '#src/server/common/plugins/auth/utils.js'
import { routes } from '#src/server/common/constants/routes.js'

export const getPageViewCommonData = async (request) => {
  const userSession = await getUserSession(request, request.state?.userSession)
  if (!userSession) {
    return {}
  }
  const {
    organisationName,
    hasMultipleOrgPickerEntries,
    shouldShowOrgOrUserName,
    displayName
  } = userSession
  const showChangeOrganisationLink =
    hasMultipleOrgPickerEntries && request.path === routes.DASHBOARD
  const orgOrUserName = shouldShowOrgOrUserName
    ? organisationName || displayName
    : null
  return { orgOrUserName, showChangeOrganisationLink }
}
