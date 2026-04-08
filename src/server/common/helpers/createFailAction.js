import {
  errorDescriptionByFieldName,
  mapErrorsForDisplay
} from '#src/server/common/helpers/errors.js'

export const createFailAction = ({
  getCache,
  viewRoute,
  settings,
  errorMessages,
  getBackLink
}) => {
  return (request, h, err) => {
    const { payload } = request
    const { projectName } = getCache(request)
    const backLink = getBackLink(request)

    if (!err.details) {
      return h
        .view(viewRoute, {
          ...settings,
          payload,
          projectName,
          backLink
        })
        .takeover()
    }

    const errorSummary = mapErrorsForDisplay(err.details, errorMessages)
    const errors = errorDescriptionByFieldName(errorSummary)

    return h
      .view(viewRoute, {
        ...settings,
        payload,
        projectName,
        backLink,
        errors,
        errorSummary
      })
      .takeover()
  }
}
