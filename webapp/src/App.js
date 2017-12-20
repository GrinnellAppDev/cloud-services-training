import React from "react"
import "./App.css"
import Task from "./Task"
import { connect } from "react-redux"
import { makeGetTasks } from "./store"

export const withEnhancers = connect(() => {
  const getTasks = makeGetTasks()
  return state => ({
    tasks: getTasks(state)
  })
})

export const App = ({ tasks, newTaskText }) => (
  <div className="App">
    <header className="App-header">todo</header>
    <main className="App-main">
      <input
        className="App-addTask"
        type="text"
        placeholder="What needs to be done?"
        value={newTaskText}
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
