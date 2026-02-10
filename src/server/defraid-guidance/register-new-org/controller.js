import { routes } from '#src/server/common/constants/routes.js'

const backLink = routes.defraIdGuidance.CHECK_SETUP_EMPLOYEE
const title = 'Create a new Defra account for your organisation'
const viewData = {
  pageTitle: title,
  heading: title,
  backLink,
  signinUrl: routes.SIGNIN
}
export const pathToPageTemplate = 'defraid-guidance/register-new-org/index'

export const defraIdGuidanceRegisterNewOrgController = {
  handler(_request, h) {
    return h.view(pathToPageTemplate, viewData)
  }
}
