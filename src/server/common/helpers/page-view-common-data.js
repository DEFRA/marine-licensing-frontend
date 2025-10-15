import { getUserSession } from '#src/server/common/plugins/auth/utils.js'
import { routes } from '#src/server/common/constants/routes.js'

export const getPageViewCommonData = async (request) => {
  const userSession = await getUserSession(request, request.state?.userSession)
  if (!userSession) {
    return {}
  }
  const { applicantOrganisationName, hasMultipleOrganisations, displayName } =
    userSession
  const showChangeOrganisationLink =
    hasMultipleOrganisations && request.path === routes.DASHBOARD
  const orgOrUserName = hasMultipleOrganisations
    ? applicantOrganisationName || displayName
    : null
  return { orgOrUserName, showChangeOrganisationLink }
}
