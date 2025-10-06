import { routes } from '#src/server/common/constants/routes.js'
import {
  sameActivityDescriptionController,
  sameActivityDescriptionSubmitController
} from './controller.js'
export const sameActivityDescriptionRoutes = [
  {
    method: 'GET',
    path: routes.SAME_ACTIVITY_DESCRIPTION,
    ...sameActivityDescriptionController
  },
  {
    method: 'POST',
    path: routes.SAME_ACTIVITY_DESCRIPTION,
    ...sameActivityDescriptionSubmitController
  }
]
