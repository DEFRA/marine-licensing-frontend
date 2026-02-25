import { config } from '#src/config/config.js'
import { routes } from '#src/server/common/constants/routes.js'
import { postloginUserSession } from '#src/server/common/helpers/defraid-login/session-cache.js'
import { generateBackLink } from '#src/server/defraid-post-login/guidance-org/utils.js'

export const GUIDANCE_ORG_VIEW_ROUTE = 'defraid-post-login/guidance-org/index'

const PAGE_HEADING = 'Exempt activity notification for an organisation'

export const guidanceOrgController = {
  async handler(request, h) {
    const { accountManagementUrl } = config.get('defraId')

    const confirmIndividual = await postloginUserSession.get({
      request,
      key: 'confirmIndividual'
    })
    const confirmEmployee = await postloginUserSession.get({
      request,
      key: 'confirmEmployee'
    })
    const confirmAgent = await postloginUserSession.get({
      request,
      key: 'confirmAgent'
    })

    const userTypeIndividual = confirmIndividual === 'no'
    const userTypeEmployee = confirmEmployee === 'organisation'
    const userTypeAgent = confirmAgent === 'organisation'

    const userShouldNotSeePage =
      !userTypeIndividual && !userTypeEmployee && !userTypeAgent

    if (userShouldNotSeePage) {
      return h.redirect(routes.EXEMPTION)
    }

    return h.view(GUIDANCE_ORG_VIEW_ROUTE, {
      pageTitle: PAGE_HEADING,
      heading: PAGE_HEADING,
      accountManagementUrl,
      signOutUrl: routes.SIGN_OUT,
      backLink: generateBackLink({ userTypeIndividual, userTypeEmployee })
    })
  }
}
