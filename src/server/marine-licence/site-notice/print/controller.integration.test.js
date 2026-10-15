import { vi } from 'vitest'
import { JSDOM } from 'jsdom'
import { setupTestServer } from '#tests/integration/shared/test-setup-helpers.js'
import { makeGetRequest } from '#src/server/test-helpers/server-requests.js'
import { getMarineLicenceService } from '#src/services/marine-licence-service/index.js'
import { getUserSession } from '#src/server/common/plugins/auth/utils.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { statusCodes } from '#src/server/common/constants/status-codes.js'
import { config } from '#src/config/config.js'
import { APPLICATION_TASK_TYPE } from '#src/server/common/helpers/marine-licence/application-tasks/registry.js'
import {
  mockMarineLicenceWithApplicationTask,
  mockApplicationTaskContactId
} from '#src/server/test-helpers/mocks/marine-licence-mocks.js'

vi.mock('#src/services/marine-licence-service/index.js')
vi.mock('#src/server/common/plugins/auth/utils.js', () => ({
  getUserSession: vi.fn()
}))

const marineLicenceId = mockMarineLicenceWithApplicationTask.id
const printUrl = `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_PRINT}/${marineLicenceId}`
const reference = mockMarineLicenceWithApplicationTask.applicationReference

const withSiteNoticeSummary = (summary) => ({
  ...mockMarineLicenceWithApplicationTask,
  applicationTasks: mockMarineLicenceWithApplicationTask.applicationTasks.map(
    (task) =>
      task.type === APPLICATION_TASK_TYPE.PUBLIC_SITE_NOTICE
        ? { ...task, data: { ...task.data, summary } }
        : task
  )
})

describe('#siteNoticePrintController (integration)', () => {
  const getServer = setupTestServer()
  let getMarineLicenceById

  const getPage = async () => {
    const response = await makeGetRequest({
      url: printUrl,
      server: getServer()
    })
    const { document } = new JSDOM(response.result).window
    return { response, document }
  }

  const text = (document, testId) =>
    document
      .querySelector(`[data-testid="${testId}"]`)
      ?.textContent.replaceAll(/\s+/g, ' ')
      .trim()

  beforeEach(() => {
    vi.mocked(getUserSession).mockResolvedValue({
      contactId: mockApplicationTaskContactId
    })
    getMarineLicenceById = vi
      .fn()
      .mockResolvedValue(mockMarineLicenceWithApplicationTask)
    vi.mocked(getMarineLicenceService).mockReturnValue({
      getMarineLicenceById
    })
  })

  test('renders the reference in the sub-heading, next to the QR code and in the bullet list', async () => {
    const { response, document } = await getPage()

    expect(response.statusCode).toBe(statusCodes.ok)
    expect(text(document, 'site-notice-subheading')).toBe(
      `Marine licence application notice ${reference}`
    )
    expect(text(document, 'site-notice-qr-reference')).toBe(
      `Application reference: ${reference}`
    )
    expect(text(document, 'site-notice-bullet-reference')).toBe(
      `quote the application reference ${reference}`
    )
  })

  test('names the applicant in the first paragraph', async () => {
    const { document } = await getPage()

    expect(text(document, 'site-notice-applicant')).toBe(
      `${mockMarineLicenceWithApplicationTask.whoMarineLicenceIsFor} has applied to the Marine Management Organisation (MMO) under Part 4 of the Marine and Coastal Access Act 2009 for a marine licence.`
    )
  })

  test('renders the site notice summary in bold', async () => {
    const { document } = await getPage()

    const summary = document.querySelector(
      '[data-testid="site-notice-summary"]'
    )
    expect(summary.textContent).toBe('test site notice summary')
    expect(summary.classList).toContain('govuk-!-font-weight-bold')
    expect(document.body.textContent).toContain('The application proposes:')
  })

  test('escapes the case worker summary', async () => {
    getMarineLicenceById.mockResolvedValue(
      withSiteNoticeSummary({
        siteNoticeSummary: '<script>alert(1)</script>'
      })
    )

    const { document } = await getPage()

    expect(text(document, 'site-notice-summary')).toBe(
      '<script>alert(1)</script>'
    )
    expect(
      document.querySelector('[data-testid="site-notice"] script')
    ).toBeNull()
  })

  test('omits the proposal section when there is no summary', async () => {
    getMarineLicenceById.mockResolvedValue(withSiteNoticeSummary(undefined))

    const { response, document } = await getPage()

    expect(response.statusCode).toBe(statusCodes.ok)
    expect(
      document.querySelector('[data-testid="site-notice-summary"]')
    ).toBeNull()
    expect(document.body.textContent).not.toContain('The application proposes:')
  })

  test('shows a QR code and plain-text URL for this application in this environment', async () => {
    const { document } = await getPage()

    const publicUrl = `${config.get('appBaseUrl')}${marineLicenceRoutes.MARINE_LICENCE_VIEW_DETAILS_PUBLIC}/${marineLicenceId}`
    const qrCode = document.querySelector('[data-testid="site-notice-qr-code"]')

    expect(qrCode.getAttribute('role')).toBe('img')
    expect(qrCode.querySelector('svg')).not.toBeNull()
    expect(text(document, 'site-notice-url')).toBe(
      publicUrl.replace(/^https?:\/\//, '')
    )
  })

  test('has no links other than the survey link, skip link and GOV.UK logo', async () => {
    const { document } = await getPage()

    const links = [...document.querySelectorAll('a')].filter(
      (link) =>
        !link.closest('.govuk-cookie-banner') &&
        !link.classList.contains('govuk-skip-link') &&
        !link.classList.contains('govuk-header__homepage-link')
    )

    expect(links).toHaveLength(1)
    expect(links[0].textContent).toBe('give your feedback (opens in new tab)')
    expect(links[0].closest('.govuk-phase-banner')).not.toBeNull()
    expect(document.querySelector('.govuk-footer')).toBeNull()
    expect(document.querySelector('.govuk-back-link')).toBeNull()
  })

  test('does not show who the user is representing', async () => {
    vi.mocked(getUserSession).mockResolvedValue({
      contactId: mockApplicationTaskContactId,
      shouldShowOrgOrUserName: true,
      organisationName: 'Represented Org Ltd'
    })

    const { document } = await getPage()

    expect(document.body.textContent).not.toContain('Represented Org Ltd')
  })

  test('hides "Print this page" and its PDF instructions until JavaScript runs', async () => {
    const { document } = await getPage()

    const controls = document.querySelector('[data-testid="print-controls"]')
    const button = controls.querySelector('[data-testid="print-button"]')
    expect(controls.hasAttribute('hidden')).toBe(true)
    expect(controls.hasAttribute('data-print-page-controls')).toBe(true)
    expect(controls.textContent).toContain(
      "To save as a PDF, select 'Print this page'"
    )
    expect(button.tagName).toBe('BUTTON')
    expect(button.getAttribute('type')).toBe('button')
    expect(button.dataset.module).toBe('app-print-page')
  })

  test('returns 403 when the user did not submit the application', async () => {
    vi.mocked(getUserSession).mockResolvedValue({
      contactId: 'someone-else'
    })

    const { response } = await getPage()

    expect(response.statusCode).toBe(statusCodes.forbidden)
  })
})
