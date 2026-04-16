import {
  errorDescriptionByFieldName,
  mapErrorsForDisplay
} from '#src/server/common/helpers/errors.js'

export const createFailAction = ({
  viewRoute,
  settings,
  errorMessages,
<<<<<<< ML-1194-LCML-How-do-you-want-to-enter-the-site-coordinates-page
  projectName,
  backLink,
  payload,
=======
  getBackLink,
>>>>>>> main
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
