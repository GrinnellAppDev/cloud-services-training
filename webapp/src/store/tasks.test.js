import {
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
  newTaskReducer,
  tasksReducer,
  signInFromToastEpic,
  reloadOnAuthEpic
} from "./tasks"
import { sendToast, toastClosed } from "./toasts"
import { of as observableOf } from "rxjs/observable/of"
import { _throw as observableThrow } from "rxjs/observable/throw"
import { getTempTaskId } from "../util"
import { testEpic, createDelayedObservable } from "./testUtils"
import {
  openAuthDialog,
  receiveAuthToken,
  authSubmitSuccess,
  clearAuthToken
} from "./auth"
import { delay } from "rxjs/operators/delay"

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
  describe("signInFromToastEpic", () => {
    it("ignores other toasts", () => {
      testEpic({
        epic: signInFromToastEpic,
        inputted: "-t------",
        expected: "--------",
        valueMap: {
          t: toastClosed("UNKNOWN", { withAction: true })
        }
      })
    })

    it("ignores the toast when there was no action", () => {
      testEpic({
        epic: signInFromToastEpic,
        inputted: "-t------",
        expected: "--------",
        valueMap: {
          t: toastClosed("SIGN_IN", { withAction: false })
        }
      })
    })

    it("handles the toast", () => {
      testEpic({
        epic: signInFromToastEpic,
        inputted: "-t------",
        expected: "-o------",
        valueMap: {
          t: toastClosed("SIGN_IN", { withAction: true }),
          o: openAuthDialog()
        }
      })
    })
  })

  describe("reloadOnAuthEpic", () => {
    it("sends reload when it gets auth submit success", () => {
      testEpic({
        epic: reloadOnAuthEpic,
        inputted: "-s------",
        expected: "-r------",
        valueMap: {
          s: authSubmitSuccess(),
          r: reloadTasks()
        }
      })
    })

    it("sends reload when it gets clear auth token", () => {
      testEpic({
        epic: reloadOnAuthEpic,
        inputted: "-c------",
        expected: "-r------",
        valueMap: {
          c: clearAuthToken(),
          r: reloadTasks()
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

    it("calls fetch when given a reload action", () => {
      const fetch = jest.fn().mockReturnValue(observableOf())

      testEpic({
        epic: loadTasksEpic,
        inputted: "-r-----",
        valueMap,
        getState: () => ({
          tasks: {},
          auth: { token: null }
        }),
        getDependencies: () => ({ fetch })
      })

      expect(fetch).toBeCalledWith("/api/tasks", {
        headers: { Authorization: "Bearer null" }
      })
    })

    it("doesn't call fetch and sends nothing when already loading", () => {
      const fetch = jest.fn().mockReturnValue(observableOf())

      testEpic({
        epic: loadTasksEpic,
        inputted: "-r-----",
        expected: "-------",
        valueMap,
        getState: () => ({
          tasks: { status: "LOADING" },
          auth: { token: null }
        }),
        getDependencies: () => ({ fetch })
      })

      expect(fetch).not.toBeCalled()
    })

    it("calls fetch when asked to load next with an error", () => {
      const fetch = jest.fn().mockReturnValue(observableOf())

      testEpic({
        epic: loadTasksEpic,
        inputted: "-n-----",
        valueMap,
        getState: () => ({
          tasks: { status: "ERROR", nextPageURI: null },
          auth: { token: null }
        }),
        getDependencies: () => ({ fetch })
      })

      expect(fetch).toBeCalledWith("/api/tasks", {
        headers: { Authorization: "Bearer null" }
      })
    })

    it("calls fetch when given a reload action with an error", () => {
      const fetch = jest.fn().mockReturnValue(observableOf())

      testEpic({
        epic: loadTasksEpic,
        inputted: "-r-----",
        valueMap,
        getState: () => ({
          tasks: { status: "ERROR", nextPageURI: null },
          auth: { token: null }
        }),
        getDependencies: () => ({ fetch })
      })

      expect(fetch).toBeCalledWith("/api/tasks", {
        headers: { Authorization: "Bearer null" }
      })
    })

    it("calls fetch when given a load page action if tasks are unloaded", () => {
      const fetch = jest.fn().mockReturnValue(observableOf())

      testEpic({
        epic: loadTasksEpic,
        inputted: "-n-----",
        valueMap,
        getState: () => ({
          tasks: { status: "UNLOADED", nextPageURI: null },
          auth: { token: null }
        }),
        getDependencies: () => ({ fetch })
      })

      expect(fetch).toBeCalledWith("/api/tasks", {
        headers: { Authorization: "Bearer null" }
      })
    })

    it("does not call fetch when given a load page action if tasks are loaded and there is no next page URI", () => {
      const fetch = jest.fn().mockReturnValue(observableOf())

      testEpic({
        epic: loadTasksEpic,
        inputted: "-n-----",
        valueMap,
        getState: () => ({
          tasks: { nextPageURI: null },
          auth: { token: null }
        }),
        getDependencies: () => ({ fetch })
      })

      expect(fetch).not.toBeCalled()
    })

    it("calls fetch when given a load page action with the next page URI", () => {
      const fetch = jest.fn().mockReturnValue(observableOf())

      testEpic({
        epic: loadTasksEpic,
        inputted: "-n-----",
        valueMap,
        getState: () => ({
          tasks: { nextPageURI: "/api/tasks?pageToken=abc" },
          auth: { token: null }
        }),
        getDependencies: () => ({ fetch })
      })

      expect(fetch).toBeCalledWith("/api/tasks?pageToken=abc", {
        headers: { Authorization: "Bearer null" }
      })
    })

    it("handles fetch errors gracefully", () => {
      testEpic({
        epic: loadTasksEpic,
        inputted: "-r-----",
        expected: "-s----f",
        valueMap,
        getState: () => ({ tasks: {}, auth: {} }),
        getDependencies: scheduler => ({
          fetch: () =>
            createDelayedObservable(
              observableThrow(TypeError("Failed to fetch")),
              scheduler
            )
        })
      })
    })

    it("handles http errors gracefully", () => {
      testEpic({
        epic: loadTasksEpic,
        inputted: "-r-----",
        expected: "-s----h",
        valueMap,
        getState: () => ({ tasks: {}, auth: {} }),
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

    it("ignores 401s when there is no auth", () => {
      testEpic({
        epic: loadTasksEpic,
        inputted: "-r-----",
        expected: "-s----x",
        valueMap,
        getState: () => ({ tasks: {}, auth: { token: null } }),
        getDependencies: scheduler => ({
          fetch: () =>
            createDelayedObservable(
              observableOf({
                ok: false,
                status: 401,
                statusText: "Unauthorized"
              }),
              scheduler
            )
        })
      })
    })

    it("fails out of a 401 if the token isn't expired", () => {
      testEpic({
        epic: loadTasksEpic,
        inputted: "-r-----",
        expected: "-s----f",
        valueMap: {
          ...valueMap,
          f: tasksLoadingFailed("Couldn't authenticate.")
        },
        getState: () => ({
          tasks: {},
          auth: {
            token: "abc",
            tokenExpiration: new Date(Date.now() + 100000).toISOString()
          }
        }),
        getDependencies: scheduler => ({
          fetch: () =>
            createDelayedObservable(
              observableOf({
                ok: false,
                status: 401,
                statusText: "Unauthorized"
              }),
              scheduler
            )
        })
      })
    })

    it("loads tasks and next page token", () => {
      testEpic({
        epic: loadTasksEpic,
        inputted: "-r-----",
        expected: "-s----x",
        valueMap: {
          ...valueMap,
          x: tasksReceived(
            [
              { _id: "a", isComplete: false, text: "foo" },
              { _id: "b", isComplete: true, text: "bar" }
            ],
            "/api/tasks?pageToken=abc"
          )
        },
        getState: () => ({ tasks: {}, auth: {} }),
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

    it("handles empty tasks and null next page token", () => {
      testEpic({
        epic: loadTasksEpic,
        inputted: "-r-----",
        expected: "-s----x",
        valueMap,
        getState: () => ({ tasks: {}, auth: {} }),
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

    it("recovers if there is a 401 and a saved token and all else goes well", () => {
      let fetch

      testEpic({
        epic: loadTasksEpic,
        inputted: "-r---------------",
        expected: "-s---------k----x",
        valueMap: {
          ...valueMap,
          x: tasksReceived(
            [
              { _id: "a", isComplete: false, text: "foo" },
              { _id: "b", isComplete: true, text: "bar" }
            ],
            null
          ),
          k: receiveAuthToken("def", "123")
        },
        getState: () => ({
          tasks: {},
          auth: { token: "abc", tokenExpiration: new Date(0).toISOString() }
        }),
        getDependencies: scheduler => {
          fetch = jest
            .fn()
            .mockImplementationOnce(() =>
              observableOf({
                ok: false,
                status: 401,
                statusText: "Unauthorized"
              }).pipe(delay(50, scheduler))
            )
            .mockImplementationOnce(() =>
              observableOf({
                ok: true,
                json: () =>
                  observableOf({
                    token: "def",
                    tokenExpiration: "123"
                  })
              }).pipe(delay(50, scheduler))
            )
            .mockImplementationOnce(() =>
              observableOf({
                ok: true,
                json: () =>
                  observableOf([
                    { _id: "a", isComplete: false, text: "foo" },
                    { _id: "b", isComplete: true, text: "bar" }
                  ]),
                headers: { get: () => null }
              }).pipe(delay(50, scheduler))
            )

          return { fetch }
        }
      })

      expect(fetch.mock.calls[1]).toEqual([
        "/api/auth/token",
        {
          headers: {
            Authorization: "Bearer abc"
          }
        }
      ])
      expect(fetch.mock.calls[2][1].headers.Authorization).toEqual("Bearer def")
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

    it("calls fetch when it gets a create action", () => {
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

    it("does nothing when it gets a create action without text", () => {
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

    it("handles fetch errors gracefully", () => {
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

    it("handles http errors gracefully", () => {
      testEpic({
        epic: newTaskEpic,
        inputted: "-n--------",
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

    it("toasts when it gets a 401 and there is no token", () => {
      testEpic({
        epic: newTaskEpic,
        inputted: "-n--------",
        expected: "-l----(ft)",
        valueMap: {
          ...valueMap,
          f: taskCreateFailed("abc", "Not signed in"),
          t: sendToast(
            "SIGN_IN",
            "You must sign in to create a task",
            "Sign In"
          )
        },
        getState: () => ({
          newTask: { text: "foo" },
          auth: { token: null }
        }),
        getDependencies: scheduler => ({
          fetch: () =>
            createDelayedObservable(
              observableOf({
                ok: false,
                status: 401,
                statusText: "Unauthorized"
              }),
              scheduler
            )
        })
      })
    })

    it("indicates success with a new id", () => {
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
      t: sendToast("EDIT_TASK_FAILED", "Couldn't modify task"),
      s: taskEditSucceeded("a")
    }

    it("calls fetch when it gets an edit action", () => {
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

    it("handles fetch errors gracefully", () => {
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

    it("handles http errors gracefully", () => {
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

    it("indicates success when the request goes through", () => {
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

    it("calls fetch when it gets a delete action", () => {
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

    it("does nothing when it gets a delete action with a temp id", () => {
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

    it("does nothing if the toast isn't closed", () => {
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

    it("can send multiple toasts", () => {
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

    it("can delete multiple tasks with one toast", () => {
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

    it("handles undo and doesn't fetch", () => {
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

    it("handles fetch errors gracefully", () => {
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

    it("handles http errors gracefully", () => {
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

    it("indicates success when the request goes through", () => {
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

    it("ignores multiple close actions", () => {
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
})
