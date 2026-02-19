import { getUserSession } from '#src/server/common/plugins/auth/utils.js'
import {
  errorDescriptionByFieldName,
  mapErrorsForDisplay
} from '#src/server/common/helpers/errors.js'
import { routes } from '#src/server/common/constants/routes.js'

export const createConfirmFailAction = ({
  viewRoute,
  errorMessages,
  generateHeadingText
}) => {
  return async (request, h, err) => {
    const { payload } = request
    const userSession = await getUserSession(
      request,
      request.state?.userSession
    )
    const errorSummary = mapErrorsForDisplay(
      err.details,
      errorMessages(userSession)
    )
    const errors = errorDescriptionByFieldName(errorSummary)
    const heading = generateHeadingText(userSession)
    const { organisationName, hasMultipleOrgPickerEntries } = userSession

    return h
      .view(viewRoute, {
        backLink: `${routes.CHANGE_ORGANISATION}?skipRedirect=true`,
        heading,
        pageTitle: heading,
        payload,
        organisationName,
        hasMultipleOrgPickerEntries,
        errors,
        errorSummary
      })
      .takeover()
  }
}
