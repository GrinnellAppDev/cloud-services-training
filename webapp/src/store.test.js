import { ActionsObservable } from "redux-observable"
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
  actOnTopToast
} from "./store"
import { empty as emptyObservable } from "rxjs/observable/empty"
import { interval as intervalObservable } from "rxjs/observable/interval"
import { of as observableOf } from "rxjs/observable/of"
import { _throw as observableThrow } from "rxjs/observable/throw"
import { toArray } from "rxjs/operators/toArray"
import { map } from "rxjs/operators/map"
import { take } from "rxjs/operators/take"
import { delay as delayOperator } from "rxjs/operators/delay"
import { getTempTaskId } from "./util"
import { TestScheduler } from "rxjs"
import { debounceTime as debounceTimeOperator } from "rxjs/operators/debounceTime"
import { mergeMap } from "rxjs/operators/mergeMap"
import { tap } from "rxjs/operators/tap"

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

describe("reducer", () => {
  const initialState = {
    newTask: { text: "" },
    tasks: { status: "UNLOADED", items: {} },
    toasts: {
      queue: []
    }
  }

  const stateWithTaskA = {
    ...initialState,
    tasks: {
      ...initialState.tasks,
      status: "LOADED",
      items: {
        a: { _id: "a", isComplete: false, text: "foo" }
      },
      nextPageToken: "abc"
    }
  }

  it("ignores unknown actions", () => {
    expect(reducer(initialState, { type: "UNKNOWN" })).toEqual(initialState)
  })

  it("has a complete default initial state", () => {
    expect(reducer(undefined, { type: "UNKNOWN" })).toEqual(initialState)
  })

  it("adds items on load", () => {
    const itemA = { _id: "a", isComplete: false, text: "foo" }
    const itemB = { _id: "b", isComplete: true, text: "bar" }
    const pageToken1 = "abc"
    const pageToken2 = null
    const stateAfterPage1 = {
      ...initialState,
      tasks: {
        ...initialState.tasks,
        status: "LOADED",
        items: {
          a: itemA
        },
        nextPageToken: pageToken1
      }
    }
    const stateAfterPage2 = {
      ...stateAfterPage1,
      tasks: {
        ...stateAfterPage1.tasks,
        status: "LOADED",
        items: {
          a: itemA,
          b: itemB
        },
        nextPageToken: pageToken2
      }
    }

    expect(reducer(initialState, tasksReceived([itemA], pageToken1))).toEqual(
      stateAfterPage1
    )
    expect(
      reducer(stateAfterPage1, tasksReceived([itemB], pageToken2))
    ).toEqual(stateAfterPage2)
    expect(reducer(stateAfterPage2, tasksReceived([], pageToken2))).toEqual(
      stateAfterPage2
    )
  })

  it("removes all items on refresh", () => {
    expect(reducer(stateWithTaskA, reloadTasks())).toEqual({
      ...stateWithTaskA,
      tasks: {
        ...stateWithTaskA.tasks,
        items: {},
        nextPageToken: null
      }
    })
  })

  it("sets the status to loading once loading starts", () => {
    expect(reducer(stateWithTaskA, tasksLoadingStarted())).toEqual({
      ...stateWithTaskA,
      tasks: {
        ...stateWithTaskA.tasks,
        status: "LOADING"
      }
    })
  })

  it("indicates errors when loading tasks fails", () => {
    expect(reducer(stateWithTaskA, tasksLoadingFailed("foo error"))).toEqual({
      ...stateWithTaskA,
      tasks: {
        ...stateWithTaskA.tasks,
        status: "ERROR",
        lastErrorMessage: "foo error"
      }
    })
  })

  it("can edit the new task", () => {
    expect(
      reducer(
        {
          ...initialState,
          newTask: {
            ...initialState.newTask,
            text: "foo"
          }
        },
        editNewTaskText("bar")
      )
    ).toEqual({
      ...initialState,
      newTask: {
        ...initialState.newTask,
        text: "bar"
      }
    })
  })

  it("can edit tasks", () => {
    expect(
      reducer(stateWithTaskA, editTask("a", { isComplete: true }))
    ).toEqual({
      ...stateWithTaskA,
      tasks: {
        ...stateWithTaskA.tasks,
        items: {
          ...stateWithTaskA.tasks.items,
          a: { ...stateWithTaskA.tasks.items.a, isComplete: true }
        }
      }
    })
  })

  it("reverts back to the original when edit fails", () => {
    expect(
      reducer(stateWithTaskA, taskEditFailed("a", { isComplete: true }))
    ).toEqual({
      ...stateWithTaskA,
      tasks: {
        ...stateWithTaskA.tasks,
        items: {
          ...stateWithTaskA.tasks.items,
          a: { ...stateWithTaskA.tasks.items.a, isComplete: true }
        }
      }
    })
  })

  it("can delete tasks", () => {
    expect(reducer(stateWithTaskA, deleteTask("a"))).toEqual({
      ...stateWithTaskA,
      tasks: {
        ...stateWithTaskA.tasks,
        items: {}
      }
    })
  })

  it("puts a task back if it failed to delete", () => {
    expect(
      reducer(
        stateWithTaskA,
        taskDeleteFailed("b", { isComplete: true, text: "bar" })
      )
    ).toEqual({
      ...stateWithTaskA,
      tasks: {
        ...stateWithTaskA.tasks,
        items: {
          ...stateWithTaskA.tasks.items,
          b: { _id: "b", isComplete: true, text: "bar" }
        }
      }
    })
  })

  it("deletes a task if it failed to create on the server", () => {
    expect(reducer(stateWithTaskA, taskCreateFailed("a"))).toEqual({
      ...stateWithTaskA,
      tasks: {
        ...stateWithTaskA.tasks,
        items: {}
      }
    })
  })

  it("creates a dummy task with a temporary id while the server loads the real one", () => {
    expect(
      reducer(
        {
          ...initialState,
          newTask: { ...initialState.newTask, text: "foo" }
        },
        createNewTask("fooTempId")
      )
    ).toEqual({
      ...initialState,
      newTask: { ...initialState.newTask, text: "foo" },
      tasks: {
        ...initialState.tasks,
        items: {
          fooTempId: {
            _id: "fooTempId",
            tempId: "fooTempId",
            isComplete: false,
            text: "foo"
          }
        }
      }
    })
  })

  it("does not create a dummy task when there is no new task text entered", () => {
    expect(
      reducer(
        {
          ...initialState,
          newTask: { ...initialState.newTask, text: "" }
        },
        createNewTask("fooTempId")
      )
    ).toEqual({
      ...initialState,
      newTask: { ...initialState.newTask, text: "" }
    })
  })

  it("creation replaces the temporary ID with the one from the server", () => {
    expect(
      reducer(
        {
          ...initialState,
          tasks: {
            ...initialState.tasks,
            status: "LOADED",
            items: {
              "~123": {
                _id: "~123",
                tempId: "~123",
                isComplete: false,
                text: "foo"
              }
            }
          }
        },
        taskCreated("~123", "abc")
      )
    ).toEqual({
      ...initialState,
      tasks: {
        ...initialState.tasks,
        status: "LOADED",
        items: {
          abc: { _id: "abc", tempId: "~123", isComplete: false, text: "foo" }
        }
      }
    })
  })

  it("can clear out the newTask text", () => {
    expect(
      reducer(
        {
          ...initialState,
          newTask: {
            ...initialState.newTask,
            text: "foo"
          }
        },
        clearNewTask()
      )
    ).toEqual({
      ...initialState,
      newTask: {
        ...initialState.newTask,
        text: ""
      }
    })
  })

  it("can add a toast", () => {
    expect(
      reducer(initialState, sendToast("a", "foo", "bar", { useSpinner: true }))
    ).toEqual({
      ...initialState,
      toasts: {
        ...initialState.toasts,
        queue: [
          { id: "a", message: "foo", buttonText: "bar", useSpinner: true }
        ]
      }
    })
  })

  it("can modify a toast", () => {
    expect(
      reducer(
        {
          ...initialState,
          toasts: {
            ...initialState.toasts,
            queue: [
              {
                id: "b",
                message: "message b",
                buttonText: "",
                useSpinner: false
              },
              { id: "a", message: "foo", buttonText: "bar", useSpinner: false },
              {
                id: "c",
                message: "message c",
                buttonText: "",
                useSpinner: false
              }
            ]
          }
        },
        sendToast("a", "foo2", "bar2", { useSpinner: true })
      )
    ).toEqual({
      ...initialState,
      toasts: {
        ...initialState.toasts,
        queue: [
          { id: "b", message: "message b", buttonText: "", useSpinner: false },
          { id: "a", message: "foo2", buttonText: "bar2", useSpinner: true },
          { id: "c", message: "message c", buttonText: "", useSpinner: false }
        ]
      }
    })
  })

  it("can add a toast with defaults", () => {
    expect(reducer(initialState, sendToast("a", "foo"))).toEqual({
      ...initialState,
      toasts: {
        ...initialState.toasts,
        queue: [{ id: "a", message: "foo", buttonText: "", useSpinner: false }]
      }
    })
  })

  it("can close the top toast", () => {
    expect(
      reducer(
        {
          ...initialState,
          toasts: {
            ...initialState.toasts,
            queue: [
              { id: "a", message: "foo", buttonText: "bar", useSpinner: true },
              {
                id: "c",
                message: "message c",
                buttonText: "",
                useSpinner: false
              }
            ]
          }
        },
        closeTopToast()
      )
    ).toEqual({
      ...initialState,
      toasts: {
        ...initialState.toasts,
        queue: [
          { id: "a", message: "", buttonText: "", useSpinner: false },
          { id: "c", message: "message c", buttonText: "", useSpinner: false }
        ]
      }
    })
  })

  it("closing top toast does nothing when the queue is empty", () => {
    expect(
      reducer(
        {
          ...initialState,
          toasts: {
            ...initialState.toasts,
            queue: []
          }
        },
        closeTopToast()
      )
    ).toEqual({
      ...initialState,
      toasts: {
        ...initialState.toasts,
        queue: []
      }
    })
  })

  it("can shift out the top toast", () => {
    expect(
      reducer(
        {
          ...initialState,
          toasts: {
            ...initialState.toasts,
            queue: [
              { id: "a", message: "foo", buttonText: "bar" },
              { id: "c", message: "message c", buttonText: "" }
            ]
          }
        },
        shiftToasts()
      )
    ).toEqual({
      ...initialState,
      toasts: {
        ...initialState.toasts,
        queue: [{ id: "c", message: "message c", buttonText: "" }]
      }
    })
  })
})

describe("epics", () => {
  const testEpic = ({
    epic,
    inputted,
    expected = null,
    valueMap,
    getState,
    getDependencies = scheduler => ({})
  }) => {
    const scheduler = new TestScheduler((actualVal, expectedVal) => {
      if (expected !== null)
        expect(actualVal.filter(x => x.notification.kind !== "C")).toEqual(
          expectedVal
        )
    })

    const outputObservable = epic(
      ActionsObservable.from(scheduler.createHotObservable(inputted, valueMap)),
      { getState },
      {
        delay: () => delayOperator(50, scheduler),
        debounceTime: () => debounceTimeOperator(50, scheduler),
        ...getDependencies(scheduler)
      }
    )

    scheduler
      .expectObservable(outputObservable)
      .toBe(expected !== null ? expected : "", valueMap)
    scheduler.flush()
  }

  const createDelayedObservable = (observable, scheduler, delayTime = 50) =>
    observableOf(null).pipe(
      delayOperator(50, scheduler),
      mergeMap(() => observable)
    )

  describe("rootEpic", () => {
    it("ignores unknown actions", async () => {
      await expect(
        rootEpic(ActionsObservable.of({ type: "UNKNOWN" }), {}, {})
          .pipe(toArray())
          .toPromise()
      ).resolves.toEqual([])
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
      const fetchFromAPI = jest.fn().mockReturnValue(observableOf())

      testEpic({
        epic: loadTasksEpic,
        inputted: "-r-----",
        valueMap,
        getState: () => ({ tasks: {} }),
        getDependencies: () => ({ fetchFromAPI })
      })

      expect(fetchFromAPI).toBeCalledWith("/tasks?pageToken=")
    })

    it("doesn't call fetch and sends nothing when already loading", async () => {
      const fetchFromAPI = jest.fn().mockReturnValue(observableOf())

      testEpic({
        epic: loadTasksEpic,
        inputted: "-r-----",
        expected: "-------",
        valueMap,
        getState: () => ({ tasks: { status: "LOADING" } }),
        getDependencies: () => ({ fetchFromAPI })
      })

      expect(fetchFromAPI).not.toBeCalled()
    })

    it("calls fetch when asked to load next with an error", async () => {
      const fetchFromAPI = jest.fn().mockReturnValue(observableOf())

      testEpic({
        epic: loadTasksEpic,
        inputted: "-n-----",
        valueMap,
        getState: () => ({ tasks: { status: "ERROR", nextPageToken: null } }),
        getDependencies: () => ({ fetchFromAPI })
      })

      expect(fetchFromAPI).toBeCalled()
    })

    it("calls fetch when given a reload action with an error", async () => {
      const fetchFromAPI = jest.fn().mockReturnValue(observableOf())

      testEpic({
        epic: loadTasksEpic,
        inputted: "-r-----",
        valueMap,
        getState: () => ({ tasks: { status: "ERROR", nextPageToken: "abc" } }),
        getDependencies: () => ({ fetchFromAPI })
      })

      expect(fetchFromAPI).toBeCalled()
    })

    it("calls fetch when given a load page action if tasks are unloaded", async () => {
      const fetchFromAPI = jest.fn().mockReturnValue(observableOf())

      testEpic({
        epic: loadTasksEpic,
        inputted: "-n-----",
        valueMap,
        getState: () => ({
          tasks: { status: "UNLOADED", nextPageToken: null }
        }),
        getDependencies: () => ({ fetchFromAPI })
      })

      expect(fetchFromAPI).toBeCalledWith("/tasks?pageToken=")
    })

    it("does not call fetch when given a load page action if tasks are loaded and there is no next page token", async () => {
      const fetchFromAPI = jest.fn().mockReturnValue(observableOf())

      testEpic({
        epic: loadTasksEpic,
        inputted: "-n-----",
        valueMap,
        getState: () => ({
          tasks: { nextPageToken: null }
        }),
        getDependencies: () => ({ fetchFromAPI })
      })

      expect(fetchFromAPI).not.toBeCalled()
    })

    it("calls fetch when given a load page action with the next page token", async () => {
      const fetchFromAPI = jest.fn().mockReturnValue(observableOf())

      testEpic({
        epic: loadTasksEpic,
        inputted: "-n-----",
        valueMap,
        getState: () => ({
          tasks: { nextPageToken: "abc" }
        }),
        getDependencies: () => ({ fetchFromAPI })
      })

      expect(fetchFromAPI).toBeCalledWith("/tasks?pageToken=abc")
    })

    it("handles fetch errors gracefully", async () => {
      testEpic({
        epic: loadTasksEpic,
        inputted: "-r-----",
        expected: "-s----f",
        valueMap,
        getState: () => ({ tasks: {} }),
        getDependencies: scheduler => ({
          fetchFromAPI: () =>
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
          fetchFromAPI: () =>
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
            "abc"
          )
        },
        getState: () => ({ tasks: {} }),
        getDependencies: scheduler => ({
          fetchFromAPI: () =>
            createDelayedObservable(
              observableOf({
                ok: true,
                json: () =>
                  observableOf({
                    items: [
                      { _id: "a", isComplete: false, text: "foo" },
                      { _id: "b", isComplete: true, text: "bar" }
                    ],
                    nextPageToken: "abc"
                  })
              }),
              scheduler
            )
        })
      })
    })

    it("handles empty tasks and null next page token", async () => {
      const consoleError = console.error
      console.error = jest.fn()

      testEpic({
        epic: loadTasksEpic,
        inputted: "-r-----",
        expected: "-s----x",
        valueMap,
        getState: () => ({ tasks: {} }),
        getDependencies: scheduler => ({
          fetchFromAPI: () =>
            createDelayedObservable(
              observableOf({
                ok: true,
                json: () =>
                  observableOf({
                    items: [],
                    nextPageToken: null
                  })
              }),
              scheduler
            )
        })
      })

      expect(console.error).not.toBeCalled()
      console.error = consoleError
    })

    it("complains when items is missing in the response", async () => {
      const consoleError = console.error
      console.error = jest.fn()

      testEpic({
        epic: loadTasksEpic,
        inputted: "-r-----",
        expected: "-s----x",
        valueMap,
        getState: () => ({ tasks: {} }),
        getDependencies: scheduler => ({
          fetchFromAPI: () =>
            createDelayedObservable(
              observableOf({
                ok: true,
                json: () =>
                  observableOf({
                    nextPageToken: null
                  })
              }),
              scheduler
            )
        })
      })

      expect(console.error).toBeCalledWith(
        "Missing or invalid 'items' field in the API response"
      )
      console.error = consoleError
    })

    it("complains when items is not an array in the response", async () => {
      const consoleError = console.error
      console.error = jest.fn()

      testEpic({
        epic: loadTasksEpic,
        inputted: "-r-----",
        expected: "-s----x",
        valueMap,
        getState: () => ({ tasks: {} }),
        getDependencies: scheduler => ({
          fetchFromAPI: () =>
            createDelayedObservable(
              observableOf({
                ok: true,
                json: () =>
                  observableOf({
                    items: "foo",
                    nextPageToken: null
                  })
              }),
              scheduler
            )
        })
      })

      expect(console.error).toBeCalledWith(
        "Missing or invalid 'items' field in the API response"
      )
      console.error = consoleError
    })

    it("complains when nextPageToken is missing, but still shows items", async () => {
      const consoleError = console.error
      console.error = jest.fn()

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
            null
          )
        },
        getState: () => ({ tasks: {} }),
        getDependencies: scheduler => ({
          fetchFromAPI: () =>
            createDelayedObservable(
              observableOf({
                ok: true,
                json: () =>
                  observableOf({
                    items: [
                      { _id: "a", isComplete: false, text: "foo" },
                      { _id: "b", isComplete: true, text: "bar" }
                    ]
                  })
              }),
              scheduler
            )
        })
      })

      expect(console.error).toBeCalledWith(
        "Missing 'nextPageToken' field in the API response"
      )
      console.error = consoleError
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
      const fetchFromAPI = jest.fn().mockReturnValue(observableOf())

      testEpic({
        epic: newTaskEpic,
        inputted: "-n-----",
        valueMap,
        getState: () => ({ newTask: { text: "foo" } }),
        getDependencies: () => ({ fetchFromAPI })
      })

      expect(fetchFromAPI).toBeCalledWith("/tasks", {
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
      const fetchFromAPI = jest.fn().mockReturnValue(observableOf())

      testEpic({
        epic: newTaskEpic,
        inputted: "-n-----",
        expected: "-------",
        valueMap,
        getState: () => ({ newTask: { text: "" } }),
        getDependencies: () => ({ fetchFromAPI })
      })

      expect(fetchFromAPI).not.toBeCalled()
    })

    it("handles fetch errors gracefully", async () => {
      testEpic({
        epic: newTaskEpic,
        inputted: "-n--------",
        expected: "-l----(ft)",
        valueMap,
        getState: () => ({ newTask: { text: "foo" } }),
        getDependencies: scheduler => ({
          fetchFromAPI: () =>
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
          fetchFromAPI: () =>
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
          fetchFromAPI: () =>
            createDelayedObservable(
              observableOf({
                ok: true,
                json: () => observableOf({ item: { _id: "def" } })
              }),
              scheduler
            )
        })
      })
    })

    it("handles missing id in the response", async () => {
      const consoleError = console.error
      console.error = jest.fn()

      testEpic({
        epic: newTaskEpic,
        inputted: "-n-----",
        expected: "-l----r",
        valueMap,
        getState: () => ({ newTask: { text: "foo" } }),
        getDependencies: scheduler => ({
          fetchFromAPI: () =>
            createDelayedObservable(
              observableOf({
                ok: true,
                json: () => observableOf({ item: {} })
              }),
              scheduler
            )
        })
      })

      expect(console.error).toBeCalledWith(
        "Missing '_id' field in the API response"
      )
      expect(console.error).toBeCalledWith(
        "Reloading to get correct task id..."
      )
      console.error = consoleError
    })

    it("handles missing item field in the response", async () => {
      const consoleError = console.error
      console.error = jest.fn()

      testEpic({
        epic: newTaskEpic,
        inputted: "-n-----",
        expected: "-l----r",
        valueMap,
        getState: () => ({ newTask: { text: "foo" } }),
        getDependencies: scheduler => ({
          fetchFromAPI: () =>
            createDelayedObservable(
              observableOf({
                ok: true,
                json: () => observableOf({})
              }),
              scheduler
            )
        })
      })

      expect(console.error).toBeCalledWith(
        "Missing 'item' field in the API response"
      )
      expect(console.error).toBeCalledWith(
        "Reloading to get correct task id..."
      )
      console.error = consoleError
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
      const fetchFromAPI = jest.fn().mockReturnValue(observableOf())

      testEpic({
        epic: editTaskEpic,
        inputted: "-e-----",
        valueMap,
        getDependencies: () => ({ fetchFromAPI })
      })

      expect(fetchFromAPI).toBeCalledWith("/tasks/a", {
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
          fetchFromAPI: () =>
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
          fetchFromAPI: () =>
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
          fetchFromAPI: () =>
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
      const fetchFromAPI = jest.fn().mockReturnValue(observableOf())

      testEpic({
        epic: deleteTaskEpic,
        inputted: "-d-x-",
        valueMap,
        getDependencies: () => ({ fetchFromAPI })
      })

      expect(fetchFromAPI).toBeCalledWith("/tasks/a", {
        method: "DELETE"
      })
    })

    it("does nothing when it gets a delete action with a temp id", async () => {
      const fetchFromAPI = jest
        .fn()
        .mockReturnValue(observableThrow(TypeError("Failed to fetch")))

      testEpic({
        epic: deleteTaskEpic,
        inputted: "-e-x-",
        expected: "-----",
        valueMap,
        getDependencies: () => ({ fetchFromAPI })
      })

      expect(fetchFromAPI).not.toBeCalled()
    })

    it("does nothing if the toast isn't closed", async () => {
      const fetchFromAPI = jest
        .fn()
        .mockReturnValue(observableThrow(TypeError("Failed to fetch")))

      testEpic({
        epic: deleteTaskEpic,
        inputted: "-d-",
        expected: "-t-",
        valueMap,
        getDependencies: () => ({ fetchFromAPI })
      })

      expect(fetchFromAPI).not.toBeCalled()
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
          fetchFromAPI: () =>
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
          fetchFromAPI: () =>
            createDelayedObservable(observableOf({ ok: true }), scheduler)
        })
      })
    })

    it("handles undo and doesn't fetch", async () => {
      const fetchFromAPI = jest.fn().mockReturnValue(observableOf({ ok: true }))

      testEpic({
        epic: deleteTaskEpic,
        inputted: "-d--u-",
        expected: "-t--j-",
        valueMap,
        getDependencies: () => ({ fetchFromAPI })
      })

      expect(fetchFromAPI).not.toBeCalled()
    })

    it("handles fetch errors gracefully", async () => {
      testEpic({
        epic: deleteTaskEpic,
        inputted: "-d--x--------",
        expected: "-t-------(fg)",
        valueMap,
        getDependencies: scheduler => ({
          fetchFromAPI: () =>
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
          fetchFromAPI: () =>
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
          fetchFromAPI: () =>
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
          fetchFromAPI: () =>
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
