import {
  chooseFileTypeController,
  chooseFileTypeSubmitController
} from '#src/server/exemption/site-details/choose-file-type/controller.js'
import { routes } from '#src/server/common/constants/routes.js'
export const chooseFileTypeRoutes = [
  {
    method: 'GET',
    path: routes.CHOOSE_FILE_UPLOAD_TYPE,
    ...chooseFileTypeController
  },
  {
    method: 'POST',
    path: routes.CHOOSE_FILE_UPLOAD_TYPE,
    options: {
      plugins: {
        crumb: true
      }
    },
    ...chooseFileTypeSubmitController
  }
]
