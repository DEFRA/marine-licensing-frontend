import { faker } from '@faker-js/faker'
import { mcmsAnswersDownloadUrl } from './exemption-mocks'

export const mockMcmsContext = {
  activity: {
    code: 'DEPOSIT',
    label: 'Deposit of a substance or object',
    purpose: 'Scientific instruments and associated equipment',
    subType: 'scientificResearch'
  },
  articleCode: '17',
  pdfDownloadUrl: mcmsAnswersDownloadUrl,
  iatQueryString: '?activity=DEPOSIT&articleCode=17'
}

export const mockMarineLicenseApplication = {
  id: faker.database.mongodbObjectId(),
  projectName: 'Test Project',
  mcmsContext: mockMcmsContext
}
