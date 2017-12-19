import { configure } from "@storybook/react"
import "../src/index.css"
import "./style.css"

function loadStories() {
  require("../stories/app-story.js")
  require("../stories/task-story.js")
}

configure(loadStories, module)
