import { COORDINATE_SYSTEMS } from '#src/server/common/constants/coordinate-systems.js'

export const COORDINATE_SYSTEM_VIEW_ROUTES = {
  [COORDINATE_SYSTEMS.WGS84]: 'templates/centre-coordinates/wgs84',
  [COORDINATE_SYSTEMS.OSGB36]: 'templates/centre-coordinates/osgb36'
}

export const centreCoordinatesSettings = {
  pageTitle: 'Enter the coordinates at the centre point of the site',
  heading: 'Enter the coordinates at the centre point of the site'
}

export const centreCoordinatesErrorMessages = {
  [COORDINATE_SYSTEMS.WGS84]: {
    LATITUDE_REQUIRED: 'Enter the latitude',
    LATITUDE_LENGTH: 'Latitude must be between -90 and 90',
    LATITUDE_NON_NUMERIC: 'Latitude must be a number',
    LATITUDE_DECIMAL_PLACES:
      'Latitude must include 6 decimal places, like 55.019889',
    LONGITUDE_REQUIRED: 'Enter the longitude',
    LONGITUDE_LENGTH: 'Longitude must be between -180 and 180',
    LONGITUDE_NON_NUMERIC: 'Longitude must be a number',
    LONGITUDE_DECIMAL_PLACES:
      'Longitude must include 6 decimal places, like -1.399500'
  },
  [COORDINATE_SYSTEMS.OSGB36]: {
    EASTINGS_REQUIRED: 'Enter the easting',
    EASTINGS_NON_NUMERIC: 'Easting must be a number',
    EASTINGS_LENGTH: 'Easting must be 6 digits',
    EASTINGS_POSITIVE_NUMBER:
      'Easting must be a positive 6-digit number, like 123456',
    NORTHINGS_REQUIRED: 'Enter the northing',
    NORTHINGS_NON_NUMERIC: 'Northing must be a number',
    NORTHINGS_LENGTH: 'Northing must be 6 or 7 digits',
    NORTHINGS_POSITIVE_NUMBER:
      'Northing must be a positive 6 or 7-digit number, like 123456'
  }
}
