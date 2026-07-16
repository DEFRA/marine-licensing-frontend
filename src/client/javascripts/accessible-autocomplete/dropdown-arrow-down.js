/**
 * Dropdown arrow for accessible-autocomplete.
 *
 * @param {{ className: string }} params
 * @returns {string}
 */
export const dropdownArrowDown = ({ className }) => {
  return `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" class="${className}" focusable="false" viewBox="0 0 22 17" preserveAspectRatio="none">
    <g stroke="none" fill="none" fill-rule="evenodd">
      <polygon fill="#000000" points="0 0 22 0 11 17"></polygon>
    </g>
  </svg>`
}
