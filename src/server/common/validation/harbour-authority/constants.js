const HARBOUR_AUTHORITY_TITLE =
  'Is your project located in a harbour authority area?'

export const HARBOUR_AUTHORITY_MAP_URL =
  'https://defra.maps.arcgis.com/apps/webappviewer/index.html?id=28f91021979447d3b43dc83e6e93094c&showLayers=Navigation'

export const harbourAuthoritySettings = {
  pageTitle: HARBOUR_AUTHORITY_TITLE,
  heading: HARBOUR_AUTHORITY_TITLE,
  mapUrl: HARBOUR_AUTHORITY_MAP_URL
}

export const harbourAuthorityErrorMessages = {
  HARBOUR_AUTHORITY_REQUIRED:
    'Select whether your project is located in a harbour authority area',
  HARBOUR_AUTHORITY_AREA_REQUIRED: 'Enter details of the harbour authority',
  HARBOUR_AUTHORITY_AREA_MAX_LENGTH:
    'Details of the harbour authority must be 1000 characters or fewer'
}
