import {
  configureStore,
  reducer,
  rootEpic,
  makeGetTasks,
  getTaskById,
  editTask,
  tasksReceived,
  reloadTasks,
  deleteTask,
  editNewTaskText,
  newTaskEpic,
  createNewTask,
  taskCreateFailed,
  taskCreated,
  clearNewTask,
  loadTasksEpic,
  tasksLoadingFailed,
  tasksLoadingStarted,
  loadNextTasks,
  editTaskEpic,
  taskEditFailed,
  taskEditSucceeded,
  deleteTaskEpic,
  taskDeleteFailed,
  taskDeleteSucceeded,
  setToast,
  closeTopToast,
  toastEpic,
  sendToast,
  shiftToasts,
  toastClosed,
  actOnTopToast,
  newTaskReducer,
  toastsReducer,
  tasksReducer
} from "./store"
import { empty as emptyObservable } from "rxjs/observable/empty"
import { interval as intervalObservable } from "rxjs/observable/interval"
import { of as observableOf } from "rxjs/observable/of"
import { _throw as observableThrow } from "rxjs/observable/throw"
import { toArray } from "rxjs/operators/toArray"
import { map } from "rxjs/operators/map"
import { take } from "rxjs/operators/take"
import { getTempTaskId } from "./util"
import { debounceTime as debounceTimeOperator } from "rxjs/operators/debounceTime"
import { mergeMap } from "rxjs/operators/mergeMap"
import { tap } from "rxjs/operators/tap"
import { testEpic, createDelayedObservable } from "./testUtils"

describe("configureStore", () => {
  it("makes a store without a default state", () => {
    expect(configureStore({}).getState()).toBeTruthy()
  })
})

describe("selectors", () => {
  describe("getTaskById", () => {
    it("gets the task when it is there", () => {
      expect(
        getTaskById(
          {
            tasks: {
              items: {
                a: { _id: "a", isComplete: false, text: "foo" }
              }
            }
          },
          "a"
        )
      ).toEqual({ _id: "a", isComplete: false, text: "foo" })
    })

    it("returns undefined when there is no task", () => {
      expect(
        getTaskById(
          {
            tasks: {
              items: {}
            }
          },
          "a"
        )
      ).toBe(undefined)
    })
  })

  describe("getTasks", () => {
    const getTasks = makeGetTasks()

    it("gets a list from a loaded state in order", () => {
      const tempId = getTempTaskId()

      expect(
        getTasks({
          tasks: {
            items: {
              a3s5: { _id: "a3s5", isComplete: false, text: "foo" },
              [tempId]: { _id: tempId, isComplete: false, text: "baz" },
              "123s": { _id: "123s", isComplete: true, text: "bar" }
            }
          }
        })
      ).toEqual([
        { _id: tempId, isComplete: false, text: "baz" },
        { _id: "a3s5", isComplete: false, text: "foo" },
        { _id: "123s", isComplete: true, text: "bar" }
      ])
    })

    it("sorts temporary ids on top", () => {
      expect(
        getTasks({
          tasks: {
            items: {
              a: { _id: "a", isComplete: false, text: "foo" },
              b: { _id: "b", isComplete: true, text: "bar" }
            }
          }
        })
      ).toEqual([
        { _id: "b", isComplete: true, text: "bar" },
        { _id: "a", isComplete: false, text: "foo" }
      ])
    })

    it("gets an empty list from an empty loaded state", () => {
      expect(
        getTasks({
          tasks: {
            items: {}
          }
        })
      ).toEqual([])
    })
  })
})

describe("toastsReducer", () => {
  const initialState = { queue: [] }

  it("has a complete default initial state", () => {
    expect(toastsReducer(undefined, { type: "UNKNOWN" })).toEqual(initialState)
  })

  it("can add a toast", () => {
    expect(
      toastsReducer(
        initialState,
        sendToast("a", "foo", "bar", { useSpinner: true })
      )
    ).toEqual({
      ...initialState,
      queue: [{ id: "a", message: "foo", buttonText: "bar", useSpinner: true }]
    })
  })

  it("can modify a toast", () => {
    expect(
      toastsReducer(
        {
          ...initialState,
          queue: [
            {
              id: "b",
              message: "message b",
              buttonText: "",
              useSpinner: false
            },
            {
              id: "a",
              message: "foo",
              buttonText: "bar",
              useSpinner: false
            },
            {
              id: "c",
              message: "message c",
              buttonText: "",
              useSpinner: false
            }
          ]
        },
        sendToast("a", "foo2", "bar2", { useSpinner: true })
      )
    ).toEqual({
      ...initialState,
      queue: [
        {
          id: "b",
          message: "message b",
          buttonText: "",
          useSpinner: false
        },
        { id: "a", message: "foo2", buttonText: "bar2", useSpinner: true },
        { id: "c", message: "message c", buttonText: "", useSpinner: false }
      ]
    })
  })

  it("can add a toast with defaults", () => {
    expect(toastsReducer(initialState, sendToast("a", "foo"))).toEqual({
      ...initialState,
      queue: [{ id: "a", message: "foo", buttonText: "", useSpinner: false }]
    })
  })

  it("can close the top toast", () => {
    expect(
      toastsReducer(
        {
          ...initialState,
          queue: [
            {
              id: "a",
              message: "foo",
              buttonText: "bar",
              useSpinner: true
            },
            {
              id: "c",
              message: "message c",
              buttonText: "",
              useSpinner: false
            }
          ]
        },
        closeTopToast()
      )
    ).toEqual({
      ...initialState,
      queue: [
        { id: "a", message: "", buttonText: "", useSpinner: false },
        { id: "c", message: "message c", buttonText: "", useSpinner: false }
      ]
    })
  })

  it("closing top toast does nothing when the queue is empty", () => {
    expect(
      toastsReducer(
        {
          ...initialState,
          queue: []
        },
        closeTopToast()
      )
    ).toEqual({
      ...initialState,
      queue: []
    })
  })

  it("can shift out the top toast", () => {
    expect(
      toastsReducer(
        {
          ...initialState,
          queue: [
            { id: "a", message: "foo", buttonText: "bar" },
            { id: "c", message: "message c", buttonText: "" }
          ]
        },
        shiftToasts()
      )
    ).toEqual({
      ...initialState,
      queue: [{ id: "c", message: "message c", buttonText: "" }]
    })
  })
})

describe("reducers", () => {
  const initialNewTaskState = { text: "" }

  describe("newTaskReducer", () => {
    it("ignores unknown actions", () => {
      expect(newTaskReducer(initialNewTaskState, { type: "UNKNOWN" })).toEqual(
        initialNewTaskState
      )
    })

    it("has a complete default initial state", () => {
      expect(newTaskReducer(undefined, { type: "UNKNOWN" })).toEqual(
        initialNewTaskState
      )
    })

    it("can edit the new task", () => {
      expect(
        newTaskReducer(
          {
            ...initialNewTaskState,
            text: "foo"
          },
          editNewTaskText("bar")
        )
      ).toEqual({
        ...initialNewTaskState,
        text: "bar"
      })
    })

    it("can clear out the newTask text", () => {
      expect(
        newTaskReducer(
          {
            ...initialNewTaskState,
            text: "foo"
          },
          clearNewTask()
        )
      ).toEqual({
        ...initialNewTaskState,
        text: ""
      })
    })
  })

  describe("tasksReducer", () => {
    const initialTasksState = {
      status: "UNLOADED",
      items: {},
      nextPageURI: null
    }
    const stateWithTaskA = {
      ...initialTasksState,
      status: "LOADED",
      items: {
        a: { _id: "a", isComplete: false, text: "foo" }
      },
      nextPageURI: "/api/tasks?pageToken=abc"
    }

    it("ignores unknown actions", () => {
      expect(tasksReducer(initialTasksState, { type: "UNKNOWN" })).toEqual(
        initialTasksState
      )
    })

    it("has a complete default initial state", () => {
      expect(tasksReducer(undefined, { type: "UNKNOWN" })).toEqual(
        initialTasksState
      )
    })

    it("adds items on load", () => {
      const itemA = { _id: "a", isComplete: false, text: "foo" }
      const itemB = { _id: "b", isComplete: true, text: "bar" }
      const pageURI1 = "/api/tasks?pageToken=abc"
      const pageURI2 = null
      const stateAfterPage1 = {
        ...initialTasksState,
        status: "LOADED",
        items: {
          a: itemA
        },
        nextPageURI: pageURI1
      }
      const stateAfterPage2 = {
        ...stateAfterPage1,
        status: "LOADED",
        items: {
          a: itemA,
          b: itemB
        },
        nextPageURI: pageURI2
      }

      expect(
        tasksReducer(initialTasksState, tasksReceived([itemA], pageURI1))
      ).toEqual(stateAfterPage1)
      expect(
        tasksReducer(stateAfterPage1, tasksReceived([itemB], pageURI2))
      ).toEqual(stateAfterPage2)
      expect(
        tasksReducer(stateAfterPage2, tasksReceived([], pageURI2))
      ).toEqual(stateAfterPage2)
    })

    it("removes all items on refresh", () => {
      expect(tasksReducer(stateWithTaskA, reloadTasks())).toEqual({
        ...stateWithTaskA,
        items: {},
        nextPageURI: null
      })
    })

    it("sets the status to loading once loading starts", () => {
      expect(tasksReducer(stateWithTaskA, tasksLoadingStarted())).toEqual({
        ...stateWithTaskA,
        status: "LOADING"
      })
    })

    it("indicates errors when loading tasks fails", () => {
      expect(
        tasksReducer(stateWithTaskA, tasksLoadingFailed("foo error"))
      ).toEqual({
        ...stateWithTaskA,
        status: "ERROR",
        lastErrorMessage: "foo error"
      })
    })

    it("can edit tasks", () => {
      expect(
        tasksReducer(stateWithTaskA, editTask("a", { isComplete: true }))
      ).toEqual({
        ...stateWithTaskA,
        items: {
          ...stateWithTaskA.items,
          a: { ...stateWithTaskA.items.a, isComplete: true }
        }
      })
    })

    it("reverts back to the original when edit fails", () => {
      expect(
        tasksReducer(stateWithTaskA, taskEditFailed("a", { isComplete: true }))
      ).toEqual({
        ...stateWithTaskA,
        items: {
          ...stateWithTaskA.items,
          a: { ...stateWithTaskA.items.a, isComplete: true }
        }
      })
    })

    it("can delete tasks", () => {
      expect(tasksReducer(stateWithTaskA, deleteTask("a"))).toEqual({
        ...stateWithTaskA,
        items: {}
      })
    })

    it("puts a task back if it failed to delete", () => {
      expect(
        tasksReducer(
          stateWithTaskA,
          taskDeleteFailed("b", { isComplete: true, text: "bar" })
        )
      ).toEqual({
        ...stateWithTaskA,
        items: {
          ...stateWithTaskA.items,
          b: { _id: "b", isComplete: true, text: "bar" }
        }
      })
    })

    it("deletes a task if it failed to create on the server", () => {
      expect(tasksReducer(stateWithTaskA, taskCreateFailed("a"))).toEqual({
        ...stateWithTaskA,
        items: {}
      })
    })

    it("creates a dummy task with a temporary id while the server loads the real one", () => {
      expect(
        tasksReducer(initialTasksState, createNewTask("fooTempId"), {
          newTask: { ...initialNewTaskState, text: "foo" }
        })
      ).toEqual({
        ...initialTasksState,
        items: {
          fooTempId: {
            _id: "fooTempId",
            tempId: "fooTempId",
            isComplete: false,
            text: "foo"
          }
        }
      })
    })

    it("does not create a dummy task when there is no new task text entered", () => {
      expect(
        tasksReducer(initialTasksState, createNewTask("fooTempId"), {
          newTask: { ...initialNewTaskState, text: "" }
        })
      ).toEqual(initialTasksState)
    })

    it("creation replaces the temporary ID with the one from the server", () => {
      expect(
        tasksReducer(
          {
            ...initialTasksState,
            status: "LOADED",
            items: {
              "~123": {
                _id: "~123",
                tempId: "~123",
                isComplete: false,
                text: "foo"
              }
            }
          },
          taskCreated("~123", "abc")
        )
      ).toEqual({
        ...initialTasksState,
        status: "LOADED",
        items: {
          abc: { _id: "abc", tempId: "~123", isComplete: false, text: "foo" }
        }
      })
    })
  })
})

describe("epics", () => {
  describe("rootEpic", () => {
    it("ignores unknown actions", async () => {
      testEpic({
        epic: rootEpic,
        inputted: "-u-----",
        expected: "-------",
        valueMap: {
          u: { type: "UNKNOWN" }
        }
      })
    })
  })

  describe("loadTasksEpic", () => {
    // TODO: validate tasks against a schema and give helpful errors when it fails

    const valueMap = {
      r: reloadTasks(),
      n: loadNextTasks(),
      s: tasksLoadingStarted(),
      f: tasksLoadingFailed("Failed to fetch"),
      h: tasksLoadingFailed("HTTP Error: Server error (500)"),
      x: tasksReceived([], null)
    }

    it("calls fetch when given a reload action", async () => {
      const fetch = jest.fn().mockReturnValue(observableOf())

      testEpic({
        epic: loadTasksEpic,
        inputted: "-r-----",
        valueMap,
        getState: () => ({ tasks: {} }),
        getDependencies: () => ({ fetch })
      })

      expect(fetch).toBeCalledWith("/api/tasks")
    })

    it("doesn't call fetch and sends nothing when already loading", async () => {
      const fetch = jest.fn().mockReturnValue(observableOf())

      testEpic({
        epic: loadTasksEpic,
        inputted: "-r-----",
        expected: "-------",
        valueMap,
        getState: () => ({ tasks: { status: "LOADING" } }),
        getDependencies: () => ({ fetch })
      })

      expect(fetch).not.toBeCalled()
    })

    it("calls fetch when asked to load next with an error", async () => {
      const fetch = jest.fn().mockReturnValue(observableOf())

      testEpic({
        epic: loadTasksEpic,
        inputted: "-n-----",
        valueMap,
        getState: () => ({ tasks: { status: "ERROR", nextPageURI: null } }),
        getDependencies: () => ({ fetch })
      })

      expect(fetch).toBeCalledWith("/api/tasks")
    })

    it("calls fetch when given a reload action with an error", async () => {
      const fetch = jest.fn().mockReturnValue(observableOf())

      testEpic({
        epic: loadTasksEpic,
        inputted: "-r-----",
        valueMap,
        getState: () => ({
          tasks: { status: "ERROR", nextPageURI: null }
        }),
        getDependencies: () => ({ fetch })
      })

      expect(fetch).toBeCalledWith("/api/tasks")
    })

    it("calls fetch when given a load page action if tasks are unloaded", async () => {
      const fetch = jest.fn().mockReturnValue(observableOf())

      testEpic({
        epic: loadTasksEpic,
        inputted: "-n-----",
        valueMap,
        getState: () => ({
          tasks: { status: "UNLOADED", nextPageURI: null }
        }),
        getDependencies: () => ({ fetch })
      })

      expect(fetch).toBeCalledWith("/api/tasks")
    })

    it("does not call fetch when given a load page action if tasks are loaded and there is no next page URI", async () => {
      const fetch = jest.fn().mockReturnValue(observableOf())

      testEpic({
        epic: loadTasksEpic,
        inputted: "-n-----",
        valueMap,
        getState: () => ({
          tasks: { nextPageURI: null }
        }),
        getDependencies: () => ({ fetch })
      })

      expect(fetch).not.toBeCalled()
    })

    it("calls fetch when given a load page action with the next page URI", async () => {
      const fetch = jest.fn().mockReturnValue(observableOf())

      testEpic({
        epic: loadTasksEpic,
        inputted: "-n-----",
        valueMap,
        getState: () => ({
          tasks: { nextPageURI: "/api/tasks?pageToken=abc" }
        }),
        getDependencies: () => ({ fetch })
      })

      expect(fetch).toBeCalledWith("/api/tasks?pageToken=abc")
    })

    it("handles fetch errors gracefully", async () => {
      testEpic({
        epic: loadTasksEpic,
        inputted: "-r-----",
        expected: "-s----f",
        valueMap,
        getState: () => ({ tasks: {} }),
        getDependencies: scheduler => ({
          fetch: () =>
            createDelayedObservable(
              observableThrow(TypeError("Failed to fetch")),
              scheduler
            )
        })
      })
    })

    it("handles http errors gracefully", async () => {
      testEpic({
        epic: loadTasksEpic,
        inputted: "-r-----",
        expected: "-s----h",
        valueMap,
        getState: () => ({ tasks: {} }),
        getDependencies: scheduler => ({
          fetch: () =>
            createDelayedObservable(
              observableOf({
                ok: false,
                status: 500,
                statusText: "Server error"
              }),
              scheduler
            )
        })
      })
    })

    it("loads tasks and next page token", async () => {
      testEpic({
        epic: loadTasksEpic,
        inputted: "-r-----",
        expected: "-s----d",
        valueMap: {
          ...valueMap,
          d: tasksReceived(
            [
              { _id: "a", isComplete: false, text: "foo" },
              { _id: "b", isComplete: true, text: "bar" }
            ],
            "/api/tasks?pageToken=abc"
          )
        },
        getState: () => ({ tasks: {} }),
        getDependencies: scheduler => ({
          fetch: () =>
            createDelayedObservable(
              observableOf({
                ok: true,
                json: () =>
                  observableOf([
                    { _id: "a", isComplete: false, text: "foo" },
                    { _id: "b", isComplete: true, text: "bar" }
                  ]),
                headers: {
                  get: name => {
                    expect(name.toLowerCase()).toBe("link")
                    return '</api/tasks?pageToken=abc>; rel="next"'
                  }
                }
              }),
              scheduler
            )
        })
      })
    })

    it("handles empty tasks and null next page token", async () => {
      testEpic({
        epic: loadTasksEpic,
        inputted: "-r-----",
        expected: "-s----x",
        valueMap,
        getState: () => ({ tasks: {} }),
        getDependencies: scheduler => ({
          fetch: () =>
            createDelayedObservable(
              observableOf({
                ok: true,
                json: () => observableOf([]),
                headers: {
                  get: name => {
                    expect(name.toLowerCase()).toBe("link")
                    return null
                  }
                }
              }),
              scheduler
            )
        })
      })
    })
  })

  describe("newTaskEpic", () => {
    const valueMap = {
      n: createNewTask("abc"),
      l: clearNewTask(),
      f: taskCreateFailed("abc", "Failed to fetch"),
      h: taskCreateFailed("abc", "HTTP Error: Server error (500)"),
      r: reloadTasks(),
      t: sendToast("CREATE_TASK_FAILED", "Couldn't create task")
    }

    it("calls fetch when it gets a create action", async () => {
      const fetch = jest.fn().mockReturnValue(observableOf())

      testEpic({
        epic: newTaskEpic,
        inputted: "-n-----",
        valueMap,
        getState: () => ({ newTask: { text: "foo" } }),
        getDependencies: () => ({ fetch })
      })

      expect(fetch).toBeCalledWith("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          isComplete: false,
          text: "foo"
        })
      })
    })

    it("does nothing when it gets a create action without text", async () => {
      const fetch = jest.fn().mockReturnValue(observableOf())

      testEpic({
        epic: newTaskEpic,
        inputted: "-n-----",
        expected: "-------",
        valueMap,
        getState: () => ({ newTask: { text: "" } }),
        getDependencies: () => ({ fetch })
      })

      expect(fetch).not.toBeCalled()
    })

    it("handles fetch errors gracefully", async () => {
      testEpic({
        epic: newTaskEpic,
        inputted: "-n--------",
        expected: "-l----(ft)",
        valueMap,
        getState: () => ({ newTask: { text: "foo" } }),
        getDependencies: scheduler => ({
          fetch: () =>
            createDelayedObservable(
              observableThrow(TypeError("Failed to fetch")),
              scheduler
            )
        })
      })
    })

    it("handles http errors gracefully", async () => {
      testEpic({
        epic: newTaskEpic,
        inputted: "-n-----",
        expected: "-l----(ht)",
        valueMap,
        getState: () => ({ newTask: { text: "foo" } }),
        getDependencies: scheduler => ({
          fetch: () =>
            createDelayedObservable(
              observableOf({
                ok: false,
                status: 500,
                statusText: "Server error"
              }),
              scheduler
            )
        })
      })
    })

    it("indicates success with a new id", async () => {
      testEpic({
        epic: newTaskEpic,
        inputted: "-n-----",
        expected: "-l----s",
        valueMap: {
          ...valueMap,
          s: taskCreated("abc", "def")
        },
        getState: () => ({ newTask: { text: "foo" } }),
        getDependencies: scheduler => ({
          fetch: () =>
            createDelayedObservable(
              observableOf({
                ok: true,
                json: () => observableOf({ _id: "def" })
              }),
              scheduler
            )
        })
      })
    })
  })

  describe("editTaskEpic", () => {
    // TODO: add throttling with a reduce operation so we don't lose edits

    const valueMap = {
      e: editTask(
        "a",
        { isComplete: true, text: "foo" },
        { isComplete: false, text: "bar" }
      ),
      f: taskEditFailed(
        "a",
        { isComplete: false, text: "bar" },
        "Failed to fetch"
      ),
      h: taskEditFailed(
        "a",
        { isComplete: false, text: "bar" },
        "HTTP Error: Server error (500)"
      ),
      t: sendToast("EDIT_TASK_FAILED", "Couldn't update task"),
      s: taskEditSucceeded("a")
    }

    it("calls fetch when it gets an edit action", async () => {
      const fetch = jest.fn().mockReturnValue(observableOf())

      testEpic({
        epic: editTaskEpic,
        inputted: "-e-----",
        valueMap,
        getDependencies: () => ({ fetch })
      })

      expect(fetch).toBeCalledWith("/api/tasks/a", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(valueMap.e.edits)
      })
    })

    it("handles fetch errors gracefully", async () => {
      testEpic({
        epic: editTaskEpic,
        inputted: "-e--------",
        expected: "------(ft)",
        valueMap,
        getDependencies: scheduler => ({
          fetch: () =>
            createDelayedObservable(
              observableThrow(TypeError("Failed to fetch")),
              scheduler
            )
        })
      })
    })

    it("handles http errors gracefully", async () => {
      testEpic({
        epic: editTaskEpic,
        inputted: "-e--------",
        expected: "------(ht)",
        valueMap,
        getDependencies: scheduler => ({
          fetch: () =>
            createDelayedObservable(
              observableOf({
                ok: false,
                status: 500,
                statusText: "Server error"
              }),
              scheduler
            )
        })
      })
    })

    it("indicates success when the request goes through", async () => {
      testEpic({
        epic: editTaskEpic,
        inputted: "-e-----",
        expected: "------s",
        valueMap,
        getDependencies: scheduler => ({
          fetch: () =>
            createDelayedObservable(observableOf({ ok: true }), scheduler)
        })
      })
    })
  })

  describe("deleteTaskEpic", () => {
    const valueMap = {
      d: deleteTask("a", { isComplete: true, text: "foo" }),
      e: deleteTask(getTempTaskId(), { isComplete: true, text: "bar temp" }),
      t: sendToast("TASK_DELETE_START", "Deleting task...", "Undo", {
        useSpinner: true
      }),
      x: toastClosed("TASK_DELETE_START", { withAction: false }),
      u: toastClosed("TASK_DELETE_START", { withAction: true }),
      f: taskDeleteFailed(
        "a",
        { isComplete: true, text: "foo" },
        "Failed to fetch"
      ),
      g: sendToast("TASK_DELETE_ERROR", "Failed to fetch"),
      h: taskDeleteFailed(
        "a",
        { isComplete: true, text: "foo" },
        "HTTP Error: Server error (500)"
      ),
      i: sendToast("TASK_DELETE_ERROR", "HTTP Error: Server error (500)"),
      j: taskDeleteFailed("a", { isComplete: true, text: "foo" }, "Undone"),
      s: taskDeleteSucceeded("a")
    }

    it("calls fetch when it gets a delete action", async () => {
      const fetch = jest.fn().mockReturnValue(observableOf())

      testEpic({
        epic: deleteTaskEpic,
        inputted: "-d-x-",
        valueMap,
        getDependencies: () => ({ fetch })
      })

      expect(fetch).toBeCalledWith("/api/tasks/a", {
        method: "DELETE"
      })
    })

    it("does nothing when it gets a delete action with a temp id", async () => {
      const fetch = jest
        .fn()
        .mockReturnValue(observableThrow(TypeError("Failed to fetch")))

      testEpic({
        epic: deleteTaskEpic,
        inputted: "-e-x-",
        expected: "-----",
        valueMap,
        getDependencies: () => ({ fetch })
      })

      expect(fetch).not.toBeCalled()
    })

    it("does nothing if the toast isn't closed", async () => {
      const fetch = jest
        .fn()
        .mockReturnValue(observableThrow(TypeError("Failed to fetch")))

      testEpic({
        epic: deleteTaskEpic,
        inputted: "-d-",
        expected: "-t-",
        valueMap,
        getDependencies: () => ({ fetch })
      })

      expect(fetch).not.toBeCalled()
    })

    it("can send multiple toasts", async () => {
      testEpic({
        epic: deleteTaskEpic,
        inputted: "-d-b-c-",
        expected: "-t-t-t-",
        valueMap: {
          ...valueMap,
          b: deleteTask("b", { isComplete: false, text: "foo b" }),
          c: deleteTask("c", { isComplete: true, text: "foo c" })
        },
        getDependencies: scheduler => ({
          fetch: () =>
            createDelayedObservable(
              observableThrow(TypeError("Failed to fetch")),
              scheduler
            )
        })
      })
    })

    it("can delete multiple tasks with one toast", async () => {
      testEpic({
        epic: deleteTaskEpic,
        inputted: "-d-b-c----x---------",
        expected: "-t-t-t---------(sqr)",
        valueMap: {
          ...valueMap,
          b: deleteTask("b", { isComplete: false, text: "foo b" }),
          c: deleteTask("c", { isComplete: true, text: "foo c" }),
          q: taskDeleteSucceeded("b"),
          r: taskDeleteSucceeded("c")
        },
        getDependencies: scheduler => ({
          fetch: () =>
            createDelayedObservable(observableOf({ ok: true }), scheduler)
        })
      })
    })

    it("handles undo and doesn't fetch", async () => {
      const fetch = jest.fn().mockReturnValue(observableOf({ ok: true }))

      testEpic({
        epic: deleteTaskEpic,
        inputted: "-d--u-",
        expected: "-t--j-",
        valueMap,
        getDependencies: () => ({ fetch })
      })

      expect(fetch).not.toBeCalled()
    })

    it("handles fetch errors gracefully", async () => {
      testEpic({
        epic: deleteTaskEpic,
        inputted: "-d--x--------",
        expected: "-t-------(fg)",
        valueMap,
        getDependencies: scheduler => ({
          fetch: () =>
            createDelayedObservable(
              observableThrow(TypeError("Failed to fetch")),
              scheduler
            )
        })
      })
    })

    it("handles http errors gracefully", async () => {
      testEpic({
        epic: deleteTaskEpic,
        inputted: "-d--x--------",
        expected: "-t-------(hi)",
        valueMap,
        getDependencies: scheduler => ({
          fetch: () =>
            createDelayedObservable(
              observableOf({
                ok: false,
                status: 500,
                statusText: "Server error"
              }),
              scheduler
            )
        })
      })
    })

    it("indicates success when the request goes through", async () => {
      testEpic({
        epic: deleteTaskEpic,
        inputted: "-d--x-----",
        expected: "-t-------s",
        valueMap,
        getDependencies: scheduler => ({
          fetch: () =>
            createDelayedObservable(observableOf({ ok: true }), scheduler)
        })
      })
    })

    it("ignores multiple close actions", async () => {
      testEpic({
        epic: deleteTaskEpic,
        inputted: "-d--x-x---",
        expected: "-t-------s",
        valueMap,
        getDependencies: scheduler => ({
          fetch: () =>
            createDelayedObservable(observableOf({ ok: true }), scheduler)
        })
      })
    })
  })

  describe("toastEpic", () => {
    const valueMap = {
      a: sendToast("a", "toast a", "bar"),
      b: sendToast("b", "toast b"),
      c: closeTopToast({ withAction: false }),
      d: closeTopToast({ withAction: true }),
      x: toastClosed("a", { withAction: false }),
      y: toastClosed("a", { withAction: true }),
      s: shiftToasts()
    }

    it("does nothing when given a non-empty queue from a send action", () => {
      testEpic({
        epic: toastEpic,
        inputted: "-a--",
        expected: "----",
        valueMap,
        getState: () => ({ toasts: { queue: [{}, {}] } })
      })
    })

    it("does nothing when given an empty queue from a shift action", () => {
      testEpic({
        epic: toastEpic,
        inputted: "-s--",
        expected: "----",
        valueMap,
        getState: () => ({ toasts: { queue: [] } })
      })
    })

    it("sends a clear toast and then a shift toasts action when sent a toast", () => {
      testEpic({
        epic: toastEpic,
        inputted: "-a---------------",
        expected: "-----------(cx)-s",
        valueMap,
        getState: () => ({ toasts: { queue: [{ id: "a" }] } })
      })
    })

    it("sends a clear toast and then a shift toasts action when sent a shift", () => {
      testEpic({
        epic: toastEpic,
        inputted: "-s---------------",
        expected: "-----------(cx)-s",
        valueMap,
        getState: () => ({ toasts: { queue: [{ id: "a" }] } })
      })
    })

    it("doesn't send another close action when closed early", () => {
      testEpic({
        epic: toastEpic,
        inputted: "-a--c-----",
        expected: "----x----s",
        valueMap,
        getState: () => ({ toasts: { queue: [{ id: "a" }] } })
      })
    })

    it("acknowledges closure with action", () => {
      testEpic({
        epic: toastEpic,
        inputted: "-a--d-----",
        expected: "----y----s",
        valueMap,
        getState: () => ({ toasts: { queue: [{ id: "a" }] } })
      })
    })

    it("acknowledges closure with action in the second half of its life", () => {
      testEpic({
        epic: toastEpic,
        inputted: "-a-------d-----",
        expected: "---------y----s",
        valueMap,
        getState: () => ({ toasts: { queue: [{ id: "a" }] } })
      })
    })

    it("ignores more than one clear toast action", () => {
      testEpic({
        epic: toastEpic,
        inputted: "-a--c--c--",
        expected: "----x----s",
        valueMap,
        getState: () => ({ toasts: { queue: [{ id: "a" }] } })
      })
    })

    it("can clear in the second half of the toast's life", () => {
      testEpic({
        epic: toastEpic,
        inputted: "-a------c-----",
        expected: "--------x----s",
        valueMap,
        getState: () => ({ toasts: { queue: [{ id: "a" }] } })
      })
    })

    it("clears toast early when sent another toast", () => {
      testEpic({
        epic: toastEpic,
        inputted: "-a-b--------",
        expected: "------(cx)-s",
        valueMap,
        getState: jest
          .fn()
          .mockReturnValueOnce({ toasts: { queue: [{ id: "a" }] } })
          .mockReturnValue({ toasts: { queue: [{ id: "a" }, { id: "b" }] } })
      })
    })

    it("extends a toast's lifetime when updated", () => {
      testEpic({
        epic: toastEpic,
        inputted: "-a---a----------",
        expected: "---------------(cx)-s",
        valueMap,
        getState: () => ({ toasts: { queue: [{ id: "a" }] } })
      })
    })

    it("extends a toast's lifetime when updated multiple times", () => {
      testEpic({
        epic: toastEpic,
        inputted: "-a---a---a---------------",
        expected: "-------------------(cx)-s",
        valueMap,
        getState: () => ({ toasts: { queue: [{ id: "a" }] } })
      })
    })

    it("extends a toast's lifetime when updated in the second half of its life", () => {
      testEpic({
        epic: toastEpic,
        inputted: "-a-------a---------------",
        expected: "-------------------(cx)-s",
        valueMap,
        getState: () => ({ toasts: { queue: [{ id: "a" }] } })
      })
    })
  })
})
