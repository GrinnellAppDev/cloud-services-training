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

export const editNewTask = text => ({
  type: "EDIT_NEW_TASK",
  text
})
export const editTask = (id, edits) => ({
  type: "EDIT_TASK",
  id,
  edits
})

export const reducer = (
  state = { tasks: { status: "UNLOADED", items: {} } },
  { type, ...payload }
) => {
  switch (type) {
    case "LOAD":
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
    case "RELOAD":
      return {
        ...state,
        tasks: {
          status: "LOADING",
          items: {},
          nextPageToken: null
        }
      }
    case "ADD":
      return {
        ...state,
        tasks: {
          ...state.tasks,
          items: {
            ...state.tasks.items,
            [payload.item._id]: payload.item
          }
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
    case "DELETE":
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

export const rootEpic = actionsObservable => emptyObservable()

export const configureStore = () => {
  return createStore(
    reducer,
    composeWithDevTools(applyMiddleware(createEpicMiddleware(rootEpic)))
  )
}
