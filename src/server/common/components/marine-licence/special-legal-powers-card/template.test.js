import { renderComponent } from '#src/server/test-helpers/component-helpers.js'

describe('Marine Licence Special Legal Powers Card Component', () => {
	let $component

	const baseParams = {
		specialLegalPowers: {
			agree: 'yes',
			details: 'We have statutory powers under the Marine Act.'
		},
		isApplicantView: true
	}

	beforeEach(() => {
		$component = renderComponent('marine-licence/special-legal-powers-card', baseParams)
	})

	test('Should render special legal powers card component', () => {
		expect($component('#special-legal-powers-card')).toHaveLength(1)
	})

	test('Should display "Yes" when agree is yes', () => {
		expect($component.html()).toContain('Yes')
	})

	test('Should display details when agree is yes', () => {
		expect($component.html()).toContain('We have statutory powers under the Marine Act.')
	})

	test('Should have correct card title', () => {
		expect($component('.govuk-summary-card__title').text().trim()).toBe('Special legal powers')
	})

	test('Should display "No" and not show details when agree is no', () => {
		const params = {
			specialLegalPowers: {
				agree: 'no',
				details: 'Should not be shown'
			},
			isApplicantView: true
		}
		const $comp = renderComponent('marine-licence/special-legal-powers-card', params)
		expect($comp.html()).toContain('No')
		expect($comp.html()).not.toContain('Should not be shown')
	})
})
