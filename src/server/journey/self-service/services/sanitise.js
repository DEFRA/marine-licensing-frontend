import sanitizeHtml from 'sanitize-html'

const sanitiseOptions = {
  allowedTags: ['a', 'b', 'br', 'li', 'ol', 'p', 'strong', 'u', 'ul'],
  allowedAttributes: {
    a: ['href', 'target'],
    ol: ['type']
  },
  allowedSchemes: ['http', 'https']
}

export function sanitise(text) {
  return text ? sanitizeHtml(text, sanitiseOptions) : text
}

export function stripHtml(text) {
  return text ? sanitizeHtml(text, { allowedTags: [] }) : text
}
