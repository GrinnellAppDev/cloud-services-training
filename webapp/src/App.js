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
  getTasksStatus,
  getLastTasksErrorMessage
} from "./store"
import InfiniteScroll from "react-infinite-scroller"
import LoadingSpinner from "./LoadingSpinner"
import { getTempTaskId } from "./util"
import FlipMove from "react-flip-move"

export const withEnhancers = connect(
  () => {
    const getTasks = makeGetTasks()
    return state => ({
      tasks: getTasks(state),
      newTaskText: getNewTaskText(state),
      tasksHaveNextPage:
        getTasksStatus(state) !== "ERROR" &&
        (!!getNextPageToken(state) ||
          getTasksStatus(state) === "UNLOADED" ||
          getTasksStatus(state) === "LOADING"),
      tasksHaveError: getTasksStatus(state) === "ERROR",
      lastTasksErrorMessage: getLastTasksErrorMessage(state)
    })
  },
  {
    onNewTaskTextChange: editNewTaskText,
    onNewTaskSubmit: () => createNewTask(getTempTaskId()),
    onRefresh: reloadTasks,
    onLoadNextPage: loadNextTasks
  }
)

export const App = ({
  tasks,
  newTaskText,
  tasksHaveNextPage,
  tasksHaveError,
  lastTasksErrorMessage,
  onNewTaskTextChange,
  onNewTaskSubmit,
  onRefresh,
  onLoadNextPage
}) => (
  <div className="App">
    <header className="App-header">
      <button
        className="App-refresh"
        onClick={() => onRefresh()}
        title="Refresh"
      >
        <h1 className="App-title">todo</h1>
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
        className="App-taskListWrapper"
        loadMore={onLoadNextPage}
        hasMore={tasksHaveNextPage}
        useWindow={false}
        loader={
          <div className="App-loading">
            <LoadingSpinner />
          </div>
        }
      >
        <FlipMove
          typeName="ul"
          className="App-taskList"
          enterAnimation="fade"
          leaveAnimation="fade"
          duration={200}
        >
          {tasks.map(({ _id }) => (
            <li className="App-taskListItem" key={_id}>
              <Task id={_id} />
            </li>
          ))}
        </FlipMove>

        {tasksHaveError && (
          <section className="App-tasksError">
            <h2 className="App-tasksErrorHeading">
              Oops! There was a problem loading your tasks.
            </h2>
            <p className="App-tasksErrorMessage">{lastTasksErrorMessage}</p>
            <button className="App-tasksErrorTryAgain" onClick={onLoadNextPage}>
              Try again
            </button>
          </section>
        )}
      </InfiniteScroll>
    </main>
  </div>
)

export default withEnhancers(App)
