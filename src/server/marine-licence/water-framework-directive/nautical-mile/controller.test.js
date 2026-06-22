import { vi } from 'vitest'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import {
  nauticalMileSubmitController,
  NAUTICAL_MILE_VIEW_ROUTE,
  nauticalMileController
} from '#src/server/marine-licence/water-framework-directive/nautical-mile/controller.js'
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

      await nauticalMileController.handler(createMockRequest(), h)

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

    test('Should use check-your-answers back link with anchor when returnTo is set', async () => {
      const request = createMockRequest()
      request.yar.get.mockReturnValue(
        marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS
      )

      await nauticalMileController.handler(request, h)

      expect(h.view).toHaveBeenCalledWith(
        NAUTICAL_MILE_VIEW_ROUTE,
        expect.objectContaining({
          backLink: `${marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS}#water-framework-directive-card`
        })
      )
    })
  })

  describe('#nauticalMileSubmitController', () => {
    test('Should correctly redirect to excluded activities on success', async () => {
      await nauticalMileSubmitController.handler(
        createMockRequest({ payload: { nauticalMile: 'yes' } }),
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

    test('Should correctly redirect to task list when answer is no and no returnTo is set', async () => {
      await nauticalMileSubmitController.handler(
        createMockRequest({ payload: { nauticalMile: 'no' } }),
        h
      )

      expect(saveWaterFrameworkDirectiveToBackend).toHaveBeenCalledWith(
        expect.any(Object),
        true
      )
      expect(h.redirect).toHaveBeenCalledWith(
        marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
      )
    })

    test('Should redirect to check-your-answers with anchor when answer is no and returnTo is set', async () => {
      const request = createMockRequest({ payload: { nauticalMile: 'no' } })
      request.yar.get.mockReturnValue(
        marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS
      )

      await nauticalMileSubmitController.handler(request, h)

      expect(saveWaterFrameworkDirectiveToBackend).toHaveBeenCalledWith(
        expect.any(Object),
        true
      )
      expect(h.redirect).toHaveBeenCalledWith(
        `${marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS}#water-framework-directive-card`
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
        const request = createMockRequest({ payload })
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

    test('Should use check-your-answers back link with anchor in failAction when returnTo is set', () => {
      const request = createMockRequest({ payload: { nauticalMile: '' } })
      request.yar.get.mockReturnValue(
        marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS
      )
      nauticalMileSubmitController.options.validate.failAction(request, h, {})
      expect(h.view).toHaveBeenCalledWith(
        NAUTICAL_MILE_VIEW_ROUTE,
        expect.objectContaining({
          backLink: `${marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS}#water-framework-directive-card`
        })
      )
    })
  })
})
