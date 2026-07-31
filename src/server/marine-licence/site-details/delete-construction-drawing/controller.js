import Boom from '@hapi/boom'
import {
  apiRoutes,
  marineLicenceRoutes
} from '#src/server/common/constants/routes.js'
import { getMarineLicenceCache } from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { getSiteDataFromParam } from '#src/server/common/helpers/site-details/site-name.js'
import { validateSiteAndDrawingParams } from '#src/server/common/helpers/marine-licence/session-cache/site-utils.js'
import { authenticatedPatchRequest } from '#src/server/common/helpers/authenticated-requests.js'

export const DELETE_CONSTRUCTION_DRAWING_VIEW_ROUTE =
  'marine-licence/site-details/delete-construction-drawing/index'

const DELETE_CONSTRUCTION_DRAWING_PAGE_TITLE = (siteNumber, drawingNumber) =>
  `Are you sure you want to delete Site ${siteNumber} construction drawing ${drawingNumber}?`

export const deleteConstructionDrawingController = {
  options: {
    pre: [validateSiteAndDrawingParams]
  },
  handler(request, h) {
    const marineLicence = getMarineLicenceCache(request)
    const { siteNumber, siteIndex, drawingIndex, drawingNumber } =
      getSiteDataFromParam(request.query)

    if (drawingNumber === 1) {
      return h.redirect(marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS)
    }

    const heading = DELETE_CONSTRUCTION_DRAWING_PAGE_TITLE(
      siteNumber,
      drawingNumber
    )

    return h.view(DELETE_CONSTRUCTION_DRAWING_VIEW_ROUTE, {
      pageTitle: heading,
      heading,
      siteNumber,
      siteIndex,
      drawingIndex,
      drawingNumber,
      projectName: marineLicence.projectName,
      backLink: marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS,
      marineLicenceRoutes
    })
  }
}

export const deleteConstructionDrawingSubmitController = {
  options: {
    pre: [validateSiteAndDrawingParams]
  },
  async handler(request, h) {
    const marineLicence = getMarineLicenceCache(request)
    const { siteIndex, drawingIndex } = request.payload

    const parsedSiteIndex = Number.parseInt(siteIndex, 10)
    const parsedDrawingIndex = Number.parseInt(drawingIndex, 10)

    try {
      await authenticatedPatchRequest(
        request,
        apiRoutes.DELETE_CONSTRUCTION_DRAWING,
        {
          id: marineLicence.id,
          siteIndex: parsedSiteIndex,
          drawingIndex: parsedDrawingIndex
        }
      )

      return h.redirect(marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS)
    } catch (error) {
      request.logger.error(
        {
          err: error,
          event: {
            action: 'marine-licence:delete-construction-drawing-failed',
            reference: marineLicence.id,
            reason: `siteIndex=${parsedSiteIndex} drawingIndex=${parsedDrawingIndex}`
          }
        },
        'Error deleting construction drawing'
      )
      throw Boom.internal('Error deleting construction drawing')
    }
  }
}
