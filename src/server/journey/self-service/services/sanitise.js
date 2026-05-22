import sanitizeHtml from 'sanitize-html'

const ALLOWED_TAGS = ['a', 'b', 'br', 'li', 'ol', 'p', 'strong', 'u', 'ul']
const ALLOWED_SCHEMES = ['http', 'https']

const hintSanitiseOptions = {
  allowedTags: ALLOWED_TAGS,
  allowedAttributes: {
    a: ['href', 'target', 'rel'],
    ol: ['type'],
    p: ['class']
  },
  allowedSchemes: ALLOWED_SCHEMES,
  allowProtocolRelative: false,
  transformTags: {
    p: (tagName, attribs) => ({
      tagName,
      attribs: { ...attribs, class: 'govuk-hint' }
    })
  }
}

const richTextSanitiseOptions = {
  allowedTags: ALLOWED_TAGS,
  allowedAttributes: {
    a: ['href', 'target', 'rel'],
    ol: ['type']
  },
  allowedSchemes: ALLOWED_SCHEMES,
  allowProtocolRelative: false
}

export function sanitise(text) {
  return text ? sanitizeHtml(text, hintSanitiseOptions) : text
}

export function sanitiseRichText(text) {
  return text ? sanitizeHtml(text, richTextSanitiseOptions) : text
}

export function stripHtml(text) {
  return text ? sanitizeHtml(text, { allowedTags: [] }) : text
}
