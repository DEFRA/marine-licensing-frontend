import { getByRole, getByText } from '@testing-library/dom'
import { marineLicenceRoutes } from '~/src/server/common/constants/routes.js'
import {
  mockMarineLicence,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import { loadPage, submitForm } from '~/tests/integration/shared/app-server.js'
import { mockMarineLicenceApplication } from '~/src/server/test-helpers/mocks/marine-licence-mocks.js'
import { expectFieldsetError } from '~/tests/integration/shared/expect-utils.js'

describe('Start and end dates', () => {
  const getServer = setupTestServer()

  test('page elements', async () => {
    mockMarineLicence({
      ...mockMarineLicenceApplication,
      preferredDates: undefined
    })

    const document = await loadPage({
      requestUrl: marineLicenceRoutes.MARINE_LICENCE_PREFERRED_DATES,
      server: getServer()
    })

    expect(
      getByText(document, mockMarineLicenceApplication.projectName)
    ).toBeInTheDocument()
    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    )
    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'What are your preferred start and end dates for the licence?'
    )
    getByRole(document, 'button', { name: 'Save and continue' })
    expect(getByRole(document, 'link', { name: 'Cancel' })).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    )
  })

  test('pre-populates form when cached dates exist', async () => {
    mockMarineLicence(mockMarineLicenceApplication)

    const document = await loadPage({
      requestUrl: marineLicenceRoutes.MARINE_LICENCE_PREFERRED_DATES,
      server: getServer()
    })

    expect(document.querySelector('#start-date-month').value).toBe('07')
    expect(document.querySelector('#start-date-year').value).toBe('2026')
    expect(document.querySelector('#end-date-month').value).toBe('08')
    expect(document.querySelector('#end-date-year').value).toBe('2027')
  })

  test('shows both errors when all fields are empty', async () => {
    mockMarineLicence(mockMarineLicenceApplication)

    const { document } = await submitForm({
      requestUrl: marineLicenceRoutes.MARINE_LICENCE_PREFERRED_DATES,
      server: getServer(),
      formData: {
        'start-date-month': '',
        'start-date-year': '',
        'end-date-month': '',
        'end-date-year': ''
      }
    })

    expectFieldsetError({
      document,
      fieldsetLabel: 'Start date',
      errorMessage: 'The start date must include a month and a year',
      useErrorClass: true
    })
    expectFieldsetError({
      document,
      fieldsetLabel: 'End date',
      errorMessage: 'The end date must include a month and a year',
      useErrorClass: true
    })
  })

  test('shows start error when only month is missing', async () => {
    mockMarineLicence(mockMarineLicenceApplication)

    const { document } = await submitForm({
      requestUrl: marineLicenceRoutes.MARINE_LICENCE_PREFERRED_DATES,
      server: getServer(),
      formData: {
        'start-date-month': '',
        'start-date-year': '2026',
        'end-date-month': '',
        'end-date-year': '2027'
      }
    })

    expectFieldsetError({
      document,
      fieldsetLabel: 'Start date',
      errorMessage: 'The start date must have a real month',
      useErrorClass: true
    })

    expectFieldsetError({
      document,
      fieldsetLabel: 'End date',
      errorMessage: 'The end date must have a real month',
      useErrorClass: true
    })
  })

  test('shows start error when only start year is missing', async () => {
    mockMarineLicence(mockMarineLicenceApplication)

    const { document } = await submitForm({
      requestUrl: marineLicenceRoutes.MARINE_LICENCE_PREFERRED_DATES,
      server: getServer(),
      formData: {
        'start-date-month': '7',
        'start-date-year': '',
        'end-date-month': '8',
        'end-date-year': ''
      }
    })

    expectFieldsetError({
      document,
      fieldsetLabel: 'Start date',
      errorMessage: 'The start date must have a real year',
      useErrorClass: true
    })

    expectFieldsetError({
      document,
      fieldsetLabel: 'End date',
      errorMessage: 'The end date must have a real year',
      useErrorClass: true
    })
  })

  test('shows start error when date is in the past', async () => {
    mockMarineLicence(mockMarineLicenceApplication)

    const { document } = await submitForm({
      requestUrl: marineLicenceRoutes.MARINE_LICENCE_PREFERRED_DATES,
      server: getServer(),
      formData: {
        'start-date-month': '1',
        'start-date-year': '2020',
        'end-date-month': '8',
        'end-date-year': '2020'
      }
    })

    expectFieldsetError({
      document,
      fieldsetLabel: 'Start date',
      errorMessage: 'The start date must be today or in the future',
      useErrorClass: true
    })
    expectFieldsetError({
      document,
      fieldsetLabel: 'End date',
      errorMessage: 'The end date must be today or in the future',
      useErrorClass: true
    })
  })

  test('shows end error when end date is before start date', async () => {
    mockMarineLicence(mockMarineLicenceApplication)

    const { document } = await submitForm({
      requestUrl: marineLicenceRoutes.MARINE_LICENCE_PREFERRED_DATES,
      server: getServer(),
      formData: {
        'start-date-month': '8',
        'start-date-year': '2027',
        'end-date-month': '7',
        'end-date-year': '2027'
      }
    })

    expectFieldsetError({
      document,
      fieldsetLabel: 'End date',
      errorMessage: 'The end date must be after the start date',
      useErrorClass: true
    })
  })
})
