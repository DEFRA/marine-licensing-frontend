import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { locationCsvDownloadController } from '#src/server/marine-licence/location-csv-download/controller.js'

export const locationCsvDownloadRoutes = [
  {
    method: 'GET',
    path: `${marineLicenceRoutes.MARINE_LICENCE_CSV_DOWNLOAD}/{marineLicenceId}`,
    ...locationCsvDownloadController
  }
]
