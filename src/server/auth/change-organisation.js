import {
  changeOrganisationQueryParam,
  redirectPathCacheKey,
  routes
} from '#src/server/common/constants/routes.js'

export const changeOrganisationController = {
  method: 'GET',
  path: routes.CHANGE_ORGANISATION,
  options: {
    auth: false
  },
  handler: (request, h) => {
    request.yar.flash(redirectPathCacheKey, routes.DASHBOARD, true)
    return h.redirect(`${routes.SIGNIN}?${changeOrganisationQueryParam}=true`)
  }
}
