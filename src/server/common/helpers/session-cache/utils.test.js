import { vi } from 'vitest'
import { PROJECT_TYPE_CACHE_KEY } from '#src/server/common/constants/cache.js'
import { PROJECT_TYPE } from '#src/server/common/constants/projects.js'
import {
  getProjectType,
  setProjectType
} from '#src/server/common/helpers/session-cache/utils.js'

describe('#getProjectType', () => {
  test('returns the stored project type', () => {
    const mockRequest = {
      yar: { get: vi.fn().mockReturnValue(PROJECT_TYPE.EXEMPTION) }
    }

    const result = getProjectType(mockRequest)

    expect(mockRequest.yar.get).toHaveBeenCalledWith(PROJECT_TYPE_CACHE_KEY)
    expect(result).toBe(PROJECT_TYPE.EXEMPTION)
  })

  test('returns null when no project type is stored', () => {
    const mockRequest = {
      yar: { get: vi.fn().mockReturnValue(null) }
    }

    const result = getProjectType(mockRequest)

    expect(result).toBeNull()
  })
})

describe('#setProjectType', () => {
  test('sets exemption project type in the session', async () => {
    const mockH = {}
    const mockRequest = {
      yar: { set: vi.fn(), commit: vi.fn().mockResolvedValue(undefined) }
    }

    await setProjectType(mockRequest, mockH, PROJECT_TYPE.EXEMPTION)

    expect(mockRequest.yar.set).toHaveBeenCalledWith(
      PROJECT_TYPE_CACHE_KEY,
      PROJECT_TYPE.EXEMPTION
    )
    expect(mockRequest.yar.commit).toHaveBeenCalledWith(mockH)
  })

  test('sets marine licence project type in the session', async () => {
    const mockH = {}
    const mockRequest = {
      yar: { set: vi.fn(), commit: vi.fn().mockResolvedValue(undefined) }
    }

    await setProjectType(mockRequest, mockH, PROJECT_TYPE.MARINE_LICENCE)

    expect(mockRequest.yar.set).toHaveBeenCalledWith(
      PROJECT_TYPE_CACHE_KEY,
      PROJECT_TYPE.MARINE_LICENCE
    )
    expect(mockRequest.yar.commit).toHaveBeenCalledWith(mockH)
  })
})
