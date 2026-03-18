import { PROJECT_STATUS } from '#src/server/common/constants/projects.js'
import { getAuthProvider } from '#src/server/common/helpers/authenticated-requests.js'
import { AUTH_STRATEGIES } from '#src/server/common/constants/auth.js'
import {
  routes,
  marineLicenceRoutes
} from '#src/server/common/constants/routes.js'
import { EXEMPTIONS_KEY } from '#src/server/common/constants/exemptions.js'

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
