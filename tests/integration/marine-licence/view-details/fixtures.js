import { mockSubmittedMarineLicenceApplication } from '~/src/server/test-helpers/mocks/marine-licence-mocks.js'

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
