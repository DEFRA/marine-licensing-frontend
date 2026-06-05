import { vi } from 'vitest'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import {
  excludedActivitiesSubmitController,
  EXCLUDED_ACTIVITIES_VIEW_ROUTE,
  excludedActivitiesController
} from '#src/server/marine-licence/water-framework-directive/excluded-activities/controller.js'
import * as cacheUtils from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import * as wfdCache from '#src/server/common/helpers/marine-licence/session-cache/water-framework-directive.js'
import { createMockH } from '#src/server/test-helpers/mocks/helpers.js'

vi.mock('~/src/server/common/helpers/marine-licence/session-cache/utils.js')

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

      await excludedActivitiesController.handler({ query: {} }, h)

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
    test('Should update cache and redirect to excluded activities page on yes', async () => {
      await excludedActivitiesSubmitController.handler(
        { payload: { excludedActivities: 'yes' }, query: {} },
        h
      )

      expect(wfdCache.updateWaterFrameworkDirective).toHaveBeenCalledWith(
        expect.any(Object),
        h,
        'excludedActivities',
        'yes'
      )
      expect(h.redirect).toHaveBeenCalledWith(
        marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_PREVIOUS_ASSESSMENT
      )
    })

    test('Should update cache and redirect to excluded activities page on no', async () => {
      await excludedActivitiesSubmitController.handler(
        { payload: { excludedActivities: 'no' }, query: {} },
        h
      )

      expect(wfdCache.updateWaterFrameworkDirective).toHaveBeenCalledWith(
        expect.any(Object),
        h,
        'excludedActivities',
        'no'
      )
      expect(h.redirect).toHaveBeenCalledWith(
        marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_PREVIOUS_ASSESSMENT
      )
    })

    test.each([
      {
        name: 'null error details',
        payload: { excludedActivities: '' },
        err: { details: null },
        expectedExtra: {}
      },
      {
        name: 'missing error details',
        payload: { excludedActivities: '' },
        err: {},
        expectedExtra: {}
      },
      {
        name: 'invalid excluded activities value',
        payload: { excludedActivities: 'invalid' },
        err: {},
        expectedExtra: {}
      }
    ])(
      'Should correctly handle failAction with $name',
      ({ payload, err, expectedExtra }) => {
        const request = { payload }
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
          payload,
          ...expectedExtra
        })
        expect(h.view().takeover).toHaveBeenCalled()
      }
    )
  })
})
