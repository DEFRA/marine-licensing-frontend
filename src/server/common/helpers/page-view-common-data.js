import { getUserSession } from '#src/server/common/plugins/auth/utils.js'
import { routes } from '#src/server/common/constants/routes.js'

export const changeOrganisationLinkRoutes = [
  routes.DASHBOARD,
  routes.SERVICE_HOME
]

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
    hasMultipleOrgPickerEntries &&
    changeOrganisationLinkRoutes.includes(request.path)
  const orgOrUserName = shouldShowOrgOrUserName
    ? organisationName || displayName
    : null
  return { orgOrUserName, showChangeOrganisationLink }
}
