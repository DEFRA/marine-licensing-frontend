import { vi } from 'vitest'
import {
  apiRoutes,
  marineLicenceRoutes
} from '#src/server/common/constants/routes.js'
import {
  feeEstimateController,
  feeEstimateSubmitController,
  FEE_ESTIMATE_VIEW_ROUTE,
  FEES_TERMS_AND_CONDITIONS_URL,
  FEES_URL
} from '#src/server/marine-licence/fee-estimate/controller.js'
import * as cacheUtils from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import * as authRequests from '#src/server/common/helpers/authenticated-requests.js'
import { createMockRequest } from '#src/server/test-helpers/mocks/helpers.js'
import {
  FEE_ESTIMATE_AMOUNT,
  FEE_ESTIMATE_MONITORING_AMOUNT
} from '#src/server/common/validation/fee-estimate/constants.js'

vi.mock('#src/server/common/helpers/marine-licence/session-cache/utils.js')

describe('#feeEstimate', () => {
  const mockLicence = {
    projectName: 'Test Project',
    id: 'test-id'
  }

  const validPayload = {
    termsAndConditions: 'true',
    accept: 'yes',
    feeBand: '2A'
  }

  const request = createMockRequest()

  beforeEach(() => {
    vi.spyOn(authRequests, 'authenticatedPatchRequest').mockResolvedValue({
      payload: { id: mockLicence.id }
    })
    vi.spyOn(cacheUtils, 'getMarineLicenceCache').mockReturnValue(mockLicence)
    vi.spyOn(cacheUtils, 'setMarineLicenceCache').mockResolvedValue()
  })

  describe('#feeEstimateController', () => {
    test('should render view with project data from cache', async () => {
      const h = { view: vi.fn() }
      await feeEstimateController.handler(request, h)
      expect(h.view).toHaveBeenCalledWith(FEE_ESTIMATE_VIEW_ROUTE, {
        pageTitle: 'Fee estimate',
        heading: 'Fee estimate',
        projectName: mockLicence.projectName,
        feesUrl: FEES_URL,
        feesTermsAndConditionsUrl: FEES_TERMS_AND_CONDITIONS_URL,
        payload: {
          termsAndConditions: undefined,
          accept: undefined,
          feeBand: '2A'
        },
        backLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST,
        cancelLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST,
        amount: FEE_ESTIMATE_AMOUNT,
        monitoringAmount: FEE_ESTIMATE_MONITORING_AMOUNT
      })
    })

    test('should render view with existing fee estimate data from cache', async () => {
      vi.spyOn(cacheUtils, 'getMarineLicenceCache').mockReturnValue({
        ...mockLicence,
        feeEstimate: {
          termsAndConditions: 'true',
          accept: 'yes',
          feeBand: '2A'
        }
      })
      const h = { view: vi.fn() }
      await feeEstimateController.handler(request, h)
      expect(h.view).toHaveBeenCalledWith(FEE_ESTIMATE_VIEW_ROUTE, {
        pageTitle: 'Fee estimate',
        heading: 'Fee estimate',
        projectName: mockLicence.projectName,
        feesUrl: FEES_URL,
        feesTermsAndConditionsUrl: FEES_TERMS_AND_CONDITIONS_URL,
        payload: {
          termsAndConditions: 'true',
          accept: 'yes',
          feeBand: '2A'
        },
        backLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST,
        cancelLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST,
        amount: FEE_ESTIMATE_AMOUNT,
        monitoringAmount: FEE_ESTIMATE_MONITORING_AMOUNT
      })
    })

    test('should render view with check-your-answers backLink and no cancelLink when cache value is set', async () => {
      const request = createMockRequest()
      request.yar.get.mockReturnValue(
        marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS
      )
      const h = { view: vi.fn() }

      await feeEstimateController.handler(request, h)

      expect(h.view).toHaveBeenCalledWith(
        FEE_ESTIMATE_VIEW_ROUTE,
        expect.objectContaining({
          backLink: `${marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS}#fee-estimate-card`,
          cancelLink: undefined
        })
      )
    })
  })

  describe('#feeEstimateSubmitController', () => {
    test('should call the API with correct payload', async () => {
      const h = { redirect: vi.fn(), view: vi.fn() }
      await feeEstimateSubmitController.handler(
        { ...request, payload: validPayload },
        h
      )

      expect(authRequests.authenticatedPatchRequest).toHaveBeenCalledWith(
        expect.any(Object),
        apiRoutes.UPDATE_FEE_ESTIMATE,
        {
          termsAndConditions: 'true',
          accept: 'yes',
          feeBand: '2A',
          id: mockLicence.id
        }
      )
    })

    test('should save to cache and redirect to task list on success', async () => {
      const h = { redirect: vi.fn(), view: vi.fn() }

      const requestWithPayload = { ...request, payload: validPayload }

      await feeEstimateSubmitController.handler(requestWithPayload, h)

      expect(cacheUtils.setMarineLicenceCache).toHaveBeenCalledWith(
        requestWithPayload,
        h,
        {
          ...mockLicence,
          feeEstimate: {
            termsAndConditions: 'true',
            accept: 'yes',
            feeBand: '2A'
          }
        }
      )
      expect(h.redirect).toHaveBeenCalledWith(
        marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
      )
    })

    test('should save to cache and redirect to are you sure page when accept is no', async () => {
      const h = { redirect: vi.fn(), view: vi.fn() }
      const request = {
        payload: {
          ...validPayload,
          accept: 'no'
        }
      }

      await feeEstimateSubmitController.handler(request, h)

      expect(cacheUtils.setMarineLicenceCache).toHaveBeenCalledWith(
        request,
        h,
        {
          ...mockLicence,
          feeEstimate: {
            termsAndConditions: 'true',
            accept: 'no',
            feeBand: '2A'
          }
        }
      )
      expect(h.redirect).toHaveBeenCalledWith(
        marineLicenceRoutes.MARINE_LICENCE_FEE_ESTIMATE_ARE_YOU_SURE
      )
    })

    test('should handle API validation errors and re-render view', async () => {
      vi.spyOn(authRequests, 'authenticatedPatchRequest').mockRejectedValueOnce(
        {
          data: {
            payload: {
              validation: {
                details: [
                  {
                    path: ['accept'],
                    message: 'FEE_ESTIMATE_ACCEPT_REQUIRED',
                    type: 'any.required'
                  }
                ]
              }
            }
          }
        }
      )

      const h = { redirect: vi.fn(), view: vi.fn() }

      await feeEstimateSubmitController.handler(
        { ...request, payload: validPayload },
        h
      )

      expect(h.view).toHaveBeenCalledWith(
        FEE_ESTIMATE_VIEW_ROUTE,
        expect.objectContaining({
          backLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST,
          payload: validPayload,
          errorSummary: expect.any(Array),
          errors: expect.any(Object)
        })
      )
    })

    test.each([
      {
        name: 'null error details',
        payload: { termsAndConditions: '', accept: '', feeBand: '2A' },
        err: { details: null },
        expectedExtra: {}
      },
      {
        name: 'missing error details',
        payload: { termsAndConditions: '', accept: '', feeBand: '2A' },
        err: {},
        expectedExtra: {}
      }
    ])(
      'should correctly handle failAction with $name',
      ({ payload, err, expectedExtra }) => {
        const requestWithPayload = { ...request, payload }
        const h = { view: vi.fn().mockReturnValue({ takeover: vi.fn() }) }
        feeEstimateSubmitController.options.validate.failAction(
          requestWithPayload,
          h,
          err
        )
        expect(h.view).toHaveBeenCalledWith(FEE_ESTIMATE_VIEW_ROUTE, {
          pageTitle: 'Fee estimate',
          heading: 'Fee estimate',
          projectName: mockLicence.projectName,
          feesUrl: FEES_URL,
          feesTermsAndConditionsUrl: FEES_TERMS_AND_CONDITIONS_URL,
          backLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST,
          cancelLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST,
          amount: FEE_ESTIMATE_AMOUNT,
          monitoringAmount: FEE_ESTIMATE_MONITORING_AMOUNT,
          payload,
          ...expectedExtra
        })
        expect(h.view().takeover).toHaveBeenCalled()
      }
    )

    test('should render view with errors when failAction has details', () => {
      const payload = { termsAndConditions: '', accept: '', feeBand: '2A' }
      const err = {
        details: [
          {
            path: ['termsAndConditions'],
            message: 'FEE_ESTIMATE_TERMS_AND_CONDITIONS_REQUIRED',
            type: 'any.required'
          },
          {
            path: ['accept'],
            message: 'FEE_ESTIMATE_ACCEPT_REQUIRED',
            type: 'any.required'
          }
        ]
      }
      const requestWithPayload = { ...request, payload }
      const h = { view: vi.fn().mockReturnValue({ takeover: vi.fn() }) }

      feeEstimateSubmitController.options.validate.failAction(
        requestWithPayload,
        h,
        err
      )

      expect(h.view).toHaveBeenCalledWith(
        FEE_ESTIMATE_VIEW_ROUTE,
        expect.objectContaining({
          backLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST,
          payload,
          errorSummary: expect.any(Array),
          errors: expect.any(Object)
        })
      )
      expect(h.view().takeover).toHaveBeenCalled()
    })
  })
})
