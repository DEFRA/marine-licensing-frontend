import { vi } from 'vitest'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import {
  nauticalMileSubmitController,
  NAUTICAL_MILE_VIEW_ROUTE
} from '#src/server/marine-licence/water-framework-directive/nautical-mile/controller.js'
import * as cacheUtils from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import * as wfdCache from '#src/server/common/helpers/marine-licence/session-cache/water-framework-directive.js'

vi.mock('~/src/server/common/helpers/marine-licence/session-cache/utils.js')

describe('#nauticalMile', () => {
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

  describe('#nauticalMileSubmitController', () => {
    test('Should correctly redirect to nautical mile page on success', async () => {
      const h = {
        redirect: vi.fn().mockReturnValue({ takeover: vi.fn() }),
        view: vi.fn()
      }

      await nauticalMileSubmitController.handler(
        { payload: { nauticalMiles: 'yes' }, query: {} },
        h
      )

      expect(wfdCache.updateWaterFrameworkDirective).toHaveBeenCalledWith(
        expect.any(Object),
        h,
        'nauticalMile',
        'yes'
      )
      expect(h.redirect).toHaveBeenCalledWith(
        marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_NAUTICAL_MILE
      )
    })

    test('Should correctly redirect when answer is no', async () => {
      const h = {
        redirect: vi.fn().mockReturnValue({ takeover: vi.fn() }),
        view: vi.fn()
      }

      await nauticalMileSubmitController.handler(
        { payload: { nauticalMiles: 'no' }, query: {} },
        h
      )

      expect(wfdCache.updateWaterFrameworkDirective).toHaveBeenCalledWith(
        expect.any(Object),
        h,
        'nauticalMile',
        'no'
      )
      expect(h.redirect).toHaveBeenCalledWith(
        marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_NAUTICAL_MILE
      )
    })

    test.each([
      {
        name: 'null error details',
        payload: { nauticalMiles: '' },
        err: { details: null },
        expectedExtra: {}
      },
      {
        name: 'missing error details',
        payload: { nauticalMiles: '' },
        err: {},
        expectedExtra: {}
      },
      {
        name: 'invalid agree value',
        payload: { nauticalMiles: 'invalid' },
        err: {},
        expectedExtra: {}
      }
    ])(
      'Should correctly handle failAction with $name',
      ({ payload, err, expectedExtra }) => {
        const request = { payload }
        const h = { view: vi.fn().mockReturnValue({ takeover: vi.fn() }) }
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
