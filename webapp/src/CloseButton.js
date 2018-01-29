import React from "react"
import classnames from "classnames"
import "./CloseButton.css"

export const CloseButton = ({ className, ...props }) => (
  <button className={classnames("CloseButton", className)} {...props}>
    ×
  </button>
)

export default CloseButton
