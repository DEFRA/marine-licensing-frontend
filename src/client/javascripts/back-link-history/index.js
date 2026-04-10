export class BackLinkHistory {
  constructor(element) {
    this.element = element
    this.element.addEventListener('click', this.onClick.bind(this))
  }

  onClick(event) {
    event.preventDefault()
    globalThis.history.back()
  }
}
