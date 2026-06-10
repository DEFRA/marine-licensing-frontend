import { vi } from 'vitest'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import {
  assessmentChangedSubmitController,
  ASSESSMENT_CHANGED_VIEW_ROUTE,
  assessmentChangedController
} from '#src/server/marine-licence/water-framework-directive/assessment-changed/controller.js'
import * as cacheUtils from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import * as wfdCache from '#src/server/common/helpers/marine-licence/session-cache/water-framework-directive.js'
import { createMockH } from '#src/server/test-helpers/mocks/helpers.js'

vi.mock('~/src/server/common/helpers/marine-licence/session-cache/utils.js')

describe('#assessmentChanged', () => {
  const h = createMockH()
  const mockLicence = {
    projectName: 'Test Project',
    id: 'test-id',
    waterFrameworkDirective: { assessmentChanged: 'yes' }
  }

  beforeEach(() => {
    vi.spyOn(wfdCache, 'updateWaterFrameworkDirective').mockResolvedValue({
      assessmentChanged: 'yes'
    })
    vi.spyOn(cacheUtils, 'getMarineLicenceCache').mockReturnValue(mockLicence)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('#assessmentChangedController', () => {
    test('Should correctly load page even without previous WFD data stored', async () => {
      const mockWithoutWfd = { ...mockLicence }
      delete mockWithoutWfd.waterFrameworkDirective
      vi.spyOn(cacheUtils, 'getMarineLicenceCache').mockReturnValueOnce(
        mockWithoutWfd
      )

      await assessmentChangedController.handler({ query: {} }, h)

      expect(h.view).toHaveBeenCalledWith(ASSESSMENT_CHANGED_VIEW_ROUTE, {
        backLink:
          marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_PREVIOUS_ASSESSMENT,
        cancelLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST,
        pageTitle:
          'Has anything changed since your previous Water Framework Directive assessment?',
        heading:
          'Has anything changed since your previous Water Framework Directive assessment?',
        projectName: mockLicence.projectName,
        payload: { assessmentChanged: undefined }
      })
    })
  })

  describe('#assessmentChangedSubmitController', () => {
    test('Should update cache and redirect to assessment changed page on yes', async () => {
      await assessmentChangedSubmitController.handler(
        { payload: { assessmentChanged: 'yes' }, query: {} },
        h
      )

      expect(wfdCache.updateWaterFrameworkDirective).toHaveBeenCalledWith(
        expect.any(Object),
        h,
        'assessmentChanged',
        'yes'
      )
      expect(h.redirect).toHaveBeenCalledWith(
        marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_ASSESSMENT_CHANGED
      )
    })

    test('Should update cache and redirect to assessment changed page on no', async () => {
      await assessmentChangedSubmitController.handler(
        { payload: { assessmentChanged: 'no' }, query: {} },
        h
      )

      expect(wfdCache.updateWaterFrameworkDirective).toHaveBeenCalledWith(
        expect.any(Object),
        h,
        'assessmentChanged',
        'no'
      )
      expect(h.redirect).toHaveBeenCalledWith(
        marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_ASSESSMENT_CHANGED
      )
    })

    test.each([
      {
        name: 'null error details',
        payload: { assessmentChanged: '' },
        err: { details: null },
        expectedExtra: {}
      },
      {
        name: 'missing error details',
        payload: { assessmentChanged: '' },
        err: {},
        expectedExtra: {}
      },
      {
        name: 'invalid assessment changed value',
        payload: { assessmentChanged: 'invalid' },
        err: {},
        expectedExtra: {}
      }
    ])(
      'Should correctly handle failAction with $name',
      ({ payload, err, expectedExtra }) => {
        const request = { payload }
        assessmentChangedSubmitController.options.validate.failAction(
          request,
          h,
          err
        )
        expect(h.view).toHaveBeenCalledWith(ASSESSMENT_CHANGED_VIEW_ROUTE, {
          backLink:
            marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_PREVIOUS_ASSESSMENT,
          cancelLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST,
          pageTitle:
            'Has anything changed since your previous Water Framework Directive assessment?',
          heading:
            'Has anything changed since your previous Water Framework Directive assessment?',
          projectName: mockLicence.projectName,
          payload,
          ...expectedExtra
        })
        expect(h.view().takeover).toHaveBeenCalled()
      }
    )
  })
})
