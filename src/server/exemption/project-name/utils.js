/**
 * Outputs all errors to an object with the field name as the key
 * Used in the view template to show errors inline
 */
export const errorDescriptionByFieldName = (errors = []) => {
  return errors.reduce((error, obj) => {
    error[obj.field] = obj
    return error
  }, {})
}

/**
 * Converts back end error codes to a user readable description
 */
export const mapErrorMessage = (error) => {
  switch (error) {
    case 'PROJECT_NAME_REQUIRED':
      return 'Enter the project name'
    case 'PROJECT_NAME_MAX_LENGTH':
      return 'Project name should be 250 characters or less'
    default:
      return error
  }
}
