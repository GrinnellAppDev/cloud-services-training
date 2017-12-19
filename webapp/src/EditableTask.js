import React from "react"
import "./EditableTask.css"
import { Task } from "./Task"

export const EditableTask = ({
  isEditing,
  text,
  isComplete,
  onIsEditingChange,
  onTextChange,
  onIsCompleteChange
}) => (
  <Task isComplete={isComplete} onIsCompleteChange={onIsCompleteChange}>
    {isEditing ? (
      <input
        className="EditableTask-editableText"
        type="text"
        value={text}
        onChange={ev => onTextChange(ev.currentTarget.value)}
        onBlur={() => onIsEditingChange(false)}
      />
    ) : (
      <span
        className="EditableTask-displayText"
        onClick={() => onIsEditingChange(true)}
      >
        {text}
      </span>
    )}
  </Task>
)

export default EditableTask
