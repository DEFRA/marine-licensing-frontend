import { getByRole, getByText } from '@testing-library/dom'
import { JSDOM } from 'jsdom'
import { marineLicenceRoutes } from '~/src/server/common/constants/routes.js'
import {
  mockMarineLicence,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import { loadPage, submitForm } from '~/tests/integration/shared/app-server.js'
import { makeGetRequest } from '~/src/server/test-helpers/server-requests.js'
import {
  validateWaterFrameworkDirectiveSummaryForAllFields,
  validateWaterFrameworkDirectiveSummaryForMinimumFields
} from '~/tests/integration/marine-licence/water-framework-directive/review-your-answers/review-your-answers.utils.js'
import { mockMarineLicenceApplication as marineLicence } from '~/src/server/test-helpers/mocks/marine-licence-mocks.js'
import {
  expectedPageContentAllFields,
  expectedPageContentMinimumFields
} from '~/tests/integration/marine-licence/water-framework-directive/review-your-answers/review-your-answers.fixtures.js'

describe('Water Framework Directive Review Your Answers', () => {
  const getServer = setupTestServer()

  test('page elements', async () => {
    mockMarineLicence(marineLicence)

    const document = await loadPage({
      requestUrl:
        marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_REVIEW_YOUR_ANSWERS,
      server: getServer()
    })

    expect(getByText(document, marineLicence.projectName)).toBeInTheDocument()
    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Check your answers for Water Framework Directive'
    )
    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_FILE_UPLOAD
    )

    validateWaterFrameworkDirectiveSummaryForAllFields(
      document,
      expectedPageContentAllFields
    )

    expect(
      getByRole(document, 'button', { name: 'Continue' })
    ).toBeInTheDocument()
  })

  test('page elements with minimum data', async () => {
    mockMarineLicence({
      ...marineLicence,
      waterFrameworkDirective: {
        nauticalMile: 'yes',
        excludedActivities: 'yes'
      }
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

    validateWaterFrameworkDirectiveSummaryForMinimumFields(
      document,
      expectedPageContentMinimumFields
    )
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

  test('back link points to task list when arriving from task list', async () => {
    mockMarineLicence(marineLicence)

    const response = await makeGetRequest({
      url: marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_REVIEW_YOUR_ANSWERS,
      server: getServer(),
      headers: {
        referer: `http://example.com${marineLicenceRoutes.MARINE_LICENCE_TASK_LIST}`
      }
    })

    const { document } = new JSDOM(response.result).window

    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    )
  })

  test('redirects to nautical mile page when nauticalMile is no', async () => {
    mockMarineLicence({
      ...marineLicence,
      waterFrameworkDirective: {
        ...marineLicence.waterFrameworkDirective,
        nauticalMile: 'no'
      }
    })

    const response = await makeGetRequest({
      url: marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_REVIEW_YOUR_ANSWERS,
      server: getServer()
    })

    expect(response.headers.location).toBe(
      marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_NAUTICAL_MILE
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
