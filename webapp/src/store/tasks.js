import { combineEpics } from "redux-observable"
import { createSelector } from "reselect"
import parseLinkHeader from "parse-link-header"
import { isTempTaskId, asciiCompare } from "../util"
import { merge as mergeObservables } from "rxjs/observable/merge"
import { empty as emptyObservable } from "rxjs/observable/empty"
import { of as observableOf } from "rxjs/observable/of"
import { from as observableFrom } from "rxjs/observable/from"
import { mergeMap } from "rxjs/operators/mergeMap"
import { filter } from "rxjs/operators/filter"
import { take } from "rxjs/operators/take"
import { map } from "rxjs/operators/map"
import { catchError } from "rxjs/operators/catchError"
import { _throw as observableThrow } from "rxjs/observable/throw"
import { forkJoin as forkJoinObservables } from "rxjs/observable/forkJoin"
import { sendToast } from "./toasts"

// Selectors

export const getNewTaskText = state => state.newTask.text
export const getTaskById = (state, id) => state.tasks.items[id]
export const getTasksStatus = state => state.tasks.status
export const getLastTasksErrorMessage = state => state.tasks.lastErrorMessage
export const getNextPageURI = state => state.tasks.nextPageURI

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
export const tasksReceived = (items, nextPageURI) => ({
  type: "TASKS_RECEIVED",
  items,
  nextPageURI
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

export const newTaskReducer = (state = { text: "" }, { type, ...payload }) => {
  switch (type) {
    case "CLEAR_NEW_TASK":
      return {
        ...state,
        text: ""
      }
    case "EDIT_NEW_TASK_TEXT":
      return {
        text: payload.text
      }
    default:
      return state
  }
}

export const tasksReducer = (
  state = { status: "UNLOADED", items: {}, nextPageURI: null },
  { type, ...payload },
  globalState
) => {
  switch (type) {
    case "RELOAD_TASKS":
      return {
        ...state,
        items: {},
        nextPageURI: null
      }
    case "TASKS_LOADING_STARTED":
      return {
        ...state,
        status: "LOADING"
      }
    case "TASKS_RECEIVED": {
      const items = { ...state.items }
      for (const item of payload.items) {
        items[item._id] = item
      }

      return {
        status: "LOADED",
        items,
        nextPageURI: payload.nextPageURI
      }
    }
    case "TASKS_LOADING_FAILED":
      return {
        ...state,
        status: "ERROR",
        lastErrorMessage: payload.message
      }
    case "CREATE_NEW_TASK":
      return {
        ...state,
        items: globalState.newTask.text
          ? {
              ...state.items,
              [payload.temporaryId]: {
                _id: payload.temporaryId,
                tempId: payload.temporaryId,
                isComplete: false,
                text: globalState.newTask.text
              }
            }
          : state.items
      }
    case "TASK_CREATED": {
      const { [payload.temporaryId]: localTask, ...otherItems } = state.items

      return {
        ...state,
        items: {
          ...otherItems,
          [payload.realId]: {
            ...localTask,
            _id: payload.realId
          }
        }
      }
    }
    case "TASK_CREATE_FAILED": {
      const { [payload.temporaryId]: deletedItem, ...otherItems } = state.items
      return {
        ...state,
        items: otherItems
      }
    }
    case "EDIT_TASK":
    case "TASK_EDIT_FAILED":
      return {
        ...state,
        items: {
          ...state.items,
          [payload.id]: {
            ...state.items[payload.id],
            ...(type === "EDIT_TASK" ? payload.edits : payload.original)
          }
        }
      }
    case "DELETE_TASK": {
      const { [payload.id]: deletedItem, ...otherItems } = state.items
      return {
        ...state,
        items: otherItems
      }
    }
    case "TASK_DELETE_FAILED":
      return {
        ...state,
        items: {
          ...state.items,
          [payload.id]: {
            ...payload.original,
            _id: payload.id
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
  { fetch, delay }
) =>
  actionsObservable.ofType("RELOAD_TASKS", "LOAD_NEXT_TASKS").pipe(
    mergeMap(({ type }) => {
      const status = getTasksStatus(getState())

      if (
        status === "LOADING" ||
        (type === "LOAD_NEXT_TASKS" &&
          status !== "UNLOADED" &&
          status !== "ERROR" &&
          !getNextPageURI(getState()))
      )
        return emptyObservable()
      else
        return mergeObservables(
          observableOf(tasksLoadingStarted()),
          forkJoinObservables([
            fetch(getNextPageURI(getState()) || "/api/tasks"),
            type === "RELOAD_TASKS" || status === "ERROR"
              ? observableOf(null).pipe(delay(500))
              : observableOf(null)
          ]).pipe(
            mergeMap(([response]) => {
              if (response.ok) {
                const { next } =
                  parseLinkHeader(response.headers.get("Link")) || {}

                return observableFrom(response.json()).pipe(
                  map(body => {
                    return tasksReceived(body, next ? next.url : null)
                  })
                )
              } else
                throw Error(
                  `HTTP Error: ${response.statusText} (${response.status})`
                )
            }),
            catchError(err => observableOf(tasksLoadingFailed(err.message)))
          )
        )
    })
  )

export const newTaskEpic = (actionsObservable, { getState }, { fetch }) =>
  actionsObservable.ofType("CREATE_NEW_TASK").pipe(
    mergeMap(
      ({ temporaryId }) =>
        !getNewTaskText(getState())
          ? emptyObservable()
          : mergeObservables(
              observableOf(clearNewTask()),
              observableFrom(
                fetch("/api/tasks", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json"
                  },
                  body: JSON.stringify({
                    isComplete: false,
                    text: getNewTaskText(getState())
                  })
                })
              ).pipe(
                mergeMap(
                  response =>
                    response.ok
                      ? observableFrom(response.json())
                      : observableThrow(
                          Error(
                            `HTTP Error: ${response.statusText} (${
                              response.status
                            })`
                          )
                        )
                ),
                map(({ _id }) => taskCreated(temporaryId, _id)),
                catchError(err =>
                  observableOf(
                    taskCreateFailed(temporaryId, err.message),
                    sendToast("CREATE_TASK_FAILED", "Couldn't create task")
                  )
                )
              )
            )
    )
  )

export const editTaskEpic = (actionsObservable, { getState }, { fetch }) =>
  actionsObservable.ofType("EDIT_TASK").pipe(
    mergeMap(({ id, edits, original }) =>
      observableFrom(
        fetch(`/api/tasks/${id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(edits)
        })
      ).pipe(
        map(response => {
          if (response.ok) return taskEditSucceeded(id)
          else
            throw Error(
              `HTTP Error: ${response.statusText} (${response.status})`
            )
        }),
        catchError(err =>
          observableOf(
            taskEditFailed(id, original, err.message),
            sendToast("EDIT_TASK_FAILED", "Couldn't update task")
          )
        )
      )
    )
  )

export const deleteTaskEpic = (actionsObservable, { getState }, { fetch }) =>
  actionsObservable.ofType("DELETE_TASK").pipe(
    filter(({ id }) => !isTempTaskId(id)),
    mergeMap(({ id, original }) =>
      mergeObservables(
        observableOf(
          sendToast("TASK_DELETE_START", "Deleting task...", "Undo", {
            useSpinner: true
          })
        ),
        actionsObservable.ofType("TOAST_CLOSED").pipe(
          filter(({ id: toastId }) => toastId === "TASK_DELETE_START"),
          take(1),
          mergeMap(
            ({ withAction }) =>
              withAction
                ? observableOf(taskDeleteFailed(id, original, "Undo"))
                : observableFrom(
                    fetch(`/api/tasks/${id}`, {
                      method: "DELETE"
                    })
                  ).pipe(
                    map(response => {
                      if (response.ok) return taskDeleteSucceeded(id)
                      else
                        throw Error(
                          `HTTP Error: ${response.statusText} (${
                            response.status
                          })`
                        )
                    }),
                    catchError(err =>
                      observableOf(
                        taskDeleteFailed(id, original, err.message),
                        sendToast("TASK_DELETE_ERROR", err.message)
                      )
                    )
                  )
          )
        )
      )
    )
  )

export const tasksEpic = combineEpics(
  loadTasksEpic,
  newTaskEpic,
  editTaskEpic,
  deleteTaskEpic
)