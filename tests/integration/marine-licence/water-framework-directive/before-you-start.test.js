import { getAllByText, getByRole, getByText } from '@testing-library/dom'
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
      getByRole(document, 'heading', { name: 'Previous WFD assessments' })
    ).toBeInTheDocument()
    expect(
      getByRole(document, 'heading', { name: 'Providing a WFD assessment' })
    ).toBeInTheDocument()
    expect(
      getByText(
        document,
        "The Water Framework Directive (WFD) protects the quality of estuarine and coastal waters. Its aim is to make sure all water bodies reach or maintain 'good' status."
      )
    ).toBeInTheDocument()
    expect(
      getAllByText(
        document,
        'your project is within one nautical mile (1.85km) of the low water line, or in a tidal river or estuary - including the shore between low and high tide'
      )
    ).toHaveLength(2)
    expect(
      getByText(document, 'Help with excluded activities')
    ).toBeInTheDocument()
    expect(
      getByText(
        document,
        'You can provide a previous WFD assessment for the same activity in the same location, but it must be up to date.'
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
      marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_NAUTICAL_MILE
    )
    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    )
  })
})
