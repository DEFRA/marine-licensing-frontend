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
      'Is your project located within one nautical mile (1.85km) of the coast?'
    )

    expect(
      getByText(
        document,
        'This example shows a project site located within one nautical mile of the coast.'
      )
    ).toBeInTheDocument()

    expect(
      getByRole(document, 'img', {
        name: 'Diagram showing a site location in the water less than 1 nautical mile from the coast'
      })
    ).toBeInTheDocument()

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
        'Help with understanding one nautical mile from the coast'
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
          'Is your project located within one nautical mile (1.85km) of the coast?',
        inputLabel: 'Yes',
        findByHeading: true
      })
    ).not.toBeChecked()
    expect(
      getInputInFieldset({
        document,
        fieldsetLabel:
          'Is your project located within one nautical mile (1.85km) of the coast?',
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
          'Is your project located within one nautical mile (1.85km) of the coast?',
        inputLabel: 'Yes',
        findByHeading: true
      })
    ).toBeChecked()
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
        'Is your project located within one nautical mile (1.85km) of the coast?',
      errorMessage:
        'Select whether your project is located within one nautical mile (1.85km) of the coast',
      findByHeading: true
    })
  })
})
