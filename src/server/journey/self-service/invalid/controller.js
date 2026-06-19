import { routes } from '#src/server/common/constants/routes.js'

const VIEW_PATH = 'journey/self-service/invalid/index'

export const invalidController = {
  handler(_request, h) {
    return h.view(VIEW_PATH, {
      pageTitle: 'Your session has timed out',
      startUrl: routes.IAT_START
    })
  }
}
