import { routes } from '#src/server/common/constants/routes.js'

export const SERVICE_HOME_VIEW_ROUTE = 'exemption/service-home/index'

const serviceHomeViewSettings = {
  pageTitle: 'Home',
  heading: 'Home'
}

const cards = [
  {
    title: 'View Projects',
    link: routes.DASHBOARD,
    description: 'View all of the existing projects in this account.'
  },
  {
    title: 'Check if I need a marine licence',
    link: 'https://marinelicensing.marinemanagement.org.uk/mmofox5/journey/self-service/start',
    description:
      "Find out if an activity needs a marine licence or if it's exempt."
  },
  {
    title: 'Sign in to the Marine Case Management System',
    link: 'https://marinelicensing.marinemanagement.org.uk/mmofox5/fox/live/MMO_LOGIN/login',
    description: 'View or manage projects not available in this account.'
  }
]

export const serviceHomeController = {
  handler(_request, h) {
    return h.view(SERVICE_HOME_VIEW_ROUTE, {
      ...serviceHomeViewSettings,
      cards
    })
  }
}
