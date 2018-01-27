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
  getNextPageURI,
  getTasksStatus,
  getLastTasksErrorMessage
} from "./store/tasks"
import { getTopToast, closeTopToast } from "./store/toasts"
import InfiniteScroll from "react-infinite-scroller"
import LoadingSpinner from "./LoadingSpinner"
import { getTempTaskId } from "./util"
import FlipMove from "react-flip-move"
import TextButton from "./TextButton"
import AuthBar from "./AuthBar"
import CloseButton from "./CloseButton"

export const withEnhancers = connect(
  () => {
    const getTasks = makeGetTasks()

    return state => {
      const status = getTasksStatus(state)

      return {
        tasks: getTasks(state),
        newTaskText: getNewTaskText(state),
        hasTasks: getTasks(state).length > 0 || status !== "LOADED",
        tasksHaveNextPage:
          status !== "ERROR" &&
          (!!getNextPageURI(state) ||
            status === "UNLOADED" ||
            status === "LOADING"),
        tasksHaveError: status === "ERROR",
        lastTasksErrorMessage: getLastTasksErrorMessage(state),
        topToast: getTopToast(state) || {
          message: "",
          buttonText: "",
          useSpinner: false
        }
      }
    }
  },
  {
    onNewTaskTextChange: editNewTaskText,
    onNewTaskSubmit: () => createNewTask(getTempTaskId()),
    onRefresh: reloadTasks,
    onLoadNextPage: loadNextTasks,
    onTopToastCancel: () => closeTopToast({ withAction: false }),
    onTopToastAction: () => closeTopToast({ withAction: true })
  }
)

export const App = ({
  tasks,
  newTaskText,
  tasksHaveNextPage,
  tasksHaveError,
  hasTasks,
  lastTasksErrorMessage,
  topToast,
  onNewTaskTextChange,
  onNewTaskSubmit,
  onRefresh,
  onLoadNextPage,
  onTopToastCancel,
  onTopToastAction
}) => (
  <div className="App">
    <header className="App-header">
      <AuthBar className="App-authBar" />

      <button className="App-refresh" onClick={onRefresh} title="Refresh">
        <h1 className="App-title">todo</h1>
      </button>
    </header>

    <main className="App-main">
      <input
        id="App-addTask"
        className="App-addTask"
        type="text"
        placeholder="What needs to be done?"
        value={newTaskText}
        onChange={ev => onNewTaskTextChange(ev.currentTarget.value)}
        onKeyPress={ev => {
          if (ev.key === "Enter") onNewTaskSubmit()
        }}
      />

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
          {tasks.map(({ _id, tempId }) => (
            <li className="App-taskListItem" key={tempId || _id}>
              <Task id={_id} />
            </li>
          ))}
        </FlipMove>
      </InfiniteScroll>

      {!hasTasks && (
        <section className="App-taskListTail App-noTasks">
          <p className="App-taskListTailMessage">You have no tasks!</p>
          <TextButton
            className="App-taskListTailButton App-noTasksCreate"
            onClick={() => {
              const input = document.getElementById("App-addTask")

              if (input)
                if (newTaskText && input.select) input.select()
                else input.focus()
              else console.error("Couldn't select addTask input")
            }}
          >
            Create a Task
          </TextButton>
        </section>
      )}

      {tasksHaveError && (
        <section className="App-taskListTail App-tasksError">
          <h2 className="App-taskListTailHeading">
            Oops! There was a problem loading your tasks.
          </h2>
          <p className="App-taskListTailMessage">{lastTasksErrorMessage}</p>
          <TextButton
            className="App-taskListTailButton App-tasksErrorTryAgain"
            onClick={onLoadNextPage}
          >
            Try again
          </TextButton>
        </section>
      )}
    </main>

    <aside
      role="alert"
      className="App-topToast"
      aria-hidden={!topToast.message}
    >
      <section className="App-topToastBody">
        {topToast.useSpinner && (
          <LoadingSpinner className="App-topToastLoading" />
        )}
        <p className="App-topToastMessage">{topToast.message}</p>
        {topToast.buttonText && (
          <TextButton className="App-topToastAction" onClick={onTopToastAction}>
            {topToast.buttonText}
          </TextButton>
        )}
        <CloseButton className="App-topToastClose" onClick={onTopToastCancel} />
      </section>
    </aside>
  </div>
)

export default withEnhancers(App)
