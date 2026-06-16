import { getByRole, getByText } from '@testing-library/dom'
import { marineLicenceRoutes } from '~/src/server/common/constants/routes.js'
import {
  mockMarineLicence,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import { loadPage, submitForm } from '~/tests/integration/shared/app-server.js'

describe('Water Framework Directive Review Your Answers', () => {
  const getServer = setupTestServer()

  const marineLicence = {
    id: 'marine-licence-123',
    projectName: 'Test Marine Project',
    waterFrameworkDirective: { excludedActivities: 'no' }
  }

  test('page elements', async () => {
    mockMarineLicence(marineLicence)

    const document = await loadPage({
      requestUrl:
        marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_REVIEW_YOUR_ANSWERS,
      server: getServer()
    })

    expect(getByText(document, 'Test Marine Project')).toBeInTheDocument()
    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Check your answers for Water Framework Directive'
    )
    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_FILE_UPLOAD
    )
    expect(
      getByRole(document, 'button', { name: 'Continue' })
    ).toBeInTheDocument()
  })

  test('back link points to excluded-activities when excludedActivities is yes', async () => {
    mockMarineLicence({
      ...marineLicence,
      waterFrameworkDirective: { excludedActivities: 'yes' }
    })

    const document = await loadPage({
      requestUrl:
        marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_REVIEW_YOUR_ANSWERS,
      server: getServer()
    })

    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_EXCLUDED_ACTIVITIES
    )
  })

  test('continue button redirects to task list', async () => {
    mockMarineLicence(marineLicence)

    const { response } = await submitForm({
      requestUrl:
        marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_REVIEW_YOUR_ANSWERS,
      server: getServer(),
      formData: {}
    })

    expect(response.headers.location).toBe(
      marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    )
  })
})
