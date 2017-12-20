import React from "react"
import classnames from "classnames"
import Ripples from "react-ripples"
import "./Task.css"
import { connect } from "react-redux"
import { getTaskById } from "./store"

export const withEnhancers = connect((state, { id }) => ({
  ...getTaskById(state, id)
}))

export const Task = ({
  isComplete,
  text,
  onIsCompleteChange,
  onTextChange
}) => (
  <article className={classnames("Task", isComplete && "Task-isComplete")}>
    <Ripples
      className="Task-checkboxRipple"
      color={isComplete ? "#ededed" : "#bddad5"}
    >
      <input
        className="Task-checkbox"
        type="checkbox"
        onClick={() => onIsCompleteChange(!isComplete)}
        checked={isComplete}
      />
    </Ripples>

    <input
      className="Task-text"
      type="text"
      value={text}
      onChange={ev => onTextChange(ev.currentTarget.value)}
    />
  </article>
)

export default withEnhancers(Task)
