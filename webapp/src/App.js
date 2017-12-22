import React from "react"
import "./App.css"
import Task from "./Task"
import { connect } from "react-redux"
import {
  makeGetTasks,
  getNewTaskText,
  editNewTaskText,
  createNewTask,
  reloadTasks
} from "./store"

export const withEnhancers = connect(
  () => {
    const getTasks = makeGetTasks()
    return state => ({
      tasks: getTasks(state),
      newTaskText: getNewTaskText(state)
    })
  },
  {
    onNewTaskTextChange: editNewTaskText,
    onNewTaskSubmit: () => createNewTask(`~${Date.now()}`),
    onRefresh: reloadTasks
  }
)

export const App = ({
  tasks,
  newTaskText,
  onNewTaskTextChange,
  onNewTaskSubmit,
  onRefresh
}) => (
  <div className="App">
    <header className="App-header">
      <button className="App-refresh" onClick={() => onRefresh()}>
        todo
      </button>
    </header>
    <main className="App-main">
      <input
        className="App-addTask"
        type="text"
        placeholder="What needs to be done?"
        value={newTaskText}
        onChange={ev => onNewTaskTextChange(ev.currentTarget.value)}
        onKeyPress={ev => {
          if (ev.key === "Enter") onNewTaskSubmit()
        }}
      />

      <ul className="App-taskList">
        {tasks.map(({ _id }) => (
          <li className="App-taskListItem" key={_id}>
            <Task id={_id} />
          </li>
        ))}
      </ul>
    </main>
  </div>
)

export default withEnhancers(App)
