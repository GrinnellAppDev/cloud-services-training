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

export const App = ({ tasks }) => (
  <div className="App">
    <header className="App-header">todo</header>
    <main className="App-main">
      <input
        className="App-addTask"
        type="text"
        placeholder="What needs to be done?"
      />

      <ul className="App-taskList">
        {tasks.map(task => (
          <li className="App-taskListItem" key={task._id}>
            <Task
              isComplete={task.isComplete}
              text={task.text}
              onIsCompleteChange={() => {}}
              onTextChange={() => {}}
            />
          </li>
        ))}
      </ul>
    </main>
  </div>
)

export default withEnhancers(App)
