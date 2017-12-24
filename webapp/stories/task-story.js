import React from "react"
import { storiesOf } from "@storybook/react"
import { action } from "@storybook/addon-actions"
import { Task } from "../src/Task"

storiesOf("Task", module)
  .add("incomplete task", () => (
    <Task
      isComplete={false}
      text="Get coffee"
      onIsCompleteChange={action("isComplete change")}
      onTextChange={action("text change")}
      onDelete={action("delete")}
    />
  ))
  .add("complete task", () => (
    <Task
      isComplete={true}
      text="Do laundry"
      onIsCompleteChange={action("isComplete change")}
      onTextChange={action("text change")}
      onDelete={action("delete")}
    />
  ))
  .add("creating task", () => (
    <Task
      isCreating={true}
      isComplete={false}
      text="Write novel"
      onIsCompleteChange={action("isComplete change")}
      onTextChange={action("text change")}
      onDelete={action("delete")}
    />
  ))
