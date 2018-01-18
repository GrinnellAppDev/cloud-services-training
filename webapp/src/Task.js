import React from "react"
import classnames from "classnames"
import "./Task.css"
import { connect } from "react-redux"
import { getTaskById, editTask, deleteTask } from "./store"
import LoadingSpinner from "./LoadingSpinner"
import { isTempTaskId } from "./util"

export const withEnhancers = connect(
  (state, { id }) => ({
    ...getTaskById(state, id),
    isCreating: isTempTaskId(id)
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
  isComplete = false,
  text = "",
  onIsCompleteChange,
  onTextChange,
  onDelete,
  isCreating = false
}) => (
  <article className={classnames("Task", isComplete && "Task-isComplete")}>
    {isCreating && (
      <div className="Task-loading">
        <LoadingSpinner />
      </div>
    )}

    <input
      className="Task-checkbox"
      type="checkbox"
      onChange={() => onIsCompleteChange(!isComplete, isComplete)}
      checked={isComplete}
      disabled={isCreating}
    />

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
      disabled={isCreating}
    >
      ×
    </button>
  </article>
)

export default withEnhancers(Task)