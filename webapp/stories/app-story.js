import React from "react"
import { storiesOf } from "@storybook/react"
import { action } from "@storybook/addon-actions"
import { App } from "../src/App"

storiesOf("App", module).add("a few tasks", () => (
  <App
    tasks={[
      { _id: "s38rOsF", isComplete: false, text: "Get coffee" },
      { _id: "Fs3393a", isComplete: true, text: "Do laundry" },
      { _id: "023Dfdi", isComplete: false, text: "Finish novel" }
    ]}
  />
))
