import { routes } from '#src/server/common/constants/routes.js'

const backLink = routes.defraIdGuidance.CHECK_SETUP_CLIENT
const title = 'You need to be added to your client\u2019s Defra account'
const viewData = {
  pageTitle: title,
  heading: title,
  backLink
}
export const pathToPageTemplate = 'defraid-guidance/add-to-client-account/index'

export const defraIdGuidanceAddToClientAccountController = {
  handler(_request, h) {
    return h.view(pathToPageTemplate, viewData)
  }
}
