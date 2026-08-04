import {
  applicationRejectedController,
  applicationRejectedSubmitController
} from '#src/server/marine-licence/application-rejected/controller.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const applicationRejectedRoutes = [
  {
    method: 'GET',
    path: `${marineLicenceRoutes.MARINE_LICENCE_APPLICATION_REJECTED}/{marineLicenceId}`,
    ...applicationRejectedController
  },
  {
    method: 'POST',
    path: `${marineLicenceRoutes.MARINE_LICENCE_APPLICATION_REJECTED}/{marineLicenceId}`,
    ...applicationRejectedSubmitController
  }
]
