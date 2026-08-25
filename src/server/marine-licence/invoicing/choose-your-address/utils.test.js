import {
  buildAddressItems,
  getSearchResults,
  getSelectedAddressValue,
  getSelectedResult,
  hasPickableResults,
  hasSingleResult
} from '#src/server/marine-licence/invoicing/choose-your-address/utils.js'

const results = [
  { addressLine: '1 HIGH STREET, LONDON, SW1 2AA' },
  { addressLine: '2 HIGH STREET, LONDON, SW1 2AA' }
]

describe('#chooseYourAddress utils', () => {
  describe('#getSearchResults', () => {
    test.each([
      ['there is no invoicing', undefined],
      ['there are no cached results', {}]
    ])('Should return an empty list when %s', (_name, invoicing) => {
      expect(getSearchResults(invoicing)).toEqual([])
    })

    test('Should return the cached results', () => {
      expect(
        getSearchResults({ invoiceAddressSearchResults: results })
      ).toEqual(results)
    })
  })

  describe('#hasPickableResults', () => {
    test.each([
      ['there are no results', []],
      ['there is a single result', [results[0]]]
    ])('Should be false when %s', (_name, searchResults) => {
      expect(hasPickableResults(searchResults)).toBe(false)
    })

    test('Should be true when there is more than one result', () => {
      expect(hasPickableResults(results)).toBe(true)
    })
  })

  describe('#hasSingleResult', () => {
    test.each([
      ['there are no results', []],
      ['there is more than one result', results]
    ])('Should be false when %s', (_name, searchResults) => {
      expect(hasSingleResult(searchResults)).toBe(false)
    })

    test('Should be true when there is exactly one result', () => {
      expect(hasSingleResult([results[0]])).toBe(true)
    })
  })

  describe('#buildAddressItems', () => {
    test('Should list the addresses in response order, then an "or" divider and "None of these"', () => {
      expect(buildAddressItems(results)).toEqual([
        { value: '0', text: '1 HIGH STREET, LONDON, SW1 2AA' },
        { value: '1', text: '2 HIGH STREET, LONDON, SW1 2AA' },
        { divider: 'or' },
        { value: 'none', text: 'None of these' }
      ])
    })
  })

  describe('#getSelectedResult', () => {
    test('Should return the result at the selected index', () => {
      expect(getSelectedResult(results, '1')).toBe(results[1])
    })

    test.each([
      ['the index is out of range', '2'],
      ['the value is not an index', 'none'],
      ['the value is negative', '-1'],
      ['the index is not canonical', '01'],
      ['the value is padded', ' 1'],
      ['the value is empty', ''],
      ['the value is missing', undefined]
    ])('Should return null when %s', (_name, selectedAddress) => {
      expect(getSelectedResult(results, selectedAddress)).toBeNull()
    })
  })

  describe('#getSelectedAddressValue', () => {
    test('Should return the index of the cached selection', () => {
      expect(getSelectedAddressValue(results, results[1])).toBe('1')
    })

    test.each([
      ['nothing has been selected yet', undefined],
      [
        'the cached selection is not in the current results',
        { addressLine: '3 HIGH STREET, LONDON, SW1 2AA' }
      ]
    ])('Should return null when %s', (_name, selectedInvoiceAddress) => {
      expect(
        getSelectedAddressValue(results, selectedInvoiceAddress)
      ).toBeNull()
    })
  })
})
