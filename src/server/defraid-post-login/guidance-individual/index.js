import { guidanceIndividualController } from '#src/server/defraid-post-login/guidance-individual/controller.js'
import { routes } from '#src/server/common/constants/routes.js'

export const guidanceIndividualRoutes = [
  {
    method: 'GET',
    path: routes.postLogin.GUIDANCE_INDIVIDUAL,
    ...guidanceIndividualController
  }
]
