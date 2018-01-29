import React from "react"
import classnames from "classnames"
import "./LoadingSpinner.css"

export const LoadingSpinner = ({ className = null }) => (
  <div
    className={classnames("LoadingSpinner-ripple", className)}
    title="Loading..."
  >
    <div className="LoadingSpinner-ring LoadingSpinner-ring1" />
    <div className="LoadingSpinner-ring LoadingSpinner-ring2" />
  </div>
)

export default LoadingSpinner
