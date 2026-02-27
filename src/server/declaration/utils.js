import {
  routes,
  marineLicenceRoutes
} from '#src/server/common/constants/routes.js'
import { PROJECT_TYPE } from '#src/server/common/constants/projects.js'

export const getBackLink = (type) => {
  if (type === PROJECT_TYPE.EXEMPTION) {
    return routes.CHECK_YOUR_ANSWERS
  }
  return marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS
}
