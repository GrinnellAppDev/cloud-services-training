import React from "react"
import "./App.css"
import Task from "./Task"
import { connect } from "react-redux"
import {
  makeGetTasks,
  getNewTaskText,
  editNewTaskText,
  createNewTask,
  reloadTasks,
  loadNextTasks,
  getNextPageToken,
  getTasksStatus
} from "./store"
import InfiniteScroll from "react-infinite-scroller"
import LoadingSpinner from "./LoadingSpinner"

export const withEnhancers = connect(
  () => {
    const getTasks = makeGetTasks()
    return state => ({
      tasks: getTasks(state),
      newTaskText: getNewTaskText(state),
      hasNextPage:
        !!getNextPageToken(state) || getTasksStatus(state) === "UNLOADED"
    })
  },
  {
    onNewTaskTextChange: editNewTaskText,
    onNewTaskSubmit: () => createNewTask(`~${Date.now()}`),
    onRefresh: reloadTasks,
    onLoadNextPage: loadNextTasks
  }
)

export const App = ({
  tasks,
  newTaskText,
  hasNextPage,
  onNewTaskTextChange,
  onNewTaskSubmit,
  onRefresh,
  onLoadNextPage
}) => (
  <div className="App">
    <header className="App-header">
      <button
        className="App-title App-refresh"
        onClick={() => onRefresh()}
        title="Refresh"
      >
        todo
      </button>

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
    </header>
    <main className="App-main">
      <InfiniteScroll
        element="ul"
        className="App-taskList"
        loadMore={onLoadNextPage}
        hasMore={hasNextPage}
        useWindow={false}
        loader={<LoadingSpinner className="App-loading" title="Loading..." />}
      >
        {tasks.map(({ _id }) => (
          <li className="App-taskListItem" key={_id}>
            <Task id={_id} />
          </li>
        ))}
      </InfiniteScroll>
    </main>
  </div>
)

export default withEnhancers(App)
