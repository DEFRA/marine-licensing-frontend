import { apiRoutes } from '#src/server/common/constants/routes.js'
import { authenticatedPatchRequest } from '#src/server/common/helpers/authenticated-requests.js'
import { getMarineLicenceCache } from '#src/server/common/helpers/marine-licence/session-cache/utils.js'

export const saveWaterFrameworkDirectiveToBackend = async (
  request,
  nauticalMileOnly
) => {
  const marineLicence = getMarineLicenceCache(request)

  const { waterFrameworkDirective } = marineLicence

  const { nauticalMile } = waterFrameworkDirective

  let dataToSave = { nauticalMile }

  if (!nauticalMileOnly) {
    const {
      assessmentChanged,
      excludedActivities,
      previousAssessment,
      uploadedFile,
      s3Location
    } = waterFrameworkDirective

    dataToSave = {
      ...dataToSave,
      assessmentChanged,
      excludedActivities,
      previousAssessment,
      uploadedFile,
      s3Location
    }
  }

  await authenticatedPatchRequest(
    request,
    apiRoutes.UPDATE_WATER_FRAMEWORK_DIRECTIVE,
    {
      waterFrameworkDirective: dataToSave,
      id: marineLicence.id
    }
  )
}
