import { MARINE_LICENCE_KEY } from '#src/server/common/constants/marine-licence.js'
import { faker } from '@faker-js/faker'
import { PROJECT_STATUS } from '#src/server/common/constants/projects.js'

export const mockMarineLicenceTaskList = {
  projectName: 'COMPLETED',
  specialLegalPowers: 'COMPLETED',
  otherAuthorities: 'COMPLETED',
  harbourAuthority: 'COMPLETED',
  siteDetails: 'COMPLETED',
  preferredDates: 'COMPLETED',
  projectBackground: 'COMPLETED',
  publicRegister: 'COMPLETED',
  publicConsultation: 'COMPLETED',
  waterFrameworkDirective: 'COMPLETED',
  feeEstimate: 'COMPLETED',
  invoicing: 'COMPLETED'
}

export const mockEmptyActivityDetails = {
  activityType: '',
  activitySubType: '',
  activities: {},
  activityDescription: '',
  activityDuration: '',
  completionDate: {},
  activityMonths: {},
  workingHours: ''
}

export const mockActivityDetails = {
  activityType: 'construction',
  activitySubType: 'construction-type-1',
  activities: { selections: ['CON1'] },
  activityDescription: 'Test description',
  completionDate: { date: 'yes', reason: 'Test completion' },
  activityDuration: { years: 1, months: 4 },
  activityMonths: { months: 'yes', details: 'Test months' },
  workingHours: 'Test hours'
}

export const mockOutputActivityDetails = {
  ...mockActivityDetails,
  activityType: 'Construction of new works',
  activityDuration: '1 year, 4 months',
  completionDate: mockActivityDetails.completionDate.reason,
  activityMonths: mockActivityDetails.activityMonths.details
}

export const mockOutputEmptyActivityDetails = {
  ...mockEmptyActivityDetails,
  completionDate: null,
  activityMonths: null
}

export const waterFrameworkDirective = {
  nauticalMile: 'yes',
  excludedActivities: 'no',
  uploadedFile: {
    filename: 'test-upload-id'
  },
  s3Location: {
    checksumSha256: 'test-checksum',
    s3Bucket: 'test-bucket',
    s3Key: 'test-key'
  }
}

export const mockMarinePlanPolicies = [
  { policyCode: 'S-CC-2', policy: 'Second policy wording.' },
  { policyCode: 'S-CC-1', policy: 'First policy wording.' }
]

export const mockMarinePlanPolicyResponses = {
  'S-CC-1': 'My first consideration.',
  'S-CC-2': 'My second consideration.'
}

export const mockMarineLicenceApplication = {
  id: faker.database.mongodbObjectId(),
  projectName: 'Test Project',
  projectBackground: 'Test project background',
  feeEstimate: {
    termsAndConditions: 'true',
    accept: 'yes',
    feeBand: '2A'
  },
  specialLegalPowers: { agree: 'yes', details: 'Test reason' },
  harbourAuthority: { details: 'Harbour details', area: 'yes' },
  invoicing: {
    invoiceAddressType: 'uk',
    invoiceAddress: {
      addressLine1: '123 Example Street',
      addressLine2: 'Flat 2',
      addressTown: 'Example town',
      addressCounty: 'Example country',
      addressPostcode: 'AA1 1AA'
    },
    invoiceContactDetails: {
      fullName: 'Jon Doe',
      organisationName: 'Example Organisation',
      phoneNumber: '0191 111 1111',
      emailAddress: 'john.doe@example.com'
    },
    purchaseOrderDetails: {
      requiresPurchaseOrder: 'yes',
      purchaseOrderNumber: 'PO-12345'
    }
  },
  publicConsultation: {
    consulted: 'yes',
    details: 'Consulted with local fishing group'
  },
  taskList: mockMarineLicenceTaskList,
  siteDetailsConfirmed: true,
  siteDetailsDataComplete: true,
  preferredDates: {
    start: { month: '07', year: '2026' },
    end: { month: '08', year: '2027' }
  },
  projectType: MARINE_LICENCE_KEY,
  siteDetails: [
    {
      activityDetails: [mockActivityDetails, mockActivityDetails],
      coordinatesType: 'file',
      fileUploadType: 'kml',
      siteName: 'test site name',
      featureCount: 1,
      uploadedFile: {
        filename: 'test-upload-id'
      },
      s3Location: {
        checksumSha256: 'test-checksum',
        s3Bucket: 'test-bucket',
        s3Key: 'test-key'
      },
      geoJSON: {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [
                [
                  [-1.2345, 50.9876],
                  [-1.2335, 50.9876],
                  [-1.2335, 50.9886],
                  [-1.2345, 50.9886],
                  [-1.2345, 50.9876]
                ]
              ]
            }
          }
        ]
      }
    }
  ],
  waterFrameworkDirective,
  marinePlanPolicies: mockMarinePlanPolicies,
  marinePlanPolicyResponses: mockMarinePlanPolicyResponses
}

export const mockSubmittedMarineLicenceApplication = {
  ...mockMarineLicenceApplication,
  status: 'Submitted',
  applicationReference: 'MLA/2026/10264'
}

export const mockTransferredMarineLicenceApplication = {
  ...mockMarineLicenceApplication,
  status: PROJECT_STATUS.TRANSFERRED,
  applicationReference: 'MLA/2026/10264'
}

export const mockMarineLicenceWithMarinePlanPolicies = {
  ...mockMarineLicenceApplication,
  marinePlanPolicyJob: 'ready',
  marinePlanPoliciesCount: 3,
  marinePlanPolicies: [
    { policyCode: 'SW-MPA-1', policy: 'Marine protected area policy wording.' },
    { policyCode: 'SW-AGG-2', policy: 'Aggregates policy wording.' },
    { policyCode: 'SW-BIO-1', policy: 'Biodiversity policy wording.' }
  ]
}

export const mockFileUploadMarineLicence = {
  ...mockMarineLicenceApplication,
  siteDetails: [
    {
      activityDetails: [mockActivityDetails],
      coordinatesType: 'file',
      fileUploadType: 'kml',
      siteName: 'test site name',
      uploadedFile: {
        filename: 'test-upload-id'
      },
      s3Location: {
        checksumSha256: 'test-checksum',
        s3Bucket: 'test-bucket',
        s3Key: 'test-key'
      },
      geoJSON: {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [
                [
                  [-1.2345, 50.9876],
                  [-1.2335, 50.9876],
                  [-1.2335, 50.9886],
                  [-1.2345, 50.9886],
                  [-1.2345, 50.9876]
                ]
              ]
            }
          }
        ]
      }
    }
  ]
}

export const mockManualCoordinatesMarineLicence = {
  ...mockMarineLicenceApplication,
  siteDetails: [
    {
      coordinatesType: 'coordinates',
      siteName: 'Test site name'
    }
  ]
}

export const mockCircularMarineLicence = {
  ...mockMarineLicenceApplication,
  siteDetails: [
    {
      coordinatesType: 'coordinates',
      coordinatesEntry: 'single',
      coordinateSystem: 'wgs84',
      coordinates: { latitude: '55.123456', longitude: '55.123456' },
      circleWidth: '100',
      siteName: 'Circular Test Site'
    }
  ]
}

export const mockPolygonMarineLicence = {
  ...mockMarineLicenceApplication,
  siteDetails: [
    {
      coordinatesType: 'coordinates',
      coordinatesEntry: 'multiple',
      coordinateSystem: 'wgs84',
      coordinates: [
        { latitude: '55.123456', longitude: '55.123456' },
        { latitude: '33.987654', longitude: '33.987654' },
        { latitude: '78.123456', longitude: '78.123456' }
      ],
      siteName: 'Polygon Test Site'
    }
  ]
}
