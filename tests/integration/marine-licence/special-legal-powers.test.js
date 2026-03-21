import { getByRole, getByText } from '@testing-library/dom'
import { marineLicenceRoutes } from '~/src/server/common/constants/routes.js'
import {
  mockMarineLicence,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import { loadPage, submitForm } from '~/tests/integration/shared/app-server.js'
import {
  expectFieldsetError,
  expectInputValue
} from '~/tests/integration/shared/expect-utils.js'
import { getInputInFieldset } from '~/tests/integration/shared/dom-helpers.js'
import { employeeSession } from '~/tests/integration/shared/session-fixtures.js'
import { getUserSession } from '~/src/server/common/plugins/auth/utils.js'
vi.mock('~/src/server/common/plugins/auth/utils.js')

describe('Special legal powers', () => {
  const getServer = setupTestServer()
  const marineLicence = {
    id: 'marine-licence-123',
    projectName: 'Test Marine Project',
    specialLegalPowers: { agree: undefined, details: '' }
  }

  beforeAll(() => {
    vi.mocked(getUserSession).mockResolvedValue(employeeSession)
  })

  test('page elements', async () => {
    mockMarineLicence(marineLicence)
    const document = await loadPage({
      requestUrl: marineLicenceRoutes.MARINE_LICENCE_SPECIAL_LEGAL_POWERS,
      server: getServer()
    })
    expect(getByText(document, 'Test Marine Project')).toBeInTheDocument()
    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    )
    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Does your organisation have special legal powers to do any of this project?'
    )
    getByRole(document, 'button', { name: 'Save and continue' })
    expect(getByRole(document, 'link', { name: 'Cancel' })).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    )
  })

  test('back link from Check Your Answers', async () => {
    mockMarineLicence(marineLicence)
    const document = await loadPage({
      requestUrl:
        marineLicenceRoutes.MARINE_LICENCE_SPECIAL_LEGAL_POWERS +
        '?from=check-your-answers',
      server: getServer()
    })
    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS
    )
  })

  test('form state when no decision set', async () => {
    mockMarineLicence(marineLicence)
    const document = await loadPage({
      requestUrl: marineLicenceRoutes.MARINE_LICENCE_SPECIAL_LEGAL_POWERS,
      server: getServer()
    })
    expect(
      getInputInFieldset({
        document,
        fieldsetLabel:
          'Does your organisation have special legal powers to do any of this project?',
        inputLabel: 'Yes',
        findByHeading: true
      })
    ).not.toBeChecked()
    expect(
      getInputInFieldset({
        document,
        fieldsetLabel:
          'Does your organisation have special legal powers to do any of this project?',
        inputLabel: 'No',
        findByHeading: true
      })
    ).not.toBeChecked()
  })

  test('form state when decision and details set', async () => {
    mockMarineLicence({
      ...marineLicence,
      specialLegalPowers: { agree: 'yes', details: 'Some legal details' }
    })
    const document = await loadPage({
      requestUrl: marineLicenceRoutes.MARINE_LICENCE_SPECIAL_LEGAL_POWERS,
      server: getServer()
    })
    expect(
      getInputInFieldset({
        document,
        fieldsetLabel:
          'Does your organisation have special legal powers to do any of this project?',
        inputLabel: 'Yes',
        findByHeading: true
      })
    ).toBeChecked()
    expectInputValue({
      document,
      inputLabel:
        'Provide details of the legal powers including the relevant legislation',
      value: 'Some legal details'
    })
  })

  test('should show a validation error when submitted without a decision', async () => {
    mockMarineLicence(marineLicence)
    const submitSpecialLegalPowersForm = async (formData) => {
      const { document } = await submitForm({
        requestUrl: marineLicenceRoutes.MARINE_LICENCE_SPECIAL_LEGAL_POWERS,
        server: getServer(),
        formData
      })
      return document
    }
    const document = await submitSpecialLegalPowersForm({ details: '' })
    expectFieldsetError({
      document,
      fieldsetLabel:
        'Does your organisation have special legal powers to do any of this project?',
      errorMessage: 'Select whether your organisation has special legal powers',
      findByHeading: true
    })
  })

  test('should show a validation error when "yes" is selected but details are missing', async () => {
    mockMarineLicence(marineLicence)
    const submitSpecialLegalPowersForm = async (formData) => {
      const { document } = await submitForm({
        requestUrl: marineLicenceRoutes.MARINE_LICENCE_SPECIAL_LEGAL_POWERS,
        server: getServer(),
        formData
      })
      return document
    }
    const document = await submitSpecialLegalPowersForm({
      agree: 'yes',
      details: ''
    })
    expectFieldsetError({
      document,
      fieldsetLabel:
        'Does your organisation have special legal powers to do any of this project?',
      errorMessage: 'Provide details of the legal powers',
      findByHeading: true
    })
  })
})
