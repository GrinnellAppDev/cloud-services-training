import React from "react"
import { createPortal } from "react-dom"
import { registerDialog } from "dialog-polyfill"
import "dialog-polyfill/dialog-polyfill.css"

export const dialogRoot = document.createElement("div")

// Focus logic taken from https://gist.github.com/samthor/babe9fad4a65625b301ba482dad284d1

let previousFocus = null
document.addEventListener(
  "focusout",
  ev => {
    previousFocus = ev.target
  },
  true
)

/**
 * Identical props to <dialog>, but with polyfills and a11y improvements.
 */
export class Dialog extends React.PureComponent {
  el = null
  savedFocus = null

  get backdropEl() {
    const nextSibling = this.el.nextSibling
    return nextSibling && nextSibling.className === "backdrop"
      ? nextSibling
      : null
  }

  setElProps({ open, children, ...props }) {
    for (const prop in props) {
      if (this.el[prop] !== props[prop])
        if (/^on/.test(prop)) this.el[prop.toLowerCase()] = props[prop]
        else this.el[prop] = props[prop]
    }
  }

  open() {
    this.savedFocus =
      document.activeElement === document ||
      document.activeElement === document.body
        ? // some browsers read activeElement as body
          previousFocus
        : document.activeElement

    this.el.showModal()

    if (this.backdropEl)
      this.backdropEl.addEventListener("click", this.props.onCancel)
  }

  close() {
    if (this.backdropEl)
      this.backdropEl.removeEventListener("click", this.props.onCancel)

    this.el.close()

    if (document.contains(this.savedFocus)) {
      const currentFocus = document.activeElement
      this.savedFocus.focus()

      if (document.activeElement !== this.savedFocus) {
        currentFocus.focus() // restore focus, we couldn't focus saved
      }
    }

    this.savedFocus = null
  }

  componentWillMount() {
    this.el = document.createElement("dialog")
  }

  componentDidMount() {
    dialogRoot.appendChild(this.el)
    registerDialog(this.el)

    this.setElProps(this.props)
    if (this.props.open) this.open()

    this.el.addEventListener("cancel", ev => {
      ev.preventDefault()
    })
    this.el.addEventListener("click", ev => {
      const rect = this.el.getBoundingClientRect()

      if (
        ev.target === this.el &&
        (ev.clientX < rect.x ||
          ev.clientX > rect.x + rect.width ||
          ev.clientY < rect.y ||
          ev.clientY > rect.y + rect.height)
      ) {
        this.props.onCancel(ev)
      }
    })
  }

  componentWillReceiveProps(nextProps) {
    this.setElProps(nextProps)

    if (this.props.onCancel !== nextProps.onCancel && this.backdropEl) {
      this.backdropEl.removeEventListener("click", this.props.onCancel)
      this.backdropEl.addEventListener("click", nextProps.onCancel)
    }

    if (this.props.open !== nextProps.open) {
      if (nextProps.open) {
        this.open()
      } else {
        this.close()
      }
    }
  }

  componentWillUnmount() {
    dialogRoot.removeChild(this.el)
  }

  render() {
    return createPortal(this.props.children, this.el)
  }
}

export default Dialog
