import { guidanceOrgController } from '#src/server/defraid-post-login/guidance-org/controller.js'
import { routes } from '#src/server/common/constants/routes.js'

export const guidanceOrgRoutes = [
  {
    method: 'GET',
    path: routes.postLogin.GUIDANCE_ORG,
    ...guidanceOrgController
  }
]
