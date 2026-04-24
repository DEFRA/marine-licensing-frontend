const ENTER_WIDTH = 'Enter the width of the circular site in metres'

export const WIDTH_OF_SITE_VIEW_ROUTE = 'templates/width-of-site'

export const widthOfSiteSettings = {
  pageTitle: ENTER_WIDTH,
  heading: ENTER_WIDTH
}

export const widthOfSiteErrorMessages = {
  WIDTH_REQUIRED: ENTER_WIDTH,
  WIDTH_INVALID: 'The width of the circular site must be a number',
  WIDTH_MIN: 'The width of the circular site must be 1 metre or more',
  WIDTH_NON_INTEGER:
    'The width of the circular site must be a whole number, like 10'
}
