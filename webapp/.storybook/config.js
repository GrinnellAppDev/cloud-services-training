import { configure } from "@storybook/react"
import "../src/index.css"
import "./style.css"
import { dialogRoot } from "../src/Dialog"

function loadStories() {
  dialogRoot.id = "dialog-root"
  const currentRoot = document.getElementById(dialogRoot.id)
  if (currentRoot) currentRoot.remove()
  document.body.appendChild(dialogRoot)

  require("../stories/app-story.js")
  require("../stories/task-story.js")
  require("../stories/auth-story.js")
}

configure(loadStories, module)
