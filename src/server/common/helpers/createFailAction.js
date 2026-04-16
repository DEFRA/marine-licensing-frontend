import {
  errorDescriptionByFieldName,
  mapErrorsForDisplay
} from '#src/server/common/helpers/errors.js'

export const createFailAction = ({
  viewRoute,
  settings,
  errorMessages,
  projectName,
  backLink,
  payload,
  params
}) => {
  return (_request, h, err) => {
    if (!err.details) {
      return h
        .view(viewRoute, {
          ...settings,
          payload,
          projectName,
          backLink,
          ...params
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
        ...params,
        errors,
        errorSummary,
        ...params
      })
      .takeover()
  }
}
