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
  clearNewTask
} from "./store"
import { empty as emptyObservable } from "rxjs/observable/empty"
import { toArray } from "rxjs/operators"

describe("configureStore", () => {
  it("makes a store without a default state", () => {
    expect(configureStore().getState()).toBeTruthy()
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
        { _id: "a", isComplete: false, text: "foo" },
        { _id: "b", isComplete: true, text: "bar" }
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
    tasks: { status: "UNLOADED", items: {} }
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
      ...initialState,
      tasks: {
        ...initialState.tasks,
        status: "LOADING",
        items: {},
        nextPageToken: null
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
          a: { _id: "a", isComplete: true, text: "foo" }
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
            isComplete: false,
            text: "foo",
            isCreating: true
          }
        }
      }
    })
  })

  it("creation replaces the temporary ID with the one from the server", () => {
    expect(reducer(stateWithTaskA, taskCreated("a", "abc"))).toEqual({
      ...stateWithTaskA,
      tasks: {
        ...stateWithTaskA.tasks,
        items: {
          abc: {
            ...stateWithTaskA.tasks.items.a,
            _id: "abc"
          }
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
})

describe("epics", () => {
  describe("rootEpic", () => {
    it("ignores unknown actions", async () => {
      expect(
        await rootEpic(ActionsObservable.of({ type: "UNKNOWN" })).toPromise()
      ).toBe(undefined)
    })
  })

  describe("newTaskEpic", () => {
    it("calls fetch when it gets a create action", async () => {
      const fetchFromAPI = jest.fn().mockReturnValue(Promise.resolve())

      await newTaskEpic(
        ActionsObservable.of(createNewTask()),
        { getState: () => ({ newTask: { text: "foo" } }) },
        { fetchFromAPI }
      ).toPromise()

      expect(fetchFromAPI).toBeCalledWith("/tasks", {
        method: "POST",
        body: JSON.stringify({
          text: "foo"
        })
      })
    })

    it("handles fetch errors gracefully", async () => {
      expect(
        await newTaskEpic(
          ActionsObservable.of(createNewTask("abc")),
          { getState: () => ({ newTask: { text: "foo" } }) },
          { fetchFromAPI: () => Promise.reject(TypeError("Failed to fetch")) }
        )
          .pipe(toArray())
          .toPromise()
      ).toEqual([clearNewTask(), taskCreateFailed("abc", "Failed to fetch")])
    })

    it("handles http errors gracefully", async () => {
      expect(
        await newTaskEpic(
          ActionsObservable.of(createNewTask("abc")),
          { getState: () => ({ newTask: { text: "foo" } }) },
          { fetchFromAPI: () => Promise.resolve({ ok: false }) }
        )
          .pipe(toArray())
          .toPromise()
      ).toEqual([clearNewTask(), taskCreateFailed("abc", "HTTP Error")])
    })

    it("indicates success with a new id", async () => {
      expect(
        await newTaskEpic(
          ActionsObservable.of(createNewTask("abc")),
          { getState: () => ({ newTask: { text: "foo" } }) },
          {
            fetchFromAPI: () =>
              Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ _id: "def" })
              })
          }
        )
          .pipe(toArray())
          .toPromise()
      ).toEqual([clearNewTask(), taskCreated("abc", "def")])
    })
  })
})
