import React from "react"
import "./Checkbox.css"
import classnames from "classnames"

export const Checkbox = ({ className, ...props }) => (
  <label className={classnames("Checkbox", className)}>
    <input {...props} className="Checkbox-input" type="checkbox" />

    <svg className="Checkbox-svg" viewBox="-10 -10 120 120">
      <circle className="Checkbox-borderRing" cx="50" cy="50" r="50" />
      <circle className="Checkbox-focusRing" cx="50" cy="50" r="50" />
      <path
        className="Checkbox-check"
        d="M72 25L42 71 27 56l-4 4 20 20 34-52z"
      />
      <circle className="Checkbox-ripple" cx="50" cy="50" r="50" />
    </svg>
  </label>
)

export default Checkbox
