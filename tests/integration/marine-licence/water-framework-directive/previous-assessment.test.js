import { getByRole } from '@testing-library/dom'
import { marineLicenceRoutes } from '~/src/server/common/constants/routes.js'
import {
  mockMarineLicence,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import { loadPage, submitForm } from '~/tests/integration/shared/app-server.js'
import { expectFieldsetError } from '~/tests/integration/shared/expect-utils.js'
import { getInputInFieldset } from '~/tests/integration/shared/dom-helpers.js'

describe('Water Framework Directive Previous Assessment', () => {
  const getServer = setupTestServer()
  const marineLicence = {
    id: 'marine-licence-123',
    projectName: 'Test Marine Project',
    waterFrameworkDirective: { previousAssessment: undefined }
  }

  test('page elements', async () => {
    mockMarineLicence(marineLicence)

    const document = await loadPage({
      requestUrl:
        marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_PREVIOUS_ASSESSMENT,
      server: getServer()
    })

    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_EXCLUDED_ACTIVITIES
    )
    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Do you have a previous Water Framework Directive assessment completed between 2015 and 2022 for this type of activity?'
    )

    expect(
      getByRole(document, 'button', { name: 'Continue' })
    ).toBeInTheDocument()

    expect(getByRole(document, 'link', { name: 'Cancel' })).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    )
  })

  test('form state when no decision set', async () => {
    mockMarineLicence(marineLicence)

    const document = await loadPage({
      requestUrl:
        marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_PREVIOUS_ASSESSMENT,
      server: getServer()
    })

    expect(
      getInputInFieldset({
        document,
        fieldsetLabel:
          'Do you have a previous Water Framework Directive assessment completed between 2015 and 2022 for this type of activity?',
        inputLabel: 'Yes',
        findByHeading: true
      })
    ).not.toBeChecked()
    expect(
      getInputInFieldset({
        document,
        fieldsetLabel:
          'Do you have a previous Water Framework Directive assessment completed between 2015 and 2022 for this type of activity?',
        inputLabel: 'No',
        findByHeading: true
      })
    ).not.toBeChecked()
  })

  test('form state when decision is set to yes', async () => {
    mockMarineLicence({
      ...marineLicence,
      waterFrameworkDirective: { previousAssessment: 'yes' }
    })

    const document = await loadPage({
      requestUrl:
        marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_PREVIOUS_ASSESSMENT,
      server: getServer()
    })

    expect(
      getInputInFieldset({
        document,
        fieldsetLabel:
          'Do you have a previous Water Framework Directive assessment completed between 2015 and 2022 for this type of activity?',
        inputLabel: 'Yes',
        findByHeading: true
      })
    ).toBeChecked()
  })

  test('should show a validation error when submitted without a decision', async () => {
    mockMarineLicence(marineLicence)

    const submitPreviousAssessmentForm = async (formData) => {
      const { document } = await submitForm({
        requestUrl:
          marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_PREVIOUS_ASSESSMENT,
        server: getServer(),
        formData
      })
      return document
    }

    const document = await submitPreviousAssessmentForm({})

    expectFieldsetError({
      document,
      fieldsetLabel:
        'Do you have a previous Water Framework Directive assessment completed between 2015 and 2022 for this type of activity?',
      errorMessage:
        'Select whether you have a previous Water Framework Directive assessment completed between 2015 and 2022 for this type of activity',
      findByHeading: true
    })
  })
})
