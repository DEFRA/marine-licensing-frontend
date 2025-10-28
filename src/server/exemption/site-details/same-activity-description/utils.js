import { routes } from '#src/server/common/constants/routes.js'

export const getBackLink = (exemption, siteDetails, action) => {
  if (action) {
    return routes.REVIEW_SITE_DETAILS
  }

  if (
    siteDetails.coordinatesType === 'file' &&
    exemption.multipleSiteDetails.sameActivityDates === 'no'
  ) {
    return routes.SAME_ACTIVITY_DATES
  }

  return routes.ACTIVITY_DATES
}

export const answerChangedFromNoToYes = (previousAnswer, payload) =>
  previousAnswer === 'no' && payload.sameActivityDescription === 'yes'

export const answerChangedFromYesToNo = (previousAnswer, payload) =>
  previousAnswer === 'yes' && payload.sameActivityDescription === 'no'
