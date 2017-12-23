import React from "react"
import classnames from "classnames"
import Ripples from "react-ripples"
import "./Task.css"
import { connect } from "react-redux"
import { getTaskById, editTask, deleteTask } from "./store"

export const withEnhancers = connect(
  (state, { id }) => ({
    ...getTaskById(state, id)
  }),
  (dispatch, { id }) => ({
    onIsCompleteChange: (isComplete, oldVal) =>
      dispatch(editTask(id, { isComplete }, { isComplete: oldVal })),
    onTextChange: (text, oldVal) =>
      dispatch(editTask(id, { text }, { text: oldVal })),
    onDelete: original => dispatch(deleteTask(id, original))
  })
)

export const Task = ({
  isComplete,
  text,
  onIsCompleteChange,
  onTextChange,
  onDelete,
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
        onChange={() => onIsCompleteChange(!isComplete, isComplete)}
        checked={isComplete}
        disabled={isCreating}
      />
    </Ripples>

    <input
      className="Task-text"
      type="text"
      value={text}
      onChange={ev => onTextChange(ev.currentTarget.value, text)}
      disabled={isCreating}
    />

    <button
      className="Task-delete"
      onClick={() => onDelete({ text, isComplete })}
      title="Delete"
    >
      ×
    </button>
  </article>
)

export default withEnhancers(Task)
