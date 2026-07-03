import { getByRole, getByText } from '@testing-library/dom'
import { marineLicenceRoutes } from '~/src/server/common/constants/routes.js'
import {
  mockMarineLicence,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import { loadPage, submitForm } from '~/tests/integration/shared/app-server.js'
import { validateErrors } from '~/tests/integration/shared/expect-utils.js'
import { makePostRequest } from '~/src/server/test-helpers/server-requests.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import { FEES_TERMS_AND_CONDITIONS_URL } from '~/src/server/marine-licence/fee-estimate/controller.js'
import { mockMarineLicenceApplication } from '~/src/server/test-helpers/mocks/marine-licence-mocks.js'

describe('Fee estimate', () => {
  const getServer = setupTestServer()
  const marineLicence = {
    id: 'marine-licence-123',
    projectName: 'Test Marine Project'
  }

  const submitFeeEstimateForm = async (formData) => {
    const { document } = await submitForm({
      requestUrl: marineLicenceRoutes.MARINE_LICENCE_FEE_ESTIMATE,
      server: getServer(),
      formData
    })
    return document
  }

  test('page elements', async () => {
    mockMarineLicence(marineLicence)

    const document = await loadPage({
      requestUrl: marineLicenceRoutes.MARINE_LICENCE_FEE_ESTIMATE,
      server: getServer()
    })

    expect(getByText(document, 'Test Marine Project')).toBeInTheDocument()
    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    )
    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Fee estimate'
    )
    getByRole(document, 'button', { name: 'Save and continue' })
    expect(getByRole(document, 'link', { name: 'Cancel' })).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    )
  })

  test('inset text and body content', async () => {
    mockMarineLicence(marineLicence)

    const document = await loadPage({
      requestUrl: marineLicenceRoutes.MARINE_LICENCE_FEE_ESTIMATE,
      server: getServer()
    })

    expect(
      getByText(document, /Your application fee band: 2A/)
    ).toBeInTheDocument()
    expect(
      getByText(document, /Your application fee will not exceed £1,400/)
    ).toBeInTheDocument()
    expect(
      getByText(document, (content) =>
        content.includes(
          'Your final invoice will be based on actual hours worked. VAT does not apply.'
        )
      )
    ).toBeInTheDocument()
    expect(
      getByText(document, (content) =>
        content.includes(
          'there could be an additional cost of up to £750 for post-consent monitoring'
        )
      )
    ).toBeInTheDocument()
    expect(
      getByText(document, (content) =>
        content.includes(
          'Post-consent monitoring is the process of ensuring conditions are complied with'
        )
      )
    ).toBeInTheDocument()
  })

  test('external links', async () => {
    mockMarineLicence(marineLicence)

    const document = await loadPage({
      requestUrl: marineLicenceRoutes.MARINE_LICENCE_FEE_ESTIMATE,
      server: getServer()
    })

    expect(
      getByRole(document, 'link', {
        name: 'Find out more about MMO charges (opens in new tab)'
      })
    ).toHaveAttribute(
      'href',
      'https://www.gov.uk/government/publications/marine-licensing-fees'
    )
    expect(
      getByRole(document, 'link', {
        name: 'terms and conditions (opens in new tab)'
      })
    ).toHaveAttribute('href', FEES_TERMS_AND_CONDITIONS_URL)
  })

  test('section headings', async () => {
    mockMarineLicence(marineLicence)

    const document = await loadPage({
      requestUrl: marineLicenceRoutes.MARINE_LICENCE_FEE_ESTIMATE,
      server: getServer()
    })

    expect(
      getByRole(document, 'heading', { level: 2, name: 'Terms and conditions' })
    ).toBeInTheDocument()
    expect(
      getByText(document, 'Do you accept the fee estimate?')
    ).toBeInTheDocument()
  })

  test('radio hint text', async () => {
    mockMarineLicence(marineLicence)

    const document = await loadPage({
      requestUrl: marineLicenceRoutes.MARINE_LICENCE_FEE_ESTIMATE,
      server: getServer()
    })

    expect(
      getByText(
        document,
        'This includes the application fee of up to £1,400 and potential post-consent monitoring of up to £750'
      )
    ).toBeInTheDocument()
  })

  test('form fields are empty when no prior data', async () => {
    mockMarineLicence(marineLicence)

    const document = await loadPage({
      requestUrl: marineLicenceRoutes.MARINE_LICENCE_FEE_ESTIMATE,
      server: getServer()
    })

    expect(
      getByRole(document, 'checkbox', {
        name: 'I agree to the terms and conditions'
      })
    ).not.toBeChecked()
    expect(getByRole(document, 'radio', { name: 'Yes' })).not.toBeChecked()
    expect(getByRole(document, 'radio', { name: 'No' })).not.toBeChecked()
  })

  test('form fields are pre-populated from cache when accept is yes', async () => {
    mockMarineLicence({
      ...marineLicence,
      feeEstimate: {
        termsAndConditions: 'true',
        accept: 'yes',
        feeBand: '2A'
      }
    })

    const document = await loadPage({
      requestUrl: marineLicenceRoutes.MARINE_LICENCE_FEE_ESTIMATE,
      server: getServer()
    })

    expect(
      getByRole(document, 'checkbox', {
        name: 'I agree to the terms and conditions'
      })
    ).toBeChecked()
    expect(getByRole(document, 'radio', { name: 'Yes' })).toBeChecked()
    expect(getByRole(document, 'radio', { name: 'No' })).not.toBeChecked()
  })

  test('form fields are pre-populated from cache when accept is no', async () => {
    mockMarineLicence({
      ...marineLicence,
      feeEstimate: {
        termsAndConditions: 'true',
        accept: 'no',
        feeBand: '2A'
      }
    })

    const document = await loadPage({
      requestUrl: marineLicenceRoutes.MARINE_LICENCE_FEE_ESTIMATE,
      server: getServer()
    })

    expect(
      getByRole(document, 'checkbox', {
        name: 'I agree to the terms and conditions'
      })
    ).toBeChecked()
    expect(getByRole(document, 'radio', { name: 'Yes' })).not.toBeChecked()
    expect(getByRole(document, 'radio', { name: 'No' })).toBeChecked()
  })

  test('form fields are pre-populated using mockMarineLicenceApplication', async () => {
    mockMarineLicence(mockMarineLicenceApplication)

    const document = await loadPage({
      requestUrl: marineLicenceRoutes.MARINE_LICENCE_FEE_ESTIMATE,
      server: getServer()
    })

    expect(
      getByRole(document, 'checkbox', {
        name: 'I agree to the terms and conditions'
      })
    ).toBeChecked()
    expect(getByRole(document, 'radio', { name: 'Yes' })).toBeChecked()
    expect(getByRole(document, 'radio', { name: 'No' })).not.toBeChecked()
  })

  test('should show validation error when terms and conditions not agreed', async () => {
    mockMarineLicence(marineLicence)

    const document = await submitFeeEstimateForm({
      accept: 'yes',
      feeBand: '2A'
    })

    validateErrors(
      [
        {
          field: 'termsAndConditions',
          message: 'You need to agree to the terms and conditions'
        }
      ],
      document
    )
  })

  test('should show validation error when accept not selected', async () => {
    mockMarineLicence(marineLicence)

    const document = await submitFeeEstimateForm({
      termsAndConditions: 'true',
      feeBand: '2A'
    })

    validateErrors(
      [
        {
          field: 'accept',
          message: 'Select if you accept the fee estimate'
        }
      ],
      document
    )
  })

  test('should show both validation errors when nothing submitted', async () => {
    mockMarineLicence(marineLicence)

    const document = await submitFeeEstimateForm({
      feeBand: '2A'
    })

    validateErrors(
      [
        {
          field: 'termsAndConditions',
          message: 'You need to agree to the terms and conditions'
        },
        {
          field: 'accept',
          message: 'Select if you accept the fee estimate'
        }
      ],
      document
    )
  })

  test('should redirect to task list on valid submission', async () => {
    mockMarineLicence(marineLicence)

    const response = await makePostRequest({
      url: marineLicenceRoutes.MARINE_LICENCE_FEE_ESTIMATE,
      server: getServer(),
      formData: {
        termsAndConditions: 'true',
        accept: 'yes',
        feeBand: '2A'
      }
    })

    expect(response.statusCode).toBe(statusCodes.redirect)
    expect(response.headers.location).toBe(
      marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    )
  })

  test('should redirect to are you sure page when accept is no', async () => {
    mockMarineLicence(marineLicence)

    const response = await makePostRequest({
      url: marineLicenceRoutes.MARINE_LICENCE_FEE_ESTIMATE,
      server: getServer(),
      formData: {
        termsAndConditions: 'true',
        accept: 'no',
        feeBand: '2A'
      }
    })

    expect(response.statusCode).toBe(statusCodes.redirect)
    expect(response.headers.location).toBe(
      marineLicenceRoutes.MARINE_LICENCE_FEE_ESTIMATE_ARE_YOU_SURE
    )
  })
})
