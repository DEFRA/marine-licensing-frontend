import { COORDINATE_SYSTEMS } from '~/src/server/common/constants/exemptions.js'

export const baseSubmittedExemption = {
  id: '507f1f77bcf86cd799439011',
  status: 'Submitted',
  applicationReference: 'EXE/2025/00003',
  submittedAt: '2025-01-01T10:00:00.000Z',
  projectName: 'Test Marine Activity Project',
  activityDates: {
    start: '2025-06-15T00:00:00.000Z',
    end: '2025-08-30T00:00:00.000Z'
  },
  activityDescription:
    'Marine construction activities including pile driving and dredging operations.',
  publicRegister: {
    consent: 'no'
  },
  multipleSiteDetails: {
    multipleSitesEnabled: false
  }
}

export const createSubmittedExemption = (overrides = {}) => ({
  ...baseSubmittedExemption,
  ...overrides
})

export const createExemptionWithSiteDetails = (overrides = {}) => {
  const { siteDetails: siteDetailsOverrides = {}, ...otherOverrides } =
    overrides

  return createSubmittedExemption({
    siteDetails: [
      {
        coordinatesType: 'coordinates',
        coordinatesEntry: 'single',
        coordinateSystem: COORDINATE_SYSTEMS.WGS84,
        coordinates: { latitude: '51.489676', longitude: '-0.231530' },
        circleWidth: '100',
        activityDates: {
          startDate: { day: '1', month: '1', year: '2025' },
          endDate: { day: '31', month: '1', year: '2025' }
        },
        activityDescription: 'Test activity description',
        ...siteDetailsOverrides
      }
    ],
    ...otherOverrides
  })
}

export const createFileUploadExemption = (
  fileType = 'kml',
  filename = 'test.kml',
  additionalOverrides = {}
) =>
  createExemptionWithSiteDetails({
    coordinatesType: 'file',
    fileUploadType: fileType,
    uploadedFile: { filename },
    geoJSON: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [51.5074, -0.1278]
          }
        }
      ]
    },
    ...additionalOverrides
  })

export const errorScenarios = {
  draftExemption: {
    ...baseSubmittedExemption,
    status: 'Draft',
    applicationReference: null
  },
  exemptionWithoutReference: {
    ...baseSubmittedExemption,
    status: 'Submitted',
    applicationReference: null
  },
  exemptionWithEmptyReference: {
    ...baseSubmittedExemption,
    status: 'Submitted',
    applicationReference: ''
  },
  exemptionWithoutSiteDetails: {
    ...baseSubmittedExemption,
    siteDetails: [null]
  },
  exemptionWithMalformedSiteDetails: {
    ...baseSubmittedExemption,
    siteDetails: [
      {
        invalidStructure: true,
        activityDates: {
          startDate: { day: '1', month: '1', year: '2025' },
          endDate: { day: '31', month: '1', year: '2025' }
        },
        activityDescription: 'Test activity description'
      }
    ]
  }
}
