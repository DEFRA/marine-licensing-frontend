import nunjucks from 'nunjucks'
import { sanitiseRichText } from '#src/server/journey/self-service/services/sanitise.js'

export function sanitiseRichTextFilter(value) {
  if (!value) {
    return ''
  }
  return new nunjucks.runtime.SafeString(sanitiseRichText(value))
}
