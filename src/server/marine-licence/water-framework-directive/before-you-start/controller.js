import { getMarineLicenceCache } from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const WATER_FRAMEWORK_DIRECTIVE_BEFORE_YOU_START_VIEW_ROUTE =
  'marine-licence/water-framework-directive/before-you-start/index'

const waterFrameworkDirectiveBeforeYouStartSettings = {
  backLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST,
  cancelLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST,
  continueLink:
    marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_BEFORE_YOU_START,
  pageTitle: 'Water Framework Directive',
  heading: 'Water Framework Directive'
}

export const waterFrameworkDirectiveBeforeYouStartController = {
  async handler(request, h) {
    const marineLicence = getMarineLicenceCache(request)

    return h.view(WATER_FRAMEWORK_DIRECTIVE_BEFORE_YOU_START_VIEW_ROUTE, {
      ...waterFrameworkDirectiveBeforeYouStartSettings,
      projectName: marineLicence.projectName
    })
  }
}
