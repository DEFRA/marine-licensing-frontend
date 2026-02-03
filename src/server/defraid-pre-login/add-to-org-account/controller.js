const backLink = '/prelogin/check-setup-employee'
const title = 'You need to be added to your organisation’s Defra account'
const viewData = {
  pageTitle: title,
  heading: title,
  backLink
}
export const pathToPageTemplate = 'defraid-pre-login/add-to-org-account/index'

export const preLoginAddToOrgAccountController = {
  handler(_request, h) {
    return h.view(pathToPageTemplate, viewData)
  }
}
