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

  test('should save only nauticalMile when nauticalMile is "no" ', async () => {
    const mockMarineLicenceApplicationWithoutNauticalMile = {
      ...mockMarineLicenceApplication,
      waterFrameworkDirective: {
        ...mockMarineLicenceApplication.waterFrameworkDirective
      }
    }

    mockMarineLicenceApplicationWithoutNauticalMile.waterFrameworkDirective.nauticalMile =
      'no'

    getMarineLicenceCache.mockReturnValueOnce(
      mockMarineLicenceApplicationWithoutNauticalMile
    )

    await saveWaterFrameworkDirectiveToBackend(mockRequest)

    expect(authenticatedPatchRequest).toHaveBeenCalledWith(
      mockRequest,
      apiRoutes.UPDATE_WATER_FRAMEWORK_DIRECTIVE,
      {
        waterFrameworkDirective: {
          nauticalMile: 'no'
        },
        id: mockMarineLicenceApplication.id
      }
    )
  })

  test('should save full water framework directive', async () => {
    await saveWaterFrameworkDirectiveToBackend(mockRequest)

    expect(authenticatedPatchRequest).toHaveBeenCalledWith(
      mockRequest,
      apiRoutes.UPDATE_WATER_FRAMEWORK_DIRECTIVE,
      {
        waterFrameworkDirective: {
          nauticalMile: waterFrameworkDirective.nauticalMile,
          excludedActivities: waterFrameworkDirective.excludedActivities,
          s3Location: waterFrameworkDirective.s3Location,
          uploadedFile: waterFrameworkDirective.uploadedFile
        },
        id: mockMarineLicenceApplication.id
      }
    )
  })

  test('should save water framework directive when excluded activities is yes', async () => {
    const mockMarineLicenceApplicationWithExcludedActivities = {
      ...mockMarineLicenceApplication,
      waterFrameworkDirective: {
        ...mockMarineLicenceApplication.waterFrameworkDirective
      }
    }

    mockMarineLicenceApplicationWithExcludedActivities.waterFrameworkDirective.excludedActivities =
      'yes'

    getMarineLicenceCache.mockReturnValueOnce(
      mockMarineLicenceApplicationWithExcludedActivities
    )

    await saveWaterFrameworkDirectiveToBackend(mockRequest)

    expect(authenticatedPatchRequest).toHaveBeenCalledWith(
      mockRequest,
      apiRoutes.UPDATE_WATER_FRAMEWORK_DIRECTIVE,
      {
        waterFrameworkDirective: {
          nauticalMile: waterFrameworkDirective.nauticalMile,
          excludedActivities: 'yes'
        },
        id: mockMarineLicenceApplication.id
      }
    )
  })
})
