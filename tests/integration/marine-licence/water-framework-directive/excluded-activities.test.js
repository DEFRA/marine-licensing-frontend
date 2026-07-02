import { getByRole, getByText, queryByRole } from '@testing-library/dom'
import { marineLicenceRoutes } from '~/src/server/common/constants/routes.js'
import {
  mockMarineLicence,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import { loadPage, submitForm } from '~/tests/integration/shared/app-server.js'
import { expectFieldsetError } from '~/tests/integration/shared/expect-utils.js'
import { getInputInFieldset } from '~/tests/integration/shared/dom-helpers.js'

describe('Water Framework Directive Excluded Activities', () => {
  const getServer = setupTestServer()
  const marineLicence = {
    id: 'marine-licence-123',
    projectName: 'Test Marine Project',
    waterFrameworkDirective: { excludedActivities: undefined }
  }

  const submitExcludedActivitiesForm = async (formData) => {
    const { document, response } = await submitForm({
      requestUrl:
        marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_EXCLUDED_ACTIVITIES,
      server: getServer(),
      formData
    })
    return { document, response }
  }

  test('page elements', async () => {
    mockMarineLicence(marineLicence)

    const document = await loadPage({
      requestUrl:
        marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_EXCLUDED_ACTIVITIES,
      server: getServer()
    })

    expect(getByText(document, 'Test Marine Project')).toBeInTheDocument()
    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_NAUTICAL_MILE
    )
    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Is your project limited to one of the following excluded activities?'
    )

    expect(
      getByText(
        document,
        'maintaining pumps at pumping stations - if you do it regularly, avoid low dissolved oxygen levels during maintenance and minimise silt movement when restarting the pumps'
      )
    ).toBeInTheDocument()

    expect(
      getByText(
        document,
        'removing blockages or obstacles like litter or debris within 10m of an existing structure to maintain flow'
      )
    ).toBeInTheDocument()

    expect(
      getByText(
        document,
        'replacing or removing existing pipes, cables or services crossing over a water body - but not including any new structure or supports, or new bed or bank reinforcement'
      )
    ).toBeInTheDocument()

    expect(
      getByText(
        document,
        `'over water' replacement or repairs to, for example bridge, pier and jetty surfaces - if you minimise bank or bed disturbance`
      )
    ).toBeInTheDocument()

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
        marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_EXCLUDED_ACTIVITIES,
      server: getServer()
    })

    expect(
      getInputInFieldset({
        document,
        fieldsetLabel:
          'Is your project limited to one of the following excluded activities?',
        inputLabel: 'Yes',
        findByHeading: true
      })
    ).not.toBeChecked()
    expect(
      getInputInFieldset({
        document,
        fieldsetLabel:
          'Is your project limited to one of the following excluded activities?',
        inputLabel: 'No',
        findByHeading: true
      })
    ).not.toBeChecked()
  })

  test('form state when decision is set to yes', async () => {
    mockMarineLicence({
      ...marineLicence,
      waterFrameworkDirective: { excludedActivities: 'yes' }
    })

    const document = await loadPage({
      requestUrl:
        marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_EXCLUDED_ACTIVITIES,
      server: getServer()
    })

    expect(
      getInputInFieldset({
        document,
        fieldsetLabel:
          'Is your project limited to one of the following excluded activities?',
        inputLabel: 'Yes',
        findByHeading: true
      })
    ).toBeChecked()
  })

  test('should show a validation error when submitted without a decision', async () => {
    mockMarineLicence(marineLicence)

    const { document } = await submitExcludedActivitiesForm({})

    expectFieldsetError({
      document,
      fieldsetLabel:
        'Is your project limited to one of the following excluded activities?',
      errorMessage:
        'Select whether your project is limited to one of the excluded activities',
      findByHeading: true
    })
  })

  test('should show review-your-answers back link and no cancel when accessed via change link', async () => {
    mockMarineLicence(marineLicence)

    const document = await loadPage({
      requestUrl: `${marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_EXCLUDED_ACTIVITIES}?action=change`,
      server: getServer()
    })

    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_REVIEW_YOUR_ANSWERS
    )
    expect(
      queryByRole(document, 'link', { name: 'Cancel' })
    ).not.toBeInTheDocument()
  })

  test('should go to review page when yes is chosen as answer', async () => {
    mockMarineLicence(marineLicence)

    const { response } = await submitExcludedActivitiesForm({
      excludedActivities: 'yes'
    })

    expect(response.headers.location).toBe(
      marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_REVIEW_YOUR_ANSWERS
    )
  })

  test('should go to assessment-change when no is chosen as answer', async () => {
    mockMarineLicence(marineLicence)

    const { response } = await submitExcludedActivitiesForm({
      excludedActivities: 'no'
    })

    expect(response.headers.location).toBe(
      marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_FILE_UPLOAD
    )
  })
})
