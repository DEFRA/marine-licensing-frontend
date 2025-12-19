export const SERVICE_HOME_VIEW_ROUTE = 'exemption/service-home/index'

const serviceHomeViewSettings = {
  pageTitle: 'Home',
  heading: 'Home'
}

export const serviceHomeController = {
  handler(request, h) {
    return h.view(SERVICE_HOME_VIEW_ROUTE, {
      ...serviceHomeViewSettings
    })
  }
}
