import { getByRole, getByText } from '@testing-library/dom'
import { marineLicenceRoutes } from '~/src/server/common/constants/routes.js'
import {
  mockMarineLicence,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import { loadPage } from '~/tests/integration/shared/app-server.js'

describe('Water Framework Directive before you start page (marine licence)', () => {
  const getServer = setupTestServer()
  const marineLicence = {
    id: 'test-marine-licence-123',
    projectName: 'Test Marine Project'
  }

  test('should display the correct content', async () => {
    mockMarineLicence(marineLicence)

    const document = await loadPage({
      requestUrl:
        marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_BEFORE_YOU_START,
      server: getServer()
    })

    expect(
      getByRole(document, 'heading', { name: 'Water Framework Directive' })
    ).toBeInTheDocument()
    expect(getByText(document, marineLicence.projectName)).toBeInTheDocument()
    expect(
      getByRole(document, 'heading', { name: 'Before you start' })
    ).toBeInTheDocument()
    expect(
      getByRole(document, 'heading', { name: 'Excluded activities' })
    ).toBeInTheDocument()
    expect(
      getByRole(document, 'heading', { name: 'Previous WFD assessment' })
    ).toBeInTheDocument()
    expect(
      getByRole(document, 'heading', { name: 'Uploading your assessment' })
    ).toBeInTheDocument()
    expect(
      getByText(
        document,
        "The Water Framework Directive (WFD) protects the quality of estuarine and coastal waters. Its aim is to make sure all water bodies reach or maintain 'good' status."
      )
    ).toBeInTheDocument()
    expect(
      getByText(
        document,
        'if your project is within one nautical mile (1.85km) of the coast'
      )
    ).toBeInTheDocument()
    expect(
      getByText(document, 'Help with excluded activities')
    ).toBeInTheDocument()
    expect(
      getByText(
        document,
        'You may not need to complete a new WFD assessment if you carried out the same activity at the same location, between 2015 and 2022 and already have an assessment.'
      )
    ).toBeInTheDocument()
    expect(
      getByText(
        document,
        'You will need to upload a WFD assessment as part of your application if:'
      )
    ).toBeInTheDocument()
  })

  test('should have correct navigation links', async () => {
    mockMarineLicence(marineLicence)

    const document = await loadPage({
      requestUrl:
        marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_BEFORE_YOU_START,
      server: getServer()
    })

    expect(getByRole(document, 'button', { name: 'Continue' })).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_NAUTICAL_MILES
    )
    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    )
  })
})
