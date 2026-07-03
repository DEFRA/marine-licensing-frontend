import { getUserSession } from '#src/server/common/plugins/auth/utils.js'
import {
  marineLicenceRoutes,
  routes
} from '#src/server/common/constants/routes.js'

export const changeOrganisationLinkRoutes = [
  routes.DASHBOARD,
  routes.SERVICE_HOME
]

export const hideOrgOrUserNameRoutes = [
  marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICIES_GUIDANCE
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
    displayName,
    shouldShowCitizenName
  } = userSession
  const showChangeOrganisationLink =
    hasMultipleOrgPickerEntries &&
    changeOrganisationLinkRoutes.includes(request.path)

  const citizenName = shouldShowCitizenName ? displayName : null

  const sessionOrgOrUserName = shouldShowOrgOrUserName
    ? organisationName || displayName
    : citizenName

  const orgOrUserName = hideOrgOrUserNameRoutes.includes(request.path)
    ? null
    : sessionOrgOrUserName

  return { orgOrUserName, showChangeOrganisationLink }
}
