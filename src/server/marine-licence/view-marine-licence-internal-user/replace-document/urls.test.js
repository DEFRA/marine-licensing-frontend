import {
  replaceDocumentUrls,
  REPLACE_DOCUMENT_TYPES
} from '#src/server/marine-licence/view-marine-licence-internal-user/replace-document/urls.js'

describe('#replaceDocumentUrls', () => {
  const applicationReference = 'MLA/2026/10264'

  test('builds construction drawing urls from the site and drawing query', () => {
    const urls = replaceDocumentUrls(
      applicationReference,
      REPLACE_DOCUMENT_TYPES.CONSTRUCTION_DRAWING,
      { site: '1', drawing: '2' }
    )

    expect(urls.uploadUrl).toBe(
      '/marine-licence/redaction/MLA-2026-10264/upload-construction-drawing?site=1&drawing=2'
    )
    expect(urls.waitUrl).toBe(
      '/marine-licence/redaction/MLA-2026-10264/upload-construction-drawing-wait?site=1&drawing=2'
    )
    expect(urls.returnUrl).toBe(
      '/marine-licence/redaction/MLA-2026-10264#construction-drawing-site-1-2'
    )
  })

  test('builds water framework directive urls with no query', () => {
    const urls = replaceDocumentUrls(
      applicationReference,
      REPLACE_DOCUMENT_TYPES.WATER_FRAMEWORK_DIRECTIVE,
      {}
    )

    expect(urls.uploadUrl).toBe(
      '/marine-licence/redaction/MLA-2026-10264/water-framework-directive-file-upload'
    )
    expect(urls.waitUrl).toBe(
      '/marine-licence/redaction/MLA-2026-10264/water-framework-directive-upload-and-wait'
    )
    expect(urls.returnUrl).toBe(
      '/marine-licence/redaction/MLA-2026-10264#water-framework-directive-card'
    )
  })

  test('ignores stray site and drawing params for water framework directive', () => {
    const urls = replaceDocumentUrls(
      applicationReference,
      REPLACE_DOCUMENT_TYPES.WATER_FRAMEWORK_DIRECTIVE,
      { site: '1', drawing: '2' }
    )

    expect(urls.uploadUrl).toBe(
      '/marine-licence/redaction/MLA-2026-10264/water-framework-directive-file-upload'
    )
    expect(urls.returnUrl).toBe(
      '/marine-licence/redaction/MLA-2026-10264#water-framework-directive-card'
    )
  })
})
