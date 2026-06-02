import Boom from '@hapi/boom'
import { apiRoutes } from '#src/server/common/constants/routes.js'
import { authenticatedGetRequest } from '#src/server/common/helpers/authenticated-requests.js'
import { statusCodes } from '#src/server/common/constants/status-codes.js'

export const locationCsvDownloadController = {
  async handler(request, h) {
    const { marineLicenceId } = request.params
    const endpoint = apiRoutes.GENERATE_COORDINATES_CSV.replace(
      '{marineLicenceId}',
      marineLicenceId
    )

    try {
      const { res, payload } = await authenticatedGetRequest(
        request,
        endpoint,
        { json: false }
      )

      if (res.statusCode !== statusCodes.ok) {
        request.logger.error(
          {
            event: {
              action: 'marine-licence:location-csv-download-failed',
              reference: marineLicenceId,
              reason: `unexpected statusCode=${res.statusCode}`,
              outcome: 'failure'
            }
          },
          'Unexpected status code from CSV download endpoint'
        )

        throw Boom.internal('Failed to download CSV')
      }

      const contentDisposition = res.headers['content-disposition']

      return h
        .response(payload)
        .type('text/csv')
        .header('Content-Disposition', contentDisposition)
    } catch (error) {
      if (error.isBoom) {
        throw error
      }

      request.logger.error(error, 'Error downloading coordinates CSV')
      throw Boom.internal('Error downloading coordinates CSV')
    }
  }
}
