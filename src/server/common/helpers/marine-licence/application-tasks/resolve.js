import { apiRoutes } from '#src/server/common/constants/routes.js'
import { authenticatedPostRequest } from '#src/server/common/helpers/authenticated-requests.js'

export const resolveApplicationTask = (request, marineLicenceId, taskId) =>
  authenticatedPostRequest(
    request,
    apiRoutes.RESOLVE_APPLICATION_TASK.replace(
      '{marineLicenceId}',
      marineLicenceId
    ).replace('{taskId}', taskId),
    {}
  )
