import {
  getExemptionCache,
  updateExemptionSiteDetails
} from '~/src/server/common/helpers/session-cache/utils.js'
import { getSiteDetailsBySite } from '~/src/server/common/helpers/session-cache/site-utils.js'
import {
  errorDescriptionByFieldName,
  mapErrorsForDisplay
} from '~/src/server/common/helpers/errors.js'
import { circleWidthValidationSchema } from '~/src/server/common/schemas/circle-width.js'

import { routes } from '~/src/server/common/constants/routes.js'

export const WIDTH_OF_SITE_VIEW_ROUTE =
  'exemption/site-details/width-of-site/index'

const ENTER_WIDTH = 'Enter the width of the circular site in metres'

const widthOfSiteSettings = {
  pageTitle: ENTER_WIDTH,
  heading: ENTER_WIDTH,
  backLink: routes.CIRCLE_CENTRE_POINT
}

export const errorMessages = {
  WIDTH_REQUIRED: ENTER_WIDTH,
  WIDTH_INVALID: 'The width of the circular site must be a number',
  WIDTH_MIN: 'The width of the circular site must be 1 metre or more',
  WIDTH_NON_INTEGER:
    'The width of the circular site must be a whole number, like 10'
}

/**
 * A GDS styled page controller for the width of site page.
 * @satisfies {Partial<ServerRoute>}
 */
export const widthOfSiteController = {
  handler(request, h) {
    const exemption = getExemptionCache(request)
    const siteDetails = getSiteDetailsBySite(exemption)

    return h.view(WIDTH_OF_SITE_VIEW_ROUTE, {
      ...widthOfSiteSettings,
      projectName: exemption.projectName,
      payload: {
        width: siteDetails.circleWidth
      }
    })
  }
}

/**
 * A GDS styled page controller for the POST route in the width of site page.
 * @satisfies {Partial<ServerRoute>}
 */
export const widthOfSiteSubmitController = {
  options: {
    validate: {
      payload: circleWidthValidationSchema,
      failAction: (request, h, err) => {
        const { payload } = request
        const { projectName } = getExemptionCache(request)

        if (!err.details) {
          return h
            .view(WIDTH_OF_SITE_VIEW_ROUTE, {
              ...widthOfSiteSettings,
              payload,
              projectName
            })
            .takeover()
        }

        const errorSummary = mapErrorsForDisplay(err.details, errorMessages)
        const errors = errorDescriptionByFieldName(errorSummary)

        return h
          .view(WIDTH_OF_SITE_VIEW_ROUTE, {
            ...widthOfSiteSettings,
            payload,
            projectName,
            errors,
            errorSummary
          })
          .takeover()
      }
    }
  },
  handler(request, h) {
    const { payload } = request

    updateExemptionSiteDetails(request, 0, 'circleWidth', payload.width)

    return h.redirect(routes.REVIEW_SITE_DETAILS)
  }
}
