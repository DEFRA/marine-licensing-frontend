import { vi } from 'vitest'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import {
  previousAssessmentSubmitController,
  PREVIOUS_ASSESSMENT_VIEW_ROUTE,
  previousAssessmentController
} from '#src/server/marine-licence/water-framework-directive/previous-assessment/controller.js'
import * as cacheUtils from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import * as wfdCache from '#src/server/common/helpers/marine-licence/session-cache/water-framework-directive.js'
import { createMockH } from '#src/server/test-helpers/mocks/helpers.js'

vi.mock('~/src/server/common/helpers/marine-licence/session-cache/utils.js')

describe('#previousAssessment', () => {
  const h = createMockH()
  const mockLicence = {
    projectName: 'Test Project',
    id: 'test-id',
    waterFrameworkDirective: { previousAssessment: 'yes' }
  }

  beforeEach(() => {
    vi.spyOn(wfdCache, 'updateWaterFrameworkDirective').mockResolvedValue({
      previousAssessment: 'yes'
    })
    vi.spyOn(cacheUtils, 'getMarineLicenceCache').mockReturnValue(mockLicence)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('#previousAssessmentController', () => {
    test('Should correctly load page even without previous WFD data stored', async () => {
      const mockWithoutWfd = { ...mockLicence }
      delete mockWithoutWfd.waterFrameworkDirective
      vi.spyOn(cacheUtils, 'getMarineLicenceCache').mockReturnValueOnce(
        mockWithoutWfd
      )

      await previousAssessmentController.handler({ query: {} }, h)

      expect(h.view).toHaveBeenCalledWith(PREVIOUS_ASSESSMENT_VIEW_ROUTE, {
        backLink:
          marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_EXCLUDED_ACTIVITIES,
        cancelLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST,
        pageTitle:
          'Do you have a previous Water Framework Directive assessment completed between 2015 and 2022 for this type of activity?',
        heading:
          'Do you have a previous Water Framework Directive assessment completed between 2015 and 2022 for this type of activity?',
        projectName: mockLicence.projectName,
        payload: { previousAssessment: undefined }
      })
    })
  })

  describe('#previousAssessmentSubmitController', () => {
    test('Should update cache and redirect to previous assessment page on yes', async () => {
      await previousAssessmentSubmitController.handler(
        { payload: { previousAssessment: 'yes' }, query: {} },
        h
      )

      expect(wfdCache.updateWaterFrameworkDirective).toHaveBeenCalledWith(
        expect.any(Object),
        h,
        'previousAssessment',
        'yes'
      )
      expect(h.redirect).toHaveBeenCalledWith(
        marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_ASSESSMENT_CHANGED
      )
    })

    test('Should update cache and redirect to previous assessment page on no', async () => {
      await previousAssessmentSubmitController.handler(
        { payload: { previousAssessment: 'no' }, query: {} },
        h
      )

      expect(wfdCache.updateWaterFrameworkDirective).toHaveBeenCalledWith(
        expect.any(Object),
        h,
        'previousAssessment',
        'no'
      )
      expect(h.redirect).toHaveBeenCalledWith(
        marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_PREVIOUS_ASSESSMENT
      )
    })

    test.each([
      {
        name: 'null error details',
        payload: { previousAssessment: '' },
        err: { details: null },
        expectedExtra: {}
      },
      {
        name: 'missing error details',
        payload: { previousAssessment: '' },
        err: {},
        expectedExtra: {}
      },
      {
        name: 'invalid previous assessment value',
        payload: { previousAssessment: 'invalid' },
        err: {},
        expectedExtra: {}
      }
    ])(
      'Should correctly handle failAction with $name',
      ({ payload, err, expectedExtra }) => {
        const request = { payload }
        previousAssessmentSubmitController.options.validate.failAction(
          request,
          h,
          err
        )
        expect(h.view).toHaveBeenCalledWith(PREVIOUS_ASSESSMENT_VIEW_ROUTE, {
          backLink:
            marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_EXCLUDED_ACTIVITIES,
          cancelLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST,
          pageTitle:
            'Do you have a previous Water Framework Directive assessment completed between 2015 and 2022 for this type of activity?',
          heading:
            'Do you have a previous Water Framework Directive assessment completed between 2015 and 2022 for this type of activity?',
          projectName: mockLicence.projectName,
          payload,
          ...expectedExtra
        })
        expect(h.view().takeover).toHaveBeenCalled()
      }
    )
  })
})
