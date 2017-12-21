import { createStore, applyMiddleware } from "redux"
import { empty as emptyObservable } from "rxjs/observable/empty"
import { createEpicMiddleware } from "redux-observable"
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

// Reducers

export const reducer = (
  state = { tasks: { status: "UNLOADED", items: {} } },
  { type, ...payload }
) => {
  switch (type) {
    case "TASKS_RECEIVED":
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
    case "DELETE_TASK":
      const { [payload.id]: deletedItem, ...otherItems } = state.tasks.items
      return {
        ...state,
        tasks: {
          ...state.tasks,
          items: otherItems
        }
      }
    default:
      return state
  }
}

// Epics

export const rootEpic = actionsObservable => emptyObservable()

// Store

export const configureStore = () => {
  return createStore(
    reducer,
    composeWithDevTools(applyMiddleware(createEpicMiddleware(rootEpic)))
  )
}
