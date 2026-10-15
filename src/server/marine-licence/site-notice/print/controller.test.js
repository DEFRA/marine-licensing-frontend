import Boom from '@hapi/boom'
import {
  siteNoticePrintController,
  SITE_NOTICE_PRINT_VIEW_ROUTE
} from '#src/server/marine-licence/site-notice/print/controller.js'
import { loadMarineLicence } from '#src/server/common/helpers/marine-licence/site-notice.js'
import { getSiteNoticeQrCode } from '#src/server/common/helpers/marine-licence/site-notice-qr-code.js'
import { APPLICATION_TASK_TYPE } from '#src/server/common/helpers/marine-licence/application-tasks/registry.js'
import { mockMarineLicenceWithApplicationTask } from '#src/server/test-helpers/mocks/marine-licence-mocks.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import {
  createMockH,
  createMockRequest
} from '#src/server/test-helpers/mocks/helpers.js'

vi.mock(
  '#src/server/common/helpers/marine-licence/site-notice.js',
  async () => {
    const actual = await vi.importActual(
      '#src/server/common/helpers/marine-licence/site-notice.js'
    )

    return {
      ...actual,
      loadMarineLicence: vi.fn()
    }
  }
)
vi.mock('#src/server/common/helpers/marine-licence/site-notice-qr-code.js')

const marineLicenceId = mockMarineLicenceWithApplicationTask.id
const qrCodeUrl = `https://example.gov.uk:8443/marine-licence/view-public-details/${marineLicenceId}`

const withSiteNoticeSummary = (summary) => ({
  ...mockMarineLicenceWithApplicationTask,
  applicationTasks: mockMarineLicenceWithApplicationTask.applicationTasks.map(
    (task) =>
      task.type === APPLICATION_TASK_TYPE.PUBLIC_SITE_NOTICE
        ? { ...task, data: { ...task.data, summary } }
        : task
  )
})

describe('#siteNoticePrintController', () => {
  let request
  let h

  const loadLicence = (marineLicence) =>
    vi
      .mocked(loadMarineLicence)
      .mockResolvedValue({ marineLicence, marineLicenceId })

  beforeEach(() => {
    request = createMockRequest({ params: { marineLicenceId } })
    h = createMockH()
    loadLicence(mockMarineLicenceWithApplicationTask)
    vi.mocked(getSiteNoticeQrCode).mockResolvedValue({
      url: qrCodeUrl,
      svg: '<svg></svg>'
    })
  })

  test('renders the notice with the application details and QR code', async () => {
    loadLicence(withSiteNoticeSummary({ siteNoticeSummary: '  Dredging  ' }))

    await siteNoticePrintController.handler(request, h)

    expect(getSiteNoticeQrCode).toHaveBeenCalledWith(marineLicenceId)
    expect(h.view).toHaveBeenCalledWith(SITE_NOTICE_PRINT_VIEW_ROUTE, {
      pageTitle: 'Site notice',
      applicationReference:
        mockMarineLicenceWithApplicationTask.applicationReference,
      applicantName: mockMarineLicenceWithApplicationTask.whoMarineLicenceIsFor,
      summaryOfWorks: 'Dredging',
      qrCode: {
        url: qrCodeUrl,
        svg: '<svg></svg>',
        displayUrl: `example.gov.uk:8443/marine-licence/view-public-details/${marineLicenceId}`
      }
    })
    expect(request.logger.warn).not.toHaveBeenCalled()
  })

  test.each([
    ['blank', { siteNoticeSummary: '   ' }],
    ['absent', undefined]
  ])(
    'passes no summary and logs a warning when the summary is %s',
    async (_case, summary) => {
      loadLicence(withSiteNoticeSummary(summary))

      await siteNoticePrintController.handler(request, h)

      expect(h.view).toHaveBeenCalledWith(
        SITE_NOTICE_PRINT_VIEW_ROUTE,
        expect.objectContaining({ summaryOfWorks: null })
      )
      expect(request.logger.warn).toHaveBeenCalledWith(
        `Site notice summary missing for marine licence ${marineLicenceId}`
      )
    }
  )

  test('redirects to view details when there is no site notice task', async () => {
    loadLicence({
      ...mockMarineLicenceWithApplicationTask,
      applicationTasks: []
    })

    await siteNoticePrintController.handler(request, h)

    expect(h.redirect).toHaveBeenCalledWith(
      `${marineLicenceRoutes.MARINE_LICENCE_VIEW_DETAILS}/${marineLicenceId}`
    )
    expect(h.view).not.toHaveBeenCalled()
  })

  test('rethrows Boom errors unchanged', async () => {
    const forbidden = Boom.forbidden()
    vi.mocked(loadMarineLicence).mockRejectedValue(forbidden)

    await expect(siteNoticePrintController.handler(request, h)).rejects.toBe(
      forbidden
    )
    expect(request.logger.error).not.toHaveBeenCalled()
  })

  test('logs and returns a 500 for any other error', async () => {
    const error = new Error('boom')
    vi.mocked(loadMarineLicence).mockRejectedValue(error)

    await expect(
      siteNoticePrintController.handler(request, h)
    ).rejects.toMatchObject({ output: { statusCode: 500 } })
    expect(request.logger.error).toHaveBeenCalledWith(
      error,
      'Error displaying site notice print page'
    )
  })
})
