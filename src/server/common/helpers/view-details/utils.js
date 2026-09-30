import Boom from '@hapi/boom'
import { PROJECT_STATUS } from '#src/server/common/constants/projects.js'
import { getAuthProvider } from '#src/server/common/helpers/authenticated-requests.js'
import { AUTH_STRATEGIES } from '#src/server/common/constants/auth.js'
import {
  routes,
  marineLicenceRoutes
} from '#src/server/common/constants/routes.js'
import { EXEMPTIONS_KEY } from '#src/server/common/constants/exemptions.js'
import { getUserSession } from '#src/server/common/plugins/auth/utils.js'

export const isProjectViewable = (project) => {
  return (
    project.status !== PROJECT_STATUS.DRAFT && !!project.applicationReference
  )
}

export const isInternalUserView = (request, projectType) =>
  request.path.startsWith(
    projectType === EXEMPTIONS_KEY
      ? routes.VIEW_DETAILS_INTERNAL_USER
      : marineLicenceRoutes.MARINE_LICENCE_VIEW_DETAILS_INTERNAL_USER
  ) && getAuthProvider(request) === AUTH_STRATEGIES.ENTRA_ID

export const getSiteNoticeViewDetailsUrl = (marineLicenceId) =>
  `${marineLicenceRoutes.MARINE_LICENCE_VIEW_DETAILS}/${marineLicenceId}`

export const assertIsOriginalSubmitter = async (request, marineLicence) => {
  const userSession = await getUserSession(request, request.state?.userSession)

  if (
    !userSession?.contactId ||
    userSession.contactId !== marineLicence.contactId
  ) {
    throw Boom.forbidden(
      'Only the person who submitted the application can view its notifications'
    )
  }
}
