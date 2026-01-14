import { routes } from '#src/server/common/constants/routes.js'
import { config } from '#src/config/config.js'

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

const filteredCards = [
  {
    title: 'Apply for a Marine License',
    link: routes.SERVICE_HOME
  }
]

export const serviceHomeController = {
  handler(_request, h) {
    const marineLicense = config.get('marineLicense')

    const displayCards = marineLicense.enabled
      ? [...cards.slice(0, 2), ...filteredCards, ...cards.slice(2)]
      : cards

    return h.view(SERVICE_HOME_VIEW_ROUTE, {
      ...serviceHomeViewSettings,
      cards: displayCards,
      marineLicenseEnabled: marineLicense.enabled
    })
  }
}
