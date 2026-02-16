import { config } from '#src/config/config.js'
import { routes } from '#src/server/common/constants/routes.js'
import { USER_TYPES } from '#src/server/common/constants/user-types.js'
import { postloginUserSession } from '#src/server/common/helpers/defraid-login/session-cache.js'

export const GUIDANCE_INDIVIDUAL_VIEW_ROUTE =
  'defraid-post-login/guidance-individual/index'

const viewContent = {
  pageTitle: 'Exempt activity notification for an individual'
}

export const guidanceIndividualController = {
  async handler(request, h) {
    const { accountManagementUrl } = config.get('defraId')

    const confirmEmployee = await postloginUserSession.get({
      request,
      key: 'confirmEmployee'
    })

    const isUserEmployeeOrAgent = confirmEmployee
      ? USER_TYPES.EMPLOYEE
      : USER_TYPES.AGENT

    return h.view(GUIDANCE_INDIVIDUAL_VIEW_ROUTE, {
      ...viewContent,
      accountManagementUrl,
      heading: 'Exempt activity notification for an individual',
      backLink:
        isUserEmployeeOrAgent === USER_TYPES.EMPLOYEE
          ? routes.postLogin.CONFIRM_EMPLOYEE
          : routes.postLogin.CONFIRM_AGENT
    })
  }
}
