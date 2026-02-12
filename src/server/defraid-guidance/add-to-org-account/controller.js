import { routes } from '#src/server/common/constants/routes.js'

const backLink = routes.defraIdGuidance.CHECK_SETUP_EMPLOYEE
const title = 'You need to be added to your organisation\u2019s Defra account'
const viewData = {
  pageTitle: title,
  heading: title,
  backLink
}
export const pathToPageTemplate = 'defraid-guidance/add-to-org-account/index'

export const defraIdGuidanceAddToOrgAccountController = {
  handler(_request, h) {
    return h.view(pathToPageTemplate, viewData)
  }
}
