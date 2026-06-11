import { describe, test, expect, vi, beforeEach } from 'vitest'
import { saveWaterFrameworkDirectiveToBackend } from './save-water-framework-directive.js'
import { authenticatedPatchRequest } from '#src/server/common/helpers/authenticated-requests.js'
import { getMarineLicenceCache } from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { createMockRequest } from '#src/server/test-helpers/mocks/helpers.js'
import {
  mockMarineLicenceApplication,
  waterFrameworkDirective
} from '#src/server/test-helpers/mocks/marine-licence-mocks.js'
import { apiRoutes } from '#src/server/common/constants/routes.js'

vi.mock('#src/server/common/helpers/authenticated-requests.js')
vi.mock('#src/server/common/helpers/marine-licence/session-cache/utils.js')

describe('saveWaterFrameworkDirectiveToBackend', () => {
  const mockRequest = createMockRequest()

  beforeEach(() => {
    vi.mocked(getMarineLicenceCache).mockReturnValue(
      mockMarineLicenceApplication
    )
  })

  test('should save only nauticalMile when nauticalMileOnly is true', async () => {
    await saveWaterFrameworkDirectiveToBackend(mockRequest, true)

    expect(authenticatedPatchRequest).toHaveBeenCalledWith(
      mockRequest,
      apiRoutes.UPDATE_WATER_FRAMEWORK_DIRECTIVE,
      {
        waterFrameworkDirective: {
          nauticalMile: waterFrameworkDirective.nauticalMile
        },
        id: mockMarineLicenceApplication.id
      }
    )
  })

  test('should save full water framework directive', async () => {
    const { previousAssessment, ...wfdWithoutPreviousAssessment } =
      waterFrameworkDirective

    vi.mocked(getMarineLicenceCache).mockReturnValue({
      ...mockMarineLicenceApplication,
      waterFrameworkDirective: wfdWithoutPreviousAssessment
    })

    await saveWaterFrameworkDirectiveToBackend(mockRequest, false)

    expect(authenticatedPatchRequest).toHaveBeenCalledWith(
      mockRequest,
      apiRoutes.UPDATE_WATER_FRAMEWORK_DIRECTIVE,
      {
        waterFrameworkDirective: {
          nauticalMile: wfdWithoutPreviousAssessment.nauticalMile,
          assessmentChanged: wfdWithoutPreviousAssessment.assessmentChanged,
          excludedActivities: wfdWithoutPreviousAssessment.excludedActivities,
          previousAssessment: undefined
        },
        id: mockMarineLicenceApplication.id
      }
    )
  })
})
