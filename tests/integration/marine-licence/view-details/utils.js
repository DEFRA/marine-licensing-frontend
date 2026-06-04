export const getCardRow = (card, keyText) => {
  const rows = card.querySelectorAll('.govuk-summary-list__row')
  return [...rows].find(
    (row) =>
      row.querySelector('.govuk-summary-list__key')?.textContent.trim() ===
      keyText
  )
}
