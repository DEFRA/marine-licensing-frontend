import escapeHtml from 'lodash/escape.js'

export const REDACTION_LABEL = '***REDACTED***'
const REDACTION_LABEL_HTML = `<span class="app-redaction-label">${REDACTION_LABEL}</span>`

export const wrapRedactionLabels = (text) =>
  escapeHtml(text ?? '').replaceAll(REDACTION_LABEL, REDACTION_LABEL_HTML)
