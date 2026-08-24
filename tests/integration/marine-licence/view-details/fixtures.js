import {
  mockSubmittedMarineLicenceApplication,
  mockTransferredMarineLicenceApplication
} from '~/src/server/test-helpers/mocks/marine-licence-mocks.js'
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

export const expectedApplicationDetailsCard = {
  cardTitle: 'Application details',
  rows: [
    {
      key: 'Application type',
      value: 'Marine licence application'
    },
    {
      key: 'Reference number',
      value: mockTransferredMarineLicenceApplication.applicationReference
    },
    {
      key: 'Date submitted',
      value: '26 May 2026'
    }
  ]
}

export const expectedTransferredApplicationDetailsCard = {
  ...expectedApplicationDetailsCard,
  rows: [
    ...expectedApplicationDetailsCard.rows,
    {
      key: 'Status',
      value: 'Transferred'
    },
    {
      key: 'Date of transfer',
      value: '26 Jun 2026'
    }
  ]
}

export const expectedRejectedApplicationDetailsCard = {
  ...expectedApplicationDetailsCard,
  rows: [
    ...expectedApplicationDetailsCard.rows,
    {
      key: 'Status',
      value: 'Unable to progress'
    },
    {
      key: 'Date marked as unable to progress',
      value: '26 Jul 2026'
    },
    {
      key: 'Reasons marked as unable to progress',
      value:
        'Site location Water Framework Directive The site location entered indicated that it was within 1 nautical mile of the coast but no Water Framework Directive assessment was uploaded. Check the site location and if it meets the requirements for a WFD assessment.'
    }
  ]
}

export const expectedApplicantActivityCards = [
  {
    rows: [
      {
        key: 'Type of activity',
        value: 'Construction of new marine works'
      },
      {
        key: "What you're constructing",
        value: 'Aquaculture trestles or fixed walkways'
      }
    ]
  },
  {
    rows: [
      {
        key: 'Type of activity',
        value: 'Continuation of existing deposit activity'
      },
      {
        key: "What deposit activity you're continuing",
        value: 'Alternative use of dredged material – beach management'
      }
    ]
  }
]

export const expectedExternalActivityCards = [
  {
    rows: [
      {
        key: 'Type of activity',
        value: 'Construction of new marine works'
      },
      {
        key: 'What is being constructed',
        value: 'Aquaculture trestles or fixed walkways'
      }
    ]
  },
  {
    rows: [
      {
        key: 'Type of activity',
        value: 'Continuation of existing deposit activity'
      },
      {
        key: 'What deposit activity is being continued',
        value: 'Alternative use of dredged material – beach management'
      }
    ]
  }
]

export const expectedProjectDetailsCard = {
  cardTitle: 'Project details',
  rows: [
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

export const expectedOtherPermissionsCard = {
  cardTitle: 'Other permissions',
  rows: [
    {
      key: 'Located in a harbour authority area',
      value: mockSubmittedMarineLicenceApplication.harbourAuthority.details
    }
  ]
}

export const expectedFeeEstimateCard = {
  cardTitle: 'Fee estimate',
  rows: [
    {
      key: 'Maximum application fee estimate accepted',
      value:
        '£1,400 (Does not include potential post-consent monitoring of up to £750)'
    }
  ]
}

export const expectedPublicRegisterCard = {
  cardTitle: 'Public register card',
  rows: [
    {
      key: 'Consent to publish project information',
      value: 'No'
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
