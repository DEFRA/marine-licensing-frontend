import { vi } from 'vitest'
import {
  siteHasConstructionDrawings,
  seedFirstConstructionDrawingIfNeeded
} from '#src/server/common/helpers/marine-licence/session-cache/construction-drawing-utils.js'
import { updateMarineLicenceSiteDetails } from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { authenticatedPatchRequest } from '#src/server/common/helpers/authenticated-requests.js'
import { apiRoutes } from '#src/server/common/constants/routes.js'

vi.mock('~/src/server/common/helpers/marine-licence/session-cache/utils.js')
vi.mock('~/src/server/common/helpers/authenticated-requests.js')

describe('#constructionDrawingUtils', () => {
  const marineLicence = {
    id: 'test-id',
    siteDetails: [{ constructionDrawings: [] }]
  }

  describe('siteHasConstructionDrawings', () => {
    test('returns false when there are no drawings', () => {
      expect(siteHasConstructionDrawings(marineLicence, 0)).toBe(false)
    })

    test('returns true when there is at least one drawing', () => {
      const withDrawing = {
        siteDetails: [{ constructionDrawings: [{}] }]
      }
      expect(siteHasConstructionDrawings(withDrawing, 0)).toBe(true)
    })
  })

  describe('seedFirstConstructionDrawingIfNeeded', () => {
    const request = {}
    const h = {}

    afterEach(() => {
      vi.clearAllMocks()
    })

    test('patches the backend and appends an empty drawing to the cache when none exist', async () => {
      await seedFirstConstructionDrawingIfNeeded(request, h, marineLicence, 0)

      expect(authenticatedPatchRequest).toHaveBeenCalledWith(
        request,
        apiRoutes.ADD_CONSTRUCTION_DRAWING,
        { siteIndex: 0, id: marineLicence.id }
      )
      expect(updateMarineLicenceSiteDetails).toHaveBeenCalledWith(
        request,
        h,
        0,
        'constructionDrawings',
        [{}]
      )
    })

    test('does nothing when the site already has a construction drawing', async () => {
      const withDrawing = {
        id: 'test-id',
        siteDetails: [{ constructionDrawings: [{ filename: 'existing.pdf' }] }]
      }

      await seedFirstConstructionDrawingIfNeeded(request, h, withDrawing, 0)

      expect(authenticatedPatchRequest).not.toHaveBeenCalled()
      expect(updateMarineLicenceSiteDetails).not.toHaveBeenCalled()
    })
  })
})
