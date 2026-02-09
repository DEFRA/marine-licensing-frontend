import { getUserSession } from '#src/server/common/plugins/auth/utils.js'
import { routes } from '#src/server/common/constants/routes.js'

export const CONFIRM_INDIVIDUAL_VIEW_ROUTE =
  'defraid-post-login/confirm-individual/index'

const viewContent = {
  pageTitle: "Confirm you're notifying us as an individual"
}

export const confirmIndividualController = {
  async handler(request, h) {
    const userSession = await getUserSession(
      request,
      request.state?.userSession
    )

    if (!userSession?.displayName) {
      return h.redirect(routes.SIGNIN)
    }

    const { displayName, userRelationshipType } = userSession

    if (userRelationshipType !== 'Citizen') {
      return h.redirect(routes.EXEMPTION)
    }

    const heading = `Confirm you're notifying us as ${displayName} for a personal project`

    return h.view(CONFIRM_INDIVIDUAL_VIEW_ROUTE, {
      ...viewContent,
      heading,
      displayName
    })
  }
}

export const confirmIndividualSubmitController = {
  async handler(request, h) {
    const userSession = await getUserSession(
      request,
      request.state?.userSession
    )

    if (!userSession?.displayName) {
      return h.redirect(routes.SIGNIN)
    }
    const { displayName, userRelationshipType } = userSession

    if (userRelationshipType !== 'Citizen') {
      return h.redirect(routes.PROJECT_NAME)
    }

    const heading = `Confirm you're notifying us as ${displayName} for a personal project`

    return h.view(CONFIRM_INDIVIDUAL_VIEW_ROUTE, {
      ...viewContent,
      heading,
      displayName
    })
  }
}
