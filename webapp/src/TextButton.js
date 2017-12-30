import React from "react"
import classnames from "classnames"
import "./TextButton.css"

export const TextButton = ({ className, ...props }) => (
  <button className={classnames("TextButton", className)} {...props} />
)

export default TextButton
