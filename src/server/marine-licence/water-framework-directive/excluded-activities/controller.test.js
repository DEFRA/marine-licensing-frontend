import { vi } from 'vitest'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import {
  excludedActivitiesSubmitController,
  EXCLUDED_ACTIVITIES_VIEW_ROUTE,
  excludedActivitiesController
} from '#src/server/marine-licence/water-framework-directive/excluded-activities/controller.js'
import * as cacheUtils from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import * as wfdCache from '#src/server/common/helpers/marine-licence/session-cache/water-framework-directive.js'
import {
  createMockH,
  createMockRequest
} from '#src/server/test-helpers/mocks/helpers.js'
import { saveWaterFrameworkDirectiveToBackend } from '#src/server/common/helpers/marine-licence/water-framework-directive/save-water-framework-directive.js'

vi.mock('~/src/server/common/helpers/marine-licence/session-cache/utils.js')
vi.mock(
  '~/src/server/common/helpers/marine-licence/water-framework-directive/save-water-framework-directive.js'
)

describe('#excludedActivities', () => {
  const h = createMockH()
  const mockLicence = {
    projectName: 'Test Project',
    id: 'test-id',
    waterFrameworkDirective: { excludedActivities: 'yes' }
  }

  beforeEach(() => {
    vi.spyOn(wfdCache, 'updateWaterFrameworkDirective').mockResolvedValue({
      excludedActivities: 'yes'
    })
    vi.spyOn(wfdCache, 'getWaterFrameworkDirectiveReturnRoute').mockReturnValue(
      undefined
    )
    vi.spyOn(cacheUtils, 'getMarineLicenceCache').mockReturnValue(mockLicence)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('#excludedActivitiesController', () => {
    test('Should correctly load page even without previous WFD data stored', async () => {
      const mockWithoutWfd = { ...mockLicence }
      delete mockWithoutWfd.waterFrameworkDirective
      vi.spyOn(cacheUtils, 'getMarineLicenceCache').mockReturnValueOnce(
        mockWithoutWfd
      )

      await excludedActivitiesController.handler(createMockRequest(), h)

      expect(h.view).toHaveBeenCalledWith(EXCLUDED_ACTIVITIES_VIEW_ROUTE, {
        backLink:
          marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_NAUTICAL_MILE,
        cancelLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST,
        pageTitle:
          'Is your project limited to one of the following excluded activities?',
        heading:
          'Is your project limited to one of the following excluded activities?',
        projectName: mockLicence.projectName,
        payload: { excludedActivities: undefined }
      })
    })
  })

  describe('#excludedActivitiesSubmitController', () => {
    test('Should update cache and redirect to review details page on yes', async () => {
      await excludedActivitiesSubmitController.handler(
        createMockRequest({ payload: { excludedActivities: 'yes' } }),
        h
      )

      expect(wfdCache.updateWaterFrameworkDirective).toHaveBeenCalledWith(
        expect.any(Object),
        h,
        'excludedActivities',
        'yes'
      )

      expect(saveWaterFrameworkDirectiveToBackend).toHaveBeenCalledWith(
        expect.any(Object)
      )
      expect(h.redirect).toHaveBeenCalledWith(
        marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_REVIEW_YOUR_ANSWERS
      )
    })

    test('Should update cache and redirect to file upload page on no', async () => {
      await excludedActivitiesSubmitController.handler(
        createMockRequest({ payload: { excludedActivities: 'no' } }),
        h
      )

      expect(wfdCache.updateWaterFrameworkDirective).toHaveBeenCalledWith(
        expect.any(Object),
        h,
        'excludedActivities',
        'no'
      )
      expect(h.redirect).toHaveBeenCalledWith(
        marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_FILE_UPLOAD
      )
    })

    test('Should redirect to review-your-answers when action=change and answer is yes', async () => {
      vi.spyOn(
        wfdCache,
        'getWaterFrameworkDirectiveReturnRoute'
      ).mockReturnValue(
        marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_REVIEW_YOUR_ANSWERS
      )

      await excludedActivitiesSubmitController.handler(
        createMockRequest({
          payload: { excludedActivities: 'yes' },
          query: { action: 'change' }
        }),
        h
      )

      expect(h.redirect).toHaveBeenCalledWith(
        marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_REVIEW_YOUR_ANSWERS
      )
    })

    test.each([
      {
        name: 'null error details',
        payload: { excludedActivities: '' },
        err: { details: null }
      },
      {
        name: 'missing error details',
        payload: { excludedActivities: '' },
        err: {}
      },
      {
        name: 'invalid excluded activities value',
        payload: { excludedActivities: 'invalid' },
        err: {}
      }
    ])('Should correctly handle failAction with $name', ({ payload, err }) => {
      const request = createMockRequest({ payload })
      excludedActivitiesSubmitController.options.validate.failAction(
        request,
        h,
        err
      )
      expect(h.view).toHaveBeenCalledWith(EXCLUDED_ACTIVITIES_VIEW_ROUTE, {
        backLink:
          marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_NAUTICAL_MILE,
        cancelLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST,
        pageTitle:
          'Is your project limited to one of the following excluded activities?',
        heading:
          'Is your project limited to one of the following excluded activities?',
        projectName: mockLicence.projectName,
        payload
      })
      expect(h.view().takeover).toHaveBeenCalled()
    })
  })
})
