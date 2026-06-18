import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { RETURN_TO_CACHE_KEY } from '#src/server/common/constants/cache.js'

export const getBackLink = (request, waterFrameworkDirective = {}) => {
  if (request.yar.get(RETURN_TO_CACHE_KEY)) {
    return `${marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS}#water-framework-directive-card`
  }

  const previousPage = request.headers?.referer

  if (previousPage && URL.canParse(previousPage)) {
    const url = new URL(previousPage)
    const previousPath = url.pathname

    if (previousPath === marineLicenceRoutes.MARINE_LICENCE_TASK_LIST) {
      return marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    }
  }

  const { excludedActivities } = waterFrameworkDirective

  if (excludedActivities === 'yes') {
    return marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_EXCLUDED_ACTIVITIES
  }

  return marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_FILE_UPLOAD
}
