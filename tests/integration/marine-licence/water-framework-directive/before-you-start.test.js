import { getByRole, getByText, queryByText } from '@testing-library/dom'
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
      getByRole(document, 'heading', {
        name: 'Getting a WFD assessment template'
      })
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
        'your proposed works are within one nautical mile (1.85km) of the low water line, or in a tidal river or estuary - including the shore between low and high tide'
      )
    ).toBeInTheDocument()
    expect(
      queryByText(
        document,
        'your project is within one nautical mile (1.85km) of the low water line, or in a tidal river or estuary - including the shore between low and high tide'
      )
    ).not.toBeInTheDocument()
    expect(
      getByText(
        document,
        'Some activities do not need a WFD assessment, even if the proposed works are within one nautical mile (1.85km) of the low water line, or in a tidal river or estuary - including the shore between low and high tide.'
      )
    ).toBeInTheDocument()
    expect(
      getByText(
        document,
        'You do not need to provide a WFD assessment if your proposed works are limited to one of the following activities:'
      )
    ).toBeInTheDocument()
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
        "If you need to provide a WFD assessment, you can use the following template. It's called a scoping document."
      )
    ).toBeInTheDocument()
  })

  test('should link to the scoping document template and the guidance', async () => {
    mockMarineLicence(marineLicence)

    const document = await loadPage({
      requestUrl:
        marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_BEFORE_YOU_START,
      server: getServer()
    })

    const templateLink = getByRole(document, 'link', {
      name: 'Download the WFD assessment scoping document (ODT, 24KB)'
    })
    expect(templateLink).toHaveAttribute(
      'href',
      'https://assets.publishing.service.gov.uk/media/6ab4e3b9fceb6fb3a650110e/wfd_scoping_template__1_.odt'
    )

    const guidanceLink = getByRole(document, 'link', {
      name: "Read the Environment Agency's guidance on the Water Framework Directive assessments for more information (opens in new tab)"
    })
    expect(guidanceLink).toHaveAttribute(
      'href',
      'https://www.gov.uk/guidance/water-framework-directive-assessment-estuarine-and-coastal-waters'
    )
    expect(guidanceLink).toHaveAttribute('target', '_blank')
    expect(guidanceLink).toHaveAttribute('rel', 'noreferrer noopener')
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
