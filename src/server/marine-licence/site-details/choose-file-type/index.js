import {
  chooseFileTypeController,
  chooseFileTypeSubmitController
} from '#src/server/marine-licence/site-details/choose-file-type/controller.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const chooseFileTypeRoutes = [
  {
    method: 'GET',
    path: marineLicenceRoutes.MARINE_LICENCE_CHOOSE_FILE_UPLOAD_TYPE,
    ...chooseFileTypeController
  },
  {
    method: 'POST',
    path: marineLicenceRoutes.MARINE_LICENCE_CHOOSE_FILE_UPLOAD_TYPE,
    ...chooseFileTypeSubmitController
  }
]
