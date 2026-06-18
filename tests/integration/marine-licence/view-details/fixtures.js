import { mockSubmittedMarineLicenceApplication } from '~/src/server/test-helpers/mocks/marine-licence-mocks.js'
import {
  NAUTICAL_MILE_HEADING,
  EXCLUDED_ACTIVITIES_HEADING,
  PREVIOUS_ASSESSMENT_HEADING,
  ASSESSMENT_CHANGED_HEADING,
  FILE_UPLOAD_HEADING
} from '~/src/server/common/helpers/marine-licence/water-framework-directive/water-framework-review-data.js'

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

export const expectedWaterFrameworkDirectiveCard = {
  waterFrameworkDirective: {
    [NAUTICAL_MILE_HEADING]: 'Yes',
    [EXCLUDED_ACTIVITIES_HEADING]: 'No',
    [PREVIOUS_ASSESSMENT_HEADING]: 'Yes',
    [ASSESSMENT_CHANGED_HEADING]: 'No',
    [FILE_UPLOAD_HEADING]: 'test-upload-id'
  }
}
