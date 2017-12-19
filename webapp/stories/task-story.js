import React from "react"
import { storiesOf } from "@storybook/react"
import { action } from "@storybook/addon-actions"
import { Task } from "../src/Task"
import { EditableTask } from "../src/EditableTask"

storiesOf("Task", module)
  .add("incomplete task", () => (
    <Task isComplete={false} onIsCompleteChange={action("toggle complete")}>
      Get coffee
    </Task>
  ))
  .add("complete task", () => (
    <Task isComplete={true} onIsCompleteChange={action("toggle complete")}>
      Do laundry
    </Task>
  ))

storiesOf("EditableTask", module)
  .add("not editing", () => (
    <EditableTask
      isEditing={false}
      text="Get coffee"
      isComplete={false}
      onIsEditingChange={action("isEditing change")}
      onTextChange={action("text change")}
      onIsCompleteChange={action("toggle complete")}
    />
  ))
  .add("editing", () => (
    <EditableTask
      isEditing={true}
      text="Get coffee"
      isComplete={false}
      onIsEditingChange={action("isEditing change")}
      onTextChange={action("text change")}
      onIsCompleteChange={action("toggle complete")}
    />
  ))
  .add("editing complete", () => (
    <EditableTask
      isEditing={true}
      text="Get coffee"
      isComplete={true}
      onIsEditingChange={action("isEditing change")}
      onTextChange={action("text change")}
      onIsCompleteChange={action("toggle complete")}
    />
  ))
