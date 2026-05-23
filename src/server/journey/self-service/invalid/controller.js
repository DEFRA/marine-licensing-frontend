import { routes } from '#src/server/common/constants/routes.js'

const VIEW_PATH = 'journey/self-service/invalid/index'

export const invalidController = {
  handler(_request, h) {
    return h.view(VIEW_PATH, {
      pageTitle: 'This check has expired or could not be found',
      startUrl: routes.IAT_START
    })
  }
}
