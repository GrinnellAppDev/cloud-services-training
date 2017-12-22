import { createStore, applyMiddleware } from "redux"
import { merge as mergeObservables } from "rxjs/observable/merge"
import { mergeMap } from "rxjs/operators"
import { createEpicMiddleware, combineEpics } from "redux-observable"
import { composeWithDevTools } from "redux-devtools-extension"
import { createSelector } from "reselect"

export const getNewTaskText = state => state.newTask.text
export const getTaskById = (state, id) => state.tasks.items[id]

export const makeGetTasks = () =>
  createSelector(
    state => state.tasks.items,
    items =>
      Object.keys(items)
        .sort()
        .map(key => items[key])
  )

// Action Creators

export const reloadTasks = () => ({ type: "RELOAD_TASKS" })
export const tasksReceived = (items, nextPageToken) => ({
  type: "TASKS_RECEIVED",
  items,
  nextPageToken
})
export const editNewTaskText = text => ({ type: "EDIT_NEW_TASK_TEXT", text })
export const editTask = (id, edits) => ({ type: "EDIT_TASK", id, edits })
export const deleteTask = id => ({ type: "DELETE_TASK", id })
export const createNewTask = temporaryId => ({
  type: "CREATE_NEW_TASK",
  temporaryId
})
export const taskCreateFailed = (temporaryId, message = null) => ({
  type: "TASK_CREATE_FAILED",
  temporaryId,
  message
})
export const taskCreated = (temporaryId, realId) => ({
  type: "TASK_CREATED",
  temporaryId,
  realId
})
export const clearNewTask = () => ({ type: "CLEAR_NEW_TASK" })

// Reducers

export const reducer = (
  state = {
    newTask: { text: "" },
    tasks: { status: "UNLOADED", items: {} }
  },
  { type, ...payload }
) => {
  switch (type) {
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
    case "RELOAD_TASKS":
      return {
        ...state,
        tasks: {
          status: "LOADING",
          items: {},
          nextPageToken: null
        }
      }
    case "EDIT_TASK":
      return {
        ...state,
        tasks: {
          ...state.tasks,
          items: {
            ...state.tasks.items,
            [payload.id]: {
              ...state.tasks.items[payload.id],
              ...payload.edits
            }
          }
        }
      }
    case "EDIT_NEW_TASK_TEXT":
      return {
        ...state,
        newTask: {
          text: payload.text
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
    case "CREATE_NEW_TASK":
      return {
        ...state,
        tasks: {
          ...state.tasks,
          items: {
            ...state.tasks.items,
            [payload.temporaryId]: {
              _id: payload.temporaryId,
              isComplete: false,
              text: state.newTask.text,
              isCreating: true
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
              _id: payload.realId,
              isCreating: false
            }
          }
        }
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
    default:
      return state
  }
}

// Epics

export const newTaskEpic = (
  actionsObservable,
  { getState },
  { fetchFromAPI }
) =>
  actionsObservable.ofType("CREATE_NEW_TASK").pipe(
    mergeMap(({ temporaryId }) =>
      mergeObservables(
        Promise.resolve(clearNewTask()),
        fetchFromAPI("/tasks", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            text: getNewTaskText(getState())
          })
        })
          .then(
            response =>
              response.ok
                ? response.json()
                : Promise.reject(Error("HTTP Error"))
          )
          .then(({ item }) => {
            if (!item) {
              console.error("Couldn't find 'item' field in the API response")
            } else if (!item._id) {
              console.error("Couldn't find '_id' field in the API response")
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

export const rootEpic = combineEpics(newTaskEpic)

// Store

export const configureStore = dependencies => {
  return createStore(
    reducer,
    composeWithDevTools(
      applyMiddleware(createEpicMiddleware(rootEpic, { dependencies }))
    )
  )
}
