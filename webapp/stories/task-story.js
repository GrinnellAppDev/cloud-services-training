import React from "react"
import { storiesOf } from "@storybook/react"
import { action } from "@storybook/addon-actions"
import { Task } from "../src/Task"

storiesOf("Task", module)
  .add("incomplete task", () => (
    <Task
      isComplete={false}
      text="Get coffee"
      onIsCompleteToggled={action("toggle complete")}
    />
  ))
  .add("complete task", () => (
    <Task
      isComplete={true}
      text="Do laundry"
      onIsCompleteToggled={action("toggle complete")}
    />
  ))
