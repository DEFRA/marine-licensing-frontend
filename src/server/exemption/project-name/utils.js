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
