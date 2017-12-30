import { createStore, applyMiddleware } from "redux"
import { createEpicMiddleware, combineEpics } from "redux-observable"
import { composeWithDevTools } from "redux-devtools-extension"
import { createSelector } from "reselect"
import querystring from "querystring"
import { isTempTaskId, asciiCompare } from "./util"
import { merge as mergeObservables } from "rxjs/observable/merge"
import { empty as emptyObservable } from "rxjs/observable/empty"
import { of as observableOf } from "rxjs/observable/of"
import { mergeMap } from "rxjs/operators/mergeMap"
import { filter } from "rxjs/operators/filter"
import { race } from "rxjs/operators/race"
import { take } from "rxjs/operators/take"
import { mapTo } from "rxjs/operators/mapTo"
import { map } from "rxjs/operators/map"
import { delayWhen } from "rxjs/operators/delayWhen"

// Selectors

export const getNewTaskText = state => state.newTask.text
export const getTaskById = (state, id) => state.tasks.items[id]
export const getTasksStatus = state => state.tasks.status
export const getLastTasksErrorMessage = state => state.tasks.lastErrorMessage
export const getNextPageToken = state => state.tasks.nextPageToken
export const getToastsQueueLength = state => state.toasts.queue.length
export const getTopToast = state => state.toasts.queue[0]

export const makeGetTasks = () =>
  createSelector(
    state => state.tasks.items,
    items =>
      Object.keys(items)
        .sort((a, b) => asciiCompare(b, a))
        .map(key => items[key])
  )

// Action Creators

export const loadNextTasks = () => ({ type: "LOAD_NEXT_TASKS" })
export const reloadTasks = () => ({ type: "RELOAD_TASKS" })
export const tasksLoadingStarted = () => ({ type: "TASKS_LOADING_STARTED" })
export const tasksReceived = (items, nextPageToken) => ({
  type: "TASKS_RECEIVED",
  items,
  nextPageToken
})
export const tasksLoadingFailed = (message = null) => ({
  type: "TASKS_LOADING_FAILED",
  message
})

export const clearNewTask = () => ({ type: "CLEAR_NEW_TASK" })
export const editNewTaskText = text => ({ type: "EDIT_NEW_TASK_TEXT", text })
export const createNewTask = temporaryId => ({
  type: "CREATE_NEW_TASK",
  temporaryId
})
export const taskCreated = (temporaryId, realId) => ({
  type: "TASK_CREATED",
  temporaryId,
  realId
})
export const taskCreateFailed = (temporaryId, message = null) => ({
  type: "TASK_CREATE_FAILED",
  temporaryId,
  message
})

export const editTask = (id, edits, original) => ({
  type: "EDIT_TASK",
  id,
  edits,
  original
})
export const taskEditSucceeded = id => ({ type: "TASK_EDIT_SUCCEEDED", id })
export const taskEditFailed = (id, original, message = null) => ({
  type: "TASK_EDIT_FAILED",
  id,
  original,
  message
})

export const deleteTask = (id, original) => ({
  type: "DELETE_TASK",
  id,
  original
})
export const taskDeleteSucceeded = id => ({ type: "TASK_DELETE_SUCCEEDED", id })
export const taskDeleteFailed = (id, original) => ({
  type: "TASK_DELETE_FAILED",
  id,
  original
})

export const sendToast = (
  id,
  message,
  buttonText = "",
  { useSpinner = false } = {}
) => ({
  type: "SEND_TOAST",
  id,
  message,
  buttonText,
  useSpinner
})
export const setToast = (message, buttonText) => ({
  type: "SET_TOAST",
  message,
  buttonText
})
export const clearTopToast = () => ({ type: "CLEAR_TOP_TOAST" })
export const toastClosed = id => ({ type: "TOAST_CLOSED", id })
export const shiftToasts = () => ({ type: "SHIFT_TOASTS" })

// Reducers

export const reducer = (
  state = {
    newTask: { text: "" },
    tasks: { status: "UNLOADED", items: {} },
    toasts: { queue: [] }
  },
  { type, ...payload }
) => {
  switch (type) {
    case "RELOAD_TASKS":
      return {
        ...state,
        tasks: {
          ...state.tasks,
          items: {},
          nextPageToken: null
        }
      }
    case "TASKS_LOADING_STARTED":
      return {
        ...state,
        tasks: {
          ...state.tasks,
          status: "LOADING"
        }
      }
    case "TASKS_RECEIVED": {
      const items = { ...state.tasks.items }
      for (const item of payload.items) {
        items[item._id] = item
      }

      return {
        ...state,
        tasks: {
          status: "LOADED",
          items,
          nextPageToken: payload.nextPageToken
        }
      }
    }
    case "TASKS_LOADING_FAILED":
      return {
        ...state,
        tasks: {
          ...state.tasks,
          status: "ERROR",
          lastErrorMessage: payload.message
        }
      }
    case "CLEAR_NEW_TASK":
      return {
        ...state,
        newTask: {
          ...state.newTask,
          text: ""
        }
      }
    case "EDIT_NEW_TASK_TEXT":
      return {
        ...state,
        newTask: {
          text: payload.text
        }
      }
    case "CREATE_NEW_TASK":
      return {
        ...state,
        tasks: {
          ...state.tasks,
          items: state.newTask.text
            ? {
                ...state.tasks.items,
                [payload.temporaryId]: {
                  _id: payload.temporaryId,
                  isComplete: false,
                  text: state.newTask.text
                }
              }
            : state.tasks.items
        }
      }
    case "TASK_CREATED": {
      const {
        [payload.temporaryId]: localTask,
        ...otherItems
      } = state.tasks.items

      return {
        ...state,
        tasks: {
          ...state.tasks,
          items: {
            ...otherItems,
            [payload.realId]: {
              ...localTask,
              _id: payload.realId
            }
          }
        }
      }
    }
    case "TASK_CREATE_FAILED": {
      const {
        [payload.temporaryId]: deletedItem,
        ...otherItems
      } = state.tasks.items
      return {
        ...state,
        tasks: {
          ...state.tasks,
          items: otherItems
        }
      }
    }
    case "EDIT_TASK":
    case "TASK_EDIT_FAILED":
      return {
        ...state,
        tasks: {
          ...state.tasks,
          items: {
            ...state.tasks.items,
            [payload.id]: {
              ...state.tasks.items[payload.id],
              ...(type === "EDIT_TASK" ? payload.edits : payload.original)
            }
          }
        }
      }
    case "DELETE_TASK": {
      const { [payload.id]: deletedItem, ...otherItems } = state.tasks.items
      return {
        ...state,
        tasks: {
          ...state.tasks,
          items: otherItems
        }
      }
    }
    case "TASK_DELETE_FAILED":
      return {
        ...state,
        tasks: {
          ...state.tasks,
          items: {
            ...state.tasks.items,
            [payload.id]: {
              ...payload.original,
              _id: payload.id
            }
          }
        }
      }
    case "SEND_TOAST": {
      const currentToastIndex = state.toasts.queue.findIndex(
        ({ id }) => id === payload.id
      )

      return {
        ...state,
        toasts: {
          ...state.toasts,
          queue:
            currentToastIndex >= 0
              ? [
                  ...state.toasts.queue.slice(0, currentToastIndex),
                  payload,
                  ...state.toasts.queue.slice(currentToastIndex + 1)
                ]
              : [...state.toasts.queue, payload]
        }
      }
    }
    case "CLEAR_TOP_TOAST":
      return {
        ...state,
        toasts: {
          ...state.toasts,
          queue:
            state.toasts.queue.length > 0
              ? [
                  {
                    ...state.toasts.queue[0],
                    message: "",
                    buttonText: "",
                    useSpinner: false
                  },
                  ...state.toasts.queue.slice(1)
                ]
              : []
        }
      }
    case "SHIFT_TOASTS":
      return {
        ...state,
        toasts: {
          ...state.toasts,
          queue: state.toasts.queue.slice(1)
        }
      }
    default:
      return state
  }
}

// Epics

export const loadTasksEpic = (
  actionsObservable,
  { getState },
  { fetchFromAPI, delayPromise }
) =>
  actionsObservable.ofType("RELOAD_TASKS", "LOAD_NEXT_TASKS").pipe(
    mergeMap(({ type }) => {
      const status = getTasksStatus(getState())

      if (
        status === "LOADING" ||
        (type === "LOAD_NEXT_TASKS" &&
          status !== "UNLOADED" &&
          status !== "ERROR" &&
          !getNextPageToken(getState()))
      )
        return emptyObservable()
      else
        return mergeObservables(
          Promise.resolve(tasksLoadingStarted()),
          Promise.all([
            fetchFromAPI(
              `/tasks?${querystring.stringify({
                pageToken: getNextPageToken(getState())
              })}`
            ),
            type === "RELOAD_TASKS" || status === "ERROR"
              ? delayPromise(500)
              : Promise.resolve()
          ])
            .then(
              ([response]) =>
                response.ok
                  ? response.json()
                  : Promise.reject(
                      Error(
                        `HTTP Error: ${response.statusText} ` +
                          `(${response.status})`
                      )
                    )
            )
            .then(body => {
              if (!Array.isArray(body.items)) {
                console.error(
                  "Missing or invalid 'items' field in the API response"
                )
                return tasksReceived([], null)
              } else if (body.nextPageToken === undefined) {
                console.error(
                  "Missing 'nextPageToken' field in the API response"
                )
                return tasksReceived(body.items, null)
              } else {
                return tasksReceived(body.items, body.nextPageToken)
              }
            })
            .catch(err => tasksLoadingFailed(err.message))
        )
    })
  )

export const newTaskEpic = (
  actionsObservable,
  { getState },
  { fetchFromAPI }
) =>
  actionsObservable.ofType("CREATE_NEW_TASK").pipe(
    mergeMap(
      ({ temporaryId }) =>
        !getNewTaskText(getState())
          ? emptyObservable()
          : mergeObservables(
              Promise.resolve(clearNewTask()),
              fetchFromAPI("/tasks", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({
                  isComplete: false,
                  text: getNewTaskText(getState())
                })
              })
                .then(
                  response =>
                    response.ok
                      ? response.json()
                      : Promise.reject(
                          Error(
                            `HTTP Error: ${response.statusText} (${
                              response.status
                            })`
                          )
                        )
                )
                .then(({ item }) => {
                  if (!item) {
                    console.error("Missing 'item' field in the API response")
                  } else if (!item._id) {
                    console.error("Missing '_id' field in the API response")
                  } else {
                    return taskCreated(temporaryId, item._id)
                  }

                  console.error("Reloading to get correct task id...")
                  return reloadTasks()
                })
                .catch(err => taskCreateFailed(temporaryId, err.message))
            )
    )
  )

export const editTaskEpic = (
  actionsObservable,
  { getState },
  { fetchFromAPI }
) =>
  actionsObservable.ofType("EDIT_TASK").pipe(
    mergeMap(({ id, edits, original }) =>
      fetchFromAPI(`/tasks/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(edits)
      })
        .then(
          response =>
            response.ok
              ? taskEditSucceeded(id)
              : Promise.reject(
                  Error(
                    `HTTP Error: ${response.statusText} (${response.status})`
                  )
                )
        )
        .catch(err => taskEditFailed(id, original, err.message))
    )
  )

export const deleteTaskEpic = (
  actionsObservable,
  { getState },
  { fetchFromAPI }
) =>
  actionsObservable.ofType("DELETE_TASK").pipe(
    filter(({ id }) => !isTempTaskId(id)),
    // delayWhen(() =>
    //   actionsObservable
    //     .ofType("TOAST_CLOSED")
    //     .pipe(filter(({ id }) => id === "DELETE_TASK_START"))
    // ),
    mergeMap(({ id, original }) =>
      fetchFromAPI(`/tasks/${id}`, {
        method: "DELETE"
      })
        .then(
          response =>
            response.ok
              ? taskDeleteSucceeded(id)
              : Promise.reject(
                  Error(
                    `HTTP Error: ${response.statusText} (${response.status})`
                  )
                )
        )
        .catch(err => taskDeleteFailed(id, original, err.message))
    )
  )

export const taskDeleteToastEpic = (
  actionsObservable,
  { getState },
  { delay }
) =>
  actionsObservable
    .ofType("DELETE_TASK")
    .pipe(
      mapTo(
        sendToast("DELETE_TASK_START", "Deleting...", "Undo", {
          useSpinner: true
        })
      )
    )

export const toastEpic = (actionsObservable, { getState }, { delay }) =>
  actionsObservable.pipe(
    filter(
      ({ type }) =>
        (type === "SEND_TOAST" && getToastsQueueLength(getState()) <= 1) ||
        (type === "SHIFT_TOASTS" && getToastsQueueLength(getState()) > 0)
    ),
    map(() => getTopToast(getState()).id),
    mergeMap(id =>
      observableOf(null).pipe(
        delay(3000),
        mergeMap(
          () =>
            getToastsQueueLength(getState()) > 1
              ? observableOf(null)
              : observableOf(null).pipe(
                  delay(3000),
                  race(
                    actionsObservable
                      .ofType("SEND_TOAST")
                      .pipe(take(1), mapTo(null))
                  )
                )
        ),
        mapTo("TIMEOUT"),
        race(
          actionsObservable
            .ofType("CLEAR_TOP_TOAST")
            .pipe(take(1), mapTo("EARLY_CLOSE")),
          actionsObservable
            .ofType("SEND_TOAST")
            .pipe(filter(action => action.id === id), take(1), mapTo("RESEND"))
        ),
        mergeMap(
          signal =>
            signal === "RESEND"
              ? emptyObservable()
              : mergeObservables(
                  signal === "TIMEOUT"
                    ? observableOf(clearTopToast())
                    : emptyObservable(),
                  observableOf(toastClosed(id)),
                  observableOf(null).pipe(delay(200), mapTo(shiftToasts()))
                )
        )
      )
    )
  )

export const rootEpic = combineEpics(
  loadTasksEpic,
  newTaskEpic,
  editTaskEpic,
  deleteTaskEpic,
  taskDeleteToastEpic,
  toastEpic
)

// Store

export const configureStore = dependencies => {
  return createStore(
    reducer,
    composeWithDevTools(
      applyMiddleware(createEpicMiddleware(rootEpic, { dependencies }))
    )
  )
}