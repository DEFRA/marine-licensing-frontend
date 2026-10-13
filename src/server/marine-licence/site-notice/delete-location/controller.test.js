import {
  deleteLocationController,
  deleteLocationSubmitController,
  DELETE_LOCATION_VIEW_ROUTE
} from '#src/server/marine-licence/site-notice/delete-location/controller.js'
import * as authRequests from '#src/server/common/helpers/authenticated-requests.js'
import { getMarineLicenceService } from '#src/services/marine-licence-service/index.js'
import {
  mockMarineLicenceWithApplicationTask,
  mockApplicationTaskContactId
} from '#src/server/test-helpers/mocks/marine-licence-mocks.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import {
  createMockH,
  createMockRequest
} from '#src/server/test-helpers/mocks/helpers.js'
import * as authUtils from '#src/server/common/plugins/auth/utils.js'

vi.mock('#src/services/marine-licence-service/index.js')
vi.mock('#src/server/common/plugins/auth/utils.js')

describe('#deleteLocation', () => {
  const marineLicenceId = mockMarineLicenceWithApplicationTask.id
  const displayUrl = `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_DISPLAY}/${marineLicenceId}`
  const [evidence] = mockMarineLicenceWithApplicationTask.siteNoticeEvidence
  const marineLicenceWithTwoLocations = {
    ...mockMarineLicenceWithApplicationTask,
    siteNoticeEvidence: [evidence, evidence]
  }
  const runPre = async (marineLicence, location) => {
    vi.mocked(getMarineLicenceService).mockReturnValue({
      getMarineLicenceById: vi.fn().mockResolvedValue(marineLicence)
    })
    const h = { ...createMockH(), continue: Symbol('continue') }
    const request = createMockRequest({
      params: { marineLicenceId },
      query: { location }
    })
    let result
    for (const pre of deleteLocationController.options.pre) {
      result = await pre.method(request, h)
      if (result !== h.continue) {
        break
      }
    }
    return { h, request, result }
  }

  beforeEach(() => {
    vi.spyOn(authUtils, 'getUserSession').mockResolvedValue({
      contactId: mockApplicationTaskContactId
    })
    vi.spyOn(authRequests, 'authenticatedPatchRequest').mockResolvedValue({})
  })

  describe('pre handlers', () => {
    test('continues for a location after the first', async () => {
      const { h, request, result } = await runPre(
        marineLicenceWithTwoLocations,
        '2'
      )

      expect(result).toBe(h.continue)
      expect(request.marineLicence).toBe(marineLicenceWithTwoLocations)
    })

    test.each(['1', '3', '0', 'abc', undefined])(
      'redirects to display page for location %s',
      async (location) => {
        const { h } = await runPre(marineLicenceWithTwoLocations, location)

        expect(h.redirect).toHaveBeenCalledWith(displayUrl)
      }
    )

    test('redirects to display page when evidence has been sent', async () => {
      const { h } = await runPre(
        {
          ...marineLicenceWithTwoLocations,
          applicationTasks: marineLicenceWithTwoLocations.applicationTasks.map(
            (task) => ({
              ...task,
              resolvedAt: '2026-10-05T10:00:00.000Z'
            })
          )
        },
        '2'
      )

      expect(h.redirect).toHaveBeenCalledWith(displayUrl)
    })

    test('redirects to view details when there is no site notice task', async () => {
      const { h } = await runPre(
        { ...marineLicenceWithTwoLocations, applicationTasks: [] },
        '2'
      )

      expect(h.redirect).toHaveBeenCalledWith(
        `${marineLicenceRoutes.MARINE_LICENCE_VIEW_DETAILS}/${marineLicenceId}`
      )
    })
  })

  test('renders the confirmation page', () => {
    const h = createMockH()

    deleteLocationController.handler(
      createMockRequest({
        params: { marineLicenceId },
        query: { location: '2' },
        marineLicence: marineLicenceWithTwoLocations
      }),
      h
    )

    expect(h.view).toHaveBeenCalledWith(DELETE_LOCATION_VIEW_ROUTE, {
      pageTitle: 'Are you sure you want to delete location 2?',
      heading: 'Are you sure you want to delete location 2?',
      projectName: 'Test Project',
      backLink: `${displayUrl}#site-location-2`
    })
  })

  test('deletes the location and returns to the display page', async () => {
    const h = createMockH()

    await deleteLocationSubmitController.handler(
      createMockRequest({
        params: { marineLicenceId },
        query: { location: '2' }
      }),
      h
    )

    expect(authRequests.authenticatedPatchRequest).toHaveBeenCalledWith(
      expect.anything(),
      '/marine-licence/delete-site-notice-evidence',
      { id: marineLicenceId, evidenceIndex: 1 }
    )
    expect(h.redirect).toHaveBeenCalledWith(displayUrl)
  })

  test('throws when the API request fails', async () => {
    vi.mocked(authRequests.authenticatedPatchRequest).mockRejectedValue(
      new Error('API Error')
    )

    await expect(
      deleteLocationSubmitController.handler(
        createMockRequest({
          params: { marineLicenceId },
          query: { location: '2' }
        }),
        createMockH()
      )
    ).rejects.toThrow('Error deleting site notice location')
  })
})
