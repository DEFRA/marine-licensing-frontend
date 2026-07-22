import { mockSubmittedMarineLicenceApplication } from '~/src/server/test-helpers/mocks/marine-licence-mocks.js'
import {
  NAUTICAL_MILE_HEADING,
  EXCLUDED_ACTIVITIES_HEADING,
  FILE_UPLOAD_HEADING
} from '~/src/server/common/helpers/marine-licence/water-framework-directive/water-framework-review-data.js'
import {
  ADDRESS_HEADING,
  ADDRESS_TYPE_HEADING,
  CONTACT_EMAIL,
  CONTACT_FULL_NAME,
  CONTACT_ORG_NAME,
  CONTACT_PHONE_NUMBER,
  PO_HEADING
} from '#src/server/common/helpers/marine-licence/invoicing/invoicing-review-data.js'

export const expectedProjectDetailsCard = {
  cardTitle: 'Project details',
  rows: [
    {
      key: 'Project name',
      value: mockSubmittedMarineLicenceApplication.projectName
    },
    {
      key: 'Project background',
      value: mockSubmittedMarineLicenceApplication.projectBackground
    },
    {
      key: 'Preferred start and end dates of the licence',
      value: 'July 2026 to August 2027'
    }
  ]
}

export const expectedSiteDetailsCard = {
  cardTitle: 'Providing the site location',
  rows: [
    {
      key: 'Location coordinates',
      value: 'Download coordinates as a csv file'
    }
  ]
}

export const expectedOtherPermissionsCard = {
  cardTitle: 'Other permissions',
  rows: [
    {
      key: 'Located in a harbour authority area',
      value: mockSubmittedMarineLicenceApplication.harbourAuthority.details
    }
  ]
}

export const expectedWaterFrameworkDirectiveCard = {
  waterFrameworkDirective: {
    [NAUTICAL_MILE_HEADING]: 'Yes',
    [EXCLUDED_ACTIVITIES_HEADING]: 'No',
    [FILE_UPLOAD_HEADING]: 'test-upload-id'
  }
}

export const expectedInvocingCardIndividualUser = {
  invoicingData: {
    [ADDRESS_TYPE_HEADING]: 'UK',
    [ADDRESS_HEADING]:
      '123 Example StreetFlat 2Example townExample countryAA1 1AA',
    [CONTACT_FULL_NAME]:
      mockSubmittedMarineLicenceApplication.invoicing.invoiceContactDetails
        .fullName,
    [CONTACT_PHONE_NUMBER]:
      mockSubmittedMarineLicenceApplication.invoicing.invoiceContactDetails
        .phoneNumber,
    [CONTACT_EMAIL]:
      mockSubmittedMarineLicenceApplication.invoicing.invoiceContactDetails
        .emailAddress
  }
}

export const expectedInvocingCardOrgUser = {
  invoicingData: {
    ...expectedInvocingCardIndividualUser.invoicingData,
    [CONTACT_ORG_NAME]:
      mockSubmittedMarineLicenceApplication.invoicing.invoiceContactDetails
        .organisationName,
    [PO_HEADING]:
      mockSubmittedMarineLicenceApplication.invoicing.purchaseOrderDetails
        .purchaseOrderNumber
  }
}
