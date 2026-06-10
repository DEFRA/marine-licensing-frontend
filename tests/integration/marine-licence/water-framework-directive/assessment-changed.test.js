import { getByRole } from '@testing-library/dom'
import { marineLicenceRoutes } from '~/src/server/common/constants/routes.js'
import {
  mockMarineLicence,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import { loadPage, submitForm } from '~/tests/integration/shared/app-server.js'
import { expectFieldsetError } from '~/tests/integration/shared/expect-utils.js'
import { getInputInFieldset } from '~/tests/integration/shared/dom-helpers.js'

describe('Water Framework Directive Assessment Changed', () => {
  const getServer = setupTestServer()
  const marineLicence = {
    id: 'marine-licence-123',
    projectName: 'Test Marine Project',
    waterFrameworkDirective: { assessmentChanged: undefined }
  }

  test('page elements', async () => {
    mockMarineLicence(marineLicence)

    const document = await loadPage({
      requestUrl:
        marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_ASSESSMENT_CHANGED,
      server: getServer()
    })

    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_PREVIOUS_ASSESSMENT
    )
    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Has anything changed since your previous Water Framework Directive assessment?'
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
        marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_ASSESSMENT_CHANGED,
      server: getServer()
    })

    expect(
      getInputInFieldset({
        document,
        fieldsetLabel:
          'Has anything changed since your previous Water Framework Directive assessment?',
        inputLabel: 'Yes',
        findByHeading: true
      })
    ).not.toBeChecked()
    expect(
      getInputInFieldset({
        document,
        fieldsetLabel:
          'Has anything changed since your previous Water Framework Directive assessment?',
        inputLabel: 'No',
        findByHeading: true
      })
    ).not.toBeChecked()
  })

  test('form state when decision is set to yes', async () => {
    mockMarineLicence({
      ...marineLicence,
      waterFrameworkDirective: { assessmentChanged: 'yes' }
    })

    const document = await loadPage({
      requestUrl:
        marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_ASSESSMENT_CHANGED,
      server: getServer()
    })

    expect(
      getInputInFieldset({
        document,
        fieldsetLabel:
          'Has anything changed since your previous Water Framework Directive assessment?',
        inputLabel: 'Yes',
        findByHeading: true
      })
    ).toBeChecked()
  })

  test('should show a validation error when submitted without a decision', async () => {
    mockMarineLicence(marineLicence)

    const submitAssessmentChangedForm = async (formData) => {
      const { document } = await submitForm({
        requestUrl:
          marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_ASSESSMENT_CHANGED,
        server: getServer(),
        formData
      })
      return document
    }

    const document = await submitAssessmentChangedForm({})

    expectFieldsetError({
      document,
      fieldsetLabel:
        'Has anything changed since your previous Water Framework Directive assessment?',
      errorMessage:
        'Select whether anything has changed since your previous Water Framework Directive assessment',
      findByHeading: true
    })
  })
})
