import { config } from '#src/config/config.js'
import { routes } from '#src/server/common/constants/routes.js'
import { postloginUserSession } from '#src/server/common/helpers/defraid-login/session-cache.js'

export const GUIDANCE_INDIVIDUAL_VIEW_ROUTE =
  'defraid-post-login/guidance-individual/index'

const PAGE_HEADING = 'Exempt activity notification for an individual'

export const guidanceIndividualController = {
  async handler(request, h) {
    const { accountManagementUrl } = config.get('defraId')

    const confirmEmployee = await postloginUserSession.get({
      request,
      key: 'confirmEmployee'
    })
    const confirmAgent = await postloginUserSession.get({
      request,
      key: 'confirmAgent'
    })

    if (!confirmEmployee && !confirmAgent) {
      return h.redirect(routes.EXEMPTION)
    }

    const backLink = confirmEmployee
      ? routes.postLogin.CONFIRM_EMPLOYEE
      : routes.postLogin.CONFIRM_AGENT

    return h.view(GUIDANCE_INDIVIDUAL_VIEW_ROUTE, {
      pageTitle: PAGE_HEADING,
      heading: PAGE_HEADING,
      accountManagementUrl,
      backLink
    })
  }
}
