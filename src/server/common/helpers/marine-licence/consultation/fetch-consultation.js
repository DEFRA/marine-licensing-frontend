import { authenticatedGetRequest } from '#src/server/common/helpers/authenticated-requests.js'
import { apiRoutes } from '#src/server/common/constants/routes.js'

export const fetchConsultation = async (request, marineLicenceId) => {
  const { payload } = await authenticatedGetRequest(
    request,
    apiRoutes.GET_CONSULTATION.replace('{marineLicenceId}', marineLicenceId)
  )

  return payload?.value?.consultation
}
