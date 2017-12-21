import React from "react"
import "./App.css"
import Task from "./Task"
import { connect } from "react-redux"
import { makeGetTasks, getNewTaskText, editNewTask } from "./store"

export const withEnhancers = connect(
  () => {
    const getTasks = makeGetTasks()
    return state => ({
      tasks: getTasks(state),
      newTaskText: getNewTaskText(state)
    })
  },
  {
    onNewTaskTextChange: editNewTask
  }
)

export const App = ({ tasks, newTaskText, onNewTaskTextChange }) => (
  <div className="App">
    <header className="App-header">todo</header>
    <main className="App-main">
      <input
        className="App-addTask"
        type="text"
        placeholder="What needs to be done?"
        value={newTaskText}
        onChange={ev => onNewTaskTextChange(ev.currentTarget.value)}
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
