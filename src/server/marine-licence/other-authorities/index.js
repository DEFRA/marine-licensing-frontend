import {
  otherAuthoritiesController,
  otherAuthoritiesSubmitController
} from '#src/server/marine-licence/other-authorities/controller.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const otherAuthoritiesRoutes = [
  {
    method: 'GET',
    path: marineLicenceRoutes.MARINE_LICENCE_OTHER_AUTHORITIES,
    ...otherAuthoritiesController
  },
  {
    method: 'POST',
    path: marineLicenceRoutes.MARINE_LICENCE_OTHER_AUTHORITIES,
    ...otherAuthoritiesSubmitController
  }
]
