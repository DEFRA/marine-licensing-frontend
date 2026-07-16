import { describe, expect, test } from 'vitest'

import { dropdownArrowDown } from './dropdown-arrow-down.js'

describe('dropdownArrowDown', () => {
  test('returns an svg with the class name and viewBox', () => {
    const svg = dropdownArrowDown({
      className: 'autocomplete__dropdown-arrow-down'
    })

    expect(svg).toContain('<svg')
    expect(svg).toContain('class="autocomplete__dropdown-arrow-down"')
    expect(svg).toContain('viewBox="0 0 22 17"')
    expect(svg).toContain('preserveAspectRatio="none"')
  })
})
