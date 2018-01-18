import { createStore, applyMiddleware } from "redux"
import { createEpicMiddleware, combineEpics } from "redux-observable"
import { composeWithDevTools } from "redux-devtools-extension"
import { toastsReducer, toastEpic } from "./toasts"
import { tasksReducer, newTaskReducer, tasksEpic } from "./tasks"

export const reducer = (state = {}, action) => {
  const newState = {
    tasks: tasksReducer(state.tasks, action, state),
    newTask: newTaskReducer(state.newTask, action, state),
    toasts: toastsReducer(state.toasts, action, state)
  }

  let stateChanged = false
  for (const key in newState) {
    if (state[key] !== newState[key]) stateChanged = true
  }

  return stateChanged ? newState : state
}

export const rootEpic = combineEpics(tasksEpic, toastEpic)

// Store

export const configureStore = dependencies => {
  return createStore(
    reducer,
    composeWithDevTools(
      applyMiddleware(createEpicMiddleware(rootEpic, { dependencies }))
    )
  )
}
