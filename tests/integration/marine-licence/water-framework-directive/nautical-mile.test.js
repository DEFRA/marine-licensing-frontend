import { getByRole, getByText } from '@testing-library/dom'
import { marineLicenceRoutes } from '~/src/server/common/constants/routes.js'
import {
  mockMarineLicence,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import { loadPage, submitForm } from '~/tests/integration/shared/app-server.js'
import { expectFieldsetError } from '~/tests/integration/shared/expect-utils.js'
import { getInputInFieldset } from '~/tests/integration/shared/dom-helpers.js'

describe('Water Framework Directive Nautical mile', () => {
  const getServer = setupTestServer()
  const marineLicence = {
    id: 'marine-licence-123',
    projectName: 'Test Marine Project',
    waterFrameworkDirective: { nauticalMile: undefined }
  }

  test('page elements', async () => {
    mockMarineLicence(marineLicence)

    const document = await loadPage({
      requestUrl:
        marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_NAUTICAL_MILE,
      server: getServer()
    })

    expect(getByText(document, 'Test Marine Project')).toBeInTheDocument()
    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_BEFORE_YOU_START
    )
    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Is your project within one nautical mile (1.85km) of the low-water line, or in a tidal river or estuary?'
    )

    expect(
      getByText(
        document,
        'This includes the shore between low and high tide, the sea up to one nautical mile (1.85km) out from the low-water line, and tidal areas such as docks, marinas and tidal rivers.'
      )
    ).toBeInTheDocument()

    expect(
      getByRole(document, 'img', {
        name: 'Diagram showing a site location in the water less than 1 nautical mile from the coast'
      })
    ).toBeInTheDocument()

    const lists = document.querySelectorAll('ul.govuk-list--bullet')
    const list = lists[0]
    const listLinks = list.querySelectorAll('li')
    expect(listLinks).toHaveLength(4)

    expect(
      getByRole(document, 'button', { name: 'Continue' })
    ).toBeInTheDocument()

    expect(getByRole(document, 'link', { name: 'Cancel' })).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    )

    expect(
      getByText(
        document,
        'Help with understanding the Water Framework Directive assessment area'
      )
    ).toBeInTheDocument()
  })

  test('form state when no decision set', async () => {
    mockMarineLicence(marineLicence)

    const document = await loadPage({
      requestUrl:
        marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_NAUTICAL_MILE,
      server: getServer()
    })

    expect(
      getInputInFieldset({
        document,
        fieldsetLabel:
          'Is your project within one nautical mile (1.85km) of the low-water line, or in a tidal river or estuary?',
        inputLabel: 'Yes',
        findByHeading: true
      })
    ).not.toBeChecked()
    expect(
      getInputInFieldset({
        document,
        fieldsetLabel:
          'Is your project within one nautical mile (1.85km) of the low-water line, or in a tidal river or estuary?',
        inputLabel: 'No',
        findByHeading: true
      })
    ).not.toBeChecked()
  })

  test('form state when decision is set to yes', async () => {
    mockMarineLicence({
      ...marineLicence,
      waterFrameworkDirective: { nauticalMile: 'yes' }
    })

    const document = await loadPage({
      requestUrl:
        marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_NAUTICAL_MILE,
      server: getServer()
    })

    expect(
      getInputInFieldset({
        document,
        fieldsetLabel:
          'Is your project within one nautical mile (1.85km) of the low-water line, or in a tidal river or estuary?',
        inputLabel: 'Yes',
        findByHeading: true
      })
    ).toBeChecked()
  })

  test('should show review-your-answers back link when accessed via change link', async () => {
    mockMarineLicence({
      ...marineLicence,
      waterFrameworkDirective: { nauticalMile: 'yes' }
    })

    const document = await loadPage({
      requestUrl: `${marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_NAUTICAL_MILE}?action=change`,
      server: getServer()
    })

    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_REVIEW_YOUR_ANSWERS
    )
  })

  test('should show task-list back link when accessed with existing answer', async () => {
    mockMarineLicence({
      ...marineLicence,
      waterFrameworkDirective: { nauticalMile: 'yes' }
    })

    const document = await loadPage({
      requestUrl:
        marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_NAUTICAL_MILE,
      server: getServer()
    })

    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    )
  })

  test('should show a validation error when submitted without a decision', async () => {
    mockMarineLicence(marineLicence)

    const submitNauticalMileForm = async (formData) => {
      const { document } = await submitForm({
        requestUrl:
          marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_NAUTICAL_MILE,
        server: getServer(),
        formData
      })
      return document
    }

    const document = await submitNauticalMileForm({})

    expectFieldsetError({
      document,
      fieldsetLabel:
        'Is your project within one nautical mile (1.85km) of the low-water line, or in a tidal river or estuary?',
      errorMessage:
        'Select whether your project is located within one nautical mile (1.85km) of the coast',
      findByHeading: true
    })
  })
})
