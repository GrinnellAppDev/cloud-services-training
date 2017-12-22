import React from "react"
import classnames from "classnames"
import Ripples from "react-ripples"
import "./Task.css"
import { connect } from "react-redux"
import { getTaskById, editTask } from "./store"

export const withEnhancers = connect(
  (state, { id }) => ({
    ...getTaskById(state, id)
  }),
  (dispatch, { id }) => ({
    onIsCompleteChange: isComplete => dispatch(editTask(id, { isComplete })),
    onTextChange: text => dispatch(editTask(id, { text }))
  })
)

export const Task = ({
  isComplete,
  text,
  onIsCompleteChange,
  onTextChange,
  isCreating = false
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
        disabled={isCreating}
      />
    </Ripples>

    <input
      className="Task-text"
      type="text"
      value={text}
      onChange={ev => onTextChange(ev.currentTarget.value)}
      disabled={isCreating}
    />
  </article>
)

export default withEnhancers(Task)
