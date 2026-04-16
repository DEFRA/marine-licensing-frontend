import sanitizeHtml from 'sanitize-html'

const sanitiseOptions = {
  allowedTags: ['a', 'b', 'br', 'li', 'ol', 'p', 'strong', 'u', 'ul'],
  allowedAttributes: {
    a: ['href', 'target', 'rel'],
    ol: ['type'],
    p: ['class']
  },
  allowedSchemes: ['http', 'https'],
  // Transform <p> tags to <p class='govuk-hint'> for grey styling
  transformTags: {
    p: (tagName, attribs) => ({
      tagName,
      attribs: { ...attribs, class: 'govuk-hint' }
    })
  }
}

export function sanitise(text) {
  return text ? sanitizeHtml(text, sanitiseOptions) : text
}

export function stripHtml(text) {
  return text ? sanitizeHtml(text, { allowedTags: [] }) : text
}
