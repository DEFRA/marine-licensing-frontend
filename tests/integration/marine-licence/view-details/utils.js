export const getCardRow = (card, keyText) => {
  const rows = card.querySelectorAll('.govuk-summary-list__row')
  return [...rows].find(
    (row) =>
      row.querySelector('.govuk-summary-list__key')?.textContent.trim() ===
      keyText
  )
}

export const expectReadOnlySupportingDocumentCard = (document, filename) => {
  const card = document.querySelector('#document-card-1')
  expect(
    card.querySelector('.govuk-summary-card__title').textContent.trim()
  ).toBe(`Supporting document - ${filename}`)
  expect(card.textContent).toContain('Ecological Assessment')
  expect(card.querySelectorAll('a')).toHaveLength(0)
}
