import React from "react"
import { createPortal } from "react-dom"
import { registerDialog } from "dialog-polyfill"

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

  open() {
    this.savedFocus =
      document.activeElement === document ||
      document.activeElement === document.body
        ? // some browsers read activeElement as body
          previousFocus
        : document.activeElement

    this.el.showModal()
  }

  close() {
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

    const { open, children, ...props } = this.props
    for (const prop in props) {
      if (/^on/.test(prop)) this.el[prop.toLowerCase()] = props[prop]
      else this.el[prop] = props[prop]
    }

    if (open) this.open()

    this.el.addEventListener("cancel", ev => {
      ev.preventDefault()
    })
    this.el.addEventListener("click", ev => {
      const rect = this.el.getBoundingClientRect()

      if (
        ev.clientX < rect.x ||
        ev.clientX > rect.x + rect.width ||
        ev.clientY < rect.y ||
        ev.clientY > rect.y + rect.height
      ) {
        this.props.onCancel(ev)
      }
    })
  }

  componentWillReceiveProps({ open, children, ...nextProps }) {
    for (const prop in nextProps) {
      if (this.el[prop] !== nextProps[prop]) this.el[prop] = nextProps[prop]
    }

    if (this.props.open !== open) {
      if (open) {
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
