import nunjucks from 'nunjucks'
import { wrapRedactionLabels } from '#src/server/common/helpers/marine-licence/redaction-label.js'

export function wrapRedactionLabelsFilter(value) {
  if (value instanceof nunjucks.runtime.SafeString) {
    return value
  }

  return new nunjucks.runtime.SafeString(wrapRedactionLabels(value))
}
