import React from "react"
import "./App.css"

export const App = () => (
  <div className="App">
    <header className="App-header">todo</header>
    <main className="App-main">
      <input
        className="App-addTask"
        type="text"
        placeholder="What needs to be done?"
      />
      <ul className="App-taskList">
        <li>Get coffee</li>
        <li>Pick up leaves</li>
        <li>Finish novel</li>
      </ul>
    </main>
  </div>
)

export default App
