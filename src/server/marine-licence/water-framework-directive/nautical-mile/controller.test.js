import { vi } from 'vitest'
import {
  apiRoutes,
  marineLicenceRoutes
} from '#src/server/common/constants/routes.js'
import {
  nauticalMileSubmitController,
  NAUTICAL_MILE_VIEW_ROUTE,
  nauticalMileController
} from '#src/server/marine-licence/water-framework-directive/nautical-mile/controller.js'
import * as cacheUtils from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import * as wfdCache from '#src/server/common/helpers/marine-licence/session-cache/water-framework-directive.js'
import { createMockH } from '#src/server/test-helpers/mocks/helpers.js'
import { authenticatedPatchRequest } from '#src/server/common/helpers/authenticated-requests.js'

vi.mock('~/src/server/common/helpers/marine-licence/session-cache/utils.js')
vi.mock('~/src/server/common/helpers/authenticated-requests.js')

describe('#nauticalMile', () => {
  const h = createMockH()
  const mockLicence = {
    projectName: 'Test Project',
    id: 'test-id',
    waterFrameworkDirective: { nauticalMile: 'yes' }
  }

  beforeEach(() => {
    vi.spyOn(wfdCache, 'updateWaterFrameworkDirective').mockResolvedValue({
      nauticalMile: 'yes'
    })
    vi.spyOn(cacheUtils, 'getMarineLicenceCache').mockReturnValue(mockLicence)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('#nauticalMileController', () => {
    test('Should correctly load page even without previous WFD data stored', async () => {
      const mockWithouWfd = { ...mockLicence }
      delete mockWithouWfd.waterFrameworkDirective
      vi.spyOn(cacheUtils, 'getMarineLicenceCache').mockReturnValueOnce(
        mockWithouWfd
      )

      await nauticalMileController.handler({ query: {} }, h)

      expect(h.view).toHaveBeenCalledWith(NAUTICAL_MILE_VIEW_ROUTE, {
        backLink:
          marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_BEFORE_YOU_START,
        cancelLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST,
        pageTitle:
          'Is your project located within one nautical mile (1.85km) of the coast?',
        heading:
          'Is your project located within one nautical mile (1.85km) of the coast?',
        projectName: mockLicence.projectName,
        payload: { nauticalMile: undefined }
      })
    })
  })

  describe('#nauticalMileSubmitController', () => {
    test('Should correctly redirect to nautical mile page on success', async () => {
      await nauticalMileSubmitController.handler(
        { payload: { nauticalMile: 'yes' }, query: {} },
        h
      )

      expect(wfdCache.updateWaterFrameworkDirective).toHaveBeenCalledWith(
        expect.any(Object),
        h,
        'nauticalMile',
        'yes'
      )
      expect(h.redirect).toHaveBeenCalledWith(
        marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_EXCLUDED_ACTIVITIES
      )
    })

    test('Should correctly redirect when answer is no', async () => {
      await nauticalMileSubmitController.handler(
        { payload: { nauticalMile: 'no' }, query: {} },
        h
      )

      expect(authenticatedPatchRequest).toHaveBeenCalledWith(
        expect.any(Object),
        apiRoutes.UPDATE_WATER_FRAMEWORK_DIRECTIVE,
        { waterFrameworkDirective: { nauticalMile: 'no' }, id: mockLicence.id }
      )
      expect(h.redirect).toHaveBeenCalledWith(
        marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
      )
    })

    test.each([
      {
        name: 'null error details',
        payload: { nauticalMile: '' },
        err: { details: null },
        expectedExtra: {}
      },
      {
        name: 'missing error details',
        payload: { nauticalMile: '' },
        err: {},
        expectedExtra: {}
      },
      {
        name: 'invalid agree value',
        payload: { nauticalMile: 'invalid' },
        err: {},
        expectedExtra: {}
      }
    ])(
      'Should correctly handle failAction with $name',
      ({ payload, err, expectedExtra }) => {
        const request = { payload }
        nauticalMileSubmitController.options.validate.failAction(
          request,
          h,
          err
        )
        expect(h.view).toHaveBeenCalledWith(NAUTICAL_MILE_VIEW_ROUTE, {
          backLink:
            marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_BEFORE_YOU_START,
          cancelLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST,
          pageTitle:
            'Is your project located within one nautical mile (1.85km) of the coast?',
          heading:
            'Is your project located within one nautical mile (1.85km) of the coast?',
          projectName: mockLicence.projectName,
          payload,
          ...expectedExtra
        })
        expect(h.view().takeover).toHaveBeenCalled()
      }
    )
  })
})
