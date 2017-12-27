import { createStore, applyMiddleware } from "redux"
import { merge as mergeObservables } from "rxjs/observable/merge"
import { empty as emptyObservable } from "rxjs/observable/empty"
import { mergeMap } from "rxjs/operators"
import { createEpicMiddleware, combineEpics } from "redux-observable"
import { composeWithDevTools } from "redux-devtools-extension"
import { createSelector } from "reselect"
import querystring from "querystring"
import { filter } from "rxjs/operators/filter"
import { isTempTaskId, asciiCompare } from "./util"

// Selectors

export const getNewTaskText = state => state.newTask.text
export const getTaskById = (state, id) => state.tasks.items[id]
export const getTasksStatus = state => state.tasks.status
export const getLastTasksErrorMessage = state => state.tasks.lastErrorMessage
export const getNextPageToken = state => state.tasks.nextPageToken

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

// Reducers

export const reducer = (
  state = {
    newTask: { text: "" },
    tasks: { status: "UNLOADED", items: {} }
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
    default:
      return state
  }
}

// Epics

export const loadTasksEpic = (
  actionsObservable,
  { getState },
  { fetchFromAPI, delay }
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
              ? delay(500)
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

export const rootEpic = combineEpics(
  loadTasksEpic,
  newTaskEpic,
  editTaskEpic,
  deleteTaskEpic
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
