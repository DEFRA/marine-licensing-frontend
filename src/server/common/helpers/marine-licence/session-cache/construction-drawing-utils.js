import { updateMarineLicenceSiteDetails } from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { authenticatedPatchRequest } from '#src/server/common/helpers/authenticated-requests.js'
import { apiRoutes } from '#src/server/common/constants/routes.js'

export const siteHasConstructionDrawings = (marineLicence, siteIndex) =>
  marineLicence.siteDetails[siteIndex]?.constructionDrawings?.length > 0

export async function seedFirstConstructionDrawingIfNeeded(
  request,
  h,
  marineLicence,
  siteIndex
) {
  if (siteHasConstructionDrawings(marineLicence, siteIndex)) {
    return
  }

  await authenticatedPatchRequest(request, apiRoutes.ADD_CONSTRUCTION_DRAWING, {
    siteIndex,
    id: marineLicence.id
  })

  const existingDrawings =
    marineLicence.siteDetails[siteIndex]?.constructionDrawings || []

  await updateMarineLicenceSiteDetails(
    request,
    h,
    siteIndex,
    'constructionDrawings',
    [...existingDrawings, {}]
  )
}
