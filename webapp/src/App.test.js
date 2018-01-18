import React from "react"
import { render } from "react-dom"
import { shallow } from "enzyme"
import { App, withEnhancers } from "./App"
import Task from "./Task"
import configureMockStore from "redux-mock-store"
import { Provider } from "react-redux"
import {
  editNewTaskText,
  createNewTask,
  reloadTasks,
  loadNextTasks
} from "./store/tasks"
import { closeTopToast } from "./store/toasts"
import { isTempTaskId } from "./util"
import LoadingSpinner from "./LoadingSpinner"

describe("withEnhancers", () => {
  const createMockStore = configureMockStore()

  it("loads an empty task list from the store", () => {
    const store = createMockStore({
      newTask: {
        text: ""
      },
      tasks: {
        items: {}
      },
      toasts: {
        queue: []
      }
    })

    const Component = jest.fn().mockReturnValue(<div />)
    const Wrapped = withEnhancers(Component)

    render(
      <Provider store={store}>
        <Wrapped />
      </Provider>,
      document.createElement("div")
    )

    expect(Component.mock.calls).toHaveLength(1)
    expect(Component.mock.calls[0][0].tasks).toEqual([])
  })

  it("loads a task list from the store", () => {
    const store = createMockStore({
      newTask: {
        text: ""
      },
      tasks: {
        items: {
          a: { _id: "a", isComplete: false, text: "foo" }
        }
      },
      toasts: {
        queue: []
      }
    })

    const Component = jest.fn().mockReturnValue(<div />)
    const Wrapped = withEnhancers(Component)

    render(
      <Provider store={store}>
        <Wrapped />
      </Provider>,
      document.createElement("div")
    )

    expect(Component.mock.calls).toHaveLength(1)
    expect(Component.mock.calls[0][0].tasks).toEqual([
      { _id: "a", isComplete: false, text: "foo" }
    ])
  })

  it("loads empty new task text", () => {
    const store = createMockStore({
      newTask: {
        text: ""
      },
      tasks: {
        items: {}
      },
      toasts: {
        queue: []
      }
    })

    const Component = jest.fn().mockReturnValue(<div />)
    const Wrapped = withEnhancers(Component)

    render(
      <Provider store={store}>
        <Wrapped />
      </Provider>,
      document.createElement("div")
    )

    expect(Component.mock.calls).toHaveLength(1)
    expect(Component.mock.calls[0][0].newTaskText).toBe("")
  })

  it("loads new task text", () => {
    const store = createMockStore({
      newTask: {
        text: "foo"
      },
      tasks: {
        items: {}
      },
      toasts: {
        queue: []
      }
    })

    const Component = jest.fn().mockReturnValue(<div />)
    const Wrapped = withEnhancers(Component)

    render(
      <Provider store={store}>
        <Wrapped />
      </Provider>,
      document.createElement("div")
    )

    expect(Component.mock.calls).toHaveLength(1)
    expect(Component.mock.calls[0][0].newTaskText).toBe("foo")
  })

  it("signals that there are more tasks if there is a nextPageURI", () => {
    const store = createMockStore({
      newTask: {
        text: ""
      },
      tasks: {
        items: {},
        nextPageURI: "/auth/tasks?pageToken=abc"
      },
      toasts: {
        queue: []
      }
    })

    const Component = jest.fn().mockReturnValue(<div />)
    const Wrapped = withEnhancers(Component)

    render(
      <Provider store={store}>
        <Wrapped />
      </Provider>,
      document.createElement("div")
    )

    expect(Component.mock.calls).toHaveLength(1)
    expect(Component.mock.calls[0][0].tasksHaveNextPage).toBe(true)
  })

  it("signals that there are no more tasks if next page URI is null", () => {
    const store = createMockStore({
      newTask: {
        text: ""
      },
      tasks: {
        items: {},
        nextPageURI: null
      },
      toasts: {
        queue: []
      }
    })

    const Component = jest.fn().mockReturnValue(<div />)
    const Wrapped = withEnhancers(Component)

    render(
      <Provider store={store}>
        <Wrapped />
      </Provider>,
      document.createElement("div")
    )

    expect(Component.mock.calls).toHaveLength(1)
    expect(Component.mock.calls[0][0].tasksHaveNextPage).toBe(false)
  })

  it("signals that there are no more tasks if there is an error", () => {
    const store = createMockStore({
      newTask: {
        text: ""
      },
      tasks: {
        status: "ERROR",
        items: {},
        nextPageURI: "/auth/tasks?pageToken=abc"
      },
      toasts: {
        queue: []
      }
    })

    const Component = jest.fn().mockReturnValue(<div />)
    const Wrapped = withEnhancers(Component)

    render(
      <Provider store={store}>
        <Wrapped />
      </Provider>,
      document.createElement("div")
    )

    expect(Component.mock.calls).toHaveLength(1)
    expect(Component.mock.calls[0][0].tasksHaveNextPage).toBe(false)
  })

  it("signals that there are more tasks if tasks are unloaded regardless of nextPageURI", () => {
    const store = createMockStore({
      newTask: {
        text: ""
      },
      tasks: {
        status: "UNLOADED",
        items: {},
        nextPageURI: null
      },
      toasts: {
        queue: []
      }
    })

    const Component = jest.fn().mockReturnValue(<div />)
    const Wrapped = withEnhancers(Component)

    render(
      <Provider store={store}>
        <Wrapped />
      </Provider>,
      document.createElement("div")
    )

    expect(Component.mock.calls).toHaveLength(1)
    expect(Component.mock.calls[0][0].tasksHaveNextPage).toBe(true)
  })

  it("signals that there are more tasks if tasks are loading regardless of nextPageURI", () => {
    const store = createMockStore({
      newTask: {
        text: ""
      },
      tasks: {
        status: "LOADING",
        items: {},
        nextPageURI: null
      },
      toasts: {
        queue: []
      }
    })

    const Component = jest.fn().mockReturnValue(<div />)
    const Wrapped = withEnhancers(Component)

    render(
      <Provider store={store}>
        <Wrapped />
      </Provider>,
      document.createElement("div")
    )

    expect(Component.mock.calls).toHaveLength(1)
    expect(Component.mock.calls[0][0].tasksHaveNextPage).toBe(true)
  })

  it("signals if there was an error loading the tasks", () => {
    const store = createMockStore({
      newTask: {
        text: ""
      },
      tasks: {
        status: "ERROR",
        items: {}
      },
      toasts: {
        queue: []
      }
    })

    const Component = jest.fn().mockReturnValue(<div />)
    const Wrapped = withEnhancers(Component)

    render(
      <Provider store={store}>
        <Wrapped />
      </Provider>,
      document.createElement("div")
    )

    expect(Component.mock.calls).toHaveLength(1)
    expect(Component.mock.calls[0][0].tasksHaveError).toBe(true)
  })

  it("loads the last error message", () => {
    const store = createMockStore({
      newTask: {
        text: ""
      },
      tasks: {
        items: {},
        lastErrorMessage: "foo"
      },
      toasts: {
        queue: []
      }
    })

    const Component = jest.fn().mockReturnValue(<div />)
    const Wrapped = withEnhancers(Component)

    render(
      <Provider store={store}>
        <Wrapped />
      </Provider>,
      document.createElement("div")
    )

    expect(Component.mock.calls).toHaveLength(1)
    expect(Component.mock.calls[0][0].lastTasksErrorMessage).toBe("foo")
  })

  it("signals hasTasks when tasks contain any elements", () => {
    const store = createMockStore({
      newTask: {
        text: ""
      },
      tasks: {
        items: { a: "a" }
      },
      toasts: {
        queue: []
      }
    })

    const Component = jest.fn().mockReturnValue(<div />)
    const Wrapped = withEnhancers(Component)

    render(
      <Provider store={store}>
        <Wrapped />
      </Provider>,
      document.createElement("div")
    )

    expect(Component.mock.calls).toHaveLength(1)
    expect(Component.mock.calls[0][0].hasTasks).toBe(true)
  })

  it("signals hasTasks when tasks are empty but we are not loaded", () => {
    const store = status =>
      createMockStore({
        newTask: {
          text: ""
        },
        tasks: {
          status,
          items: {}
        },
        toasts: {
          queue: []
        }
      })

    const Component = jest.fn().mockReturnValue(<div />)
    const Wrapped = withEnhancers(Component)

    for (const status of ["UNLOADED", "ERROR", "LOADING"])
      render(
        <Provider store={store(status)}>
          <Wrapped />
        </Provider>,
        document.createElement("div")
      )

    expect(Component.mock.calls).toHaveLength(3)
    for (const call of [0, 1, 2])
      expect(Component.mock.calls[call][0].hasTasks).toBe(true)
  })

  it("signals not hasTasks when tasks are empty and we are loaded", () => {
    const store = createMockStore({
      newTask: {
        text: ""
      },
      tasks: {
        status: "LOADED",
        items: {}
      },
      toasts: {
        queue: []
      }
    })

    const Component = jest.fn().mockReturnValue(<div />)
    const Wrapped = withEnhancers(Component)

    render(
      <Provider store={store}>
        <Wrapped />
      </Provider>,
      document.createElement("div")
    )

    expect(Component.mock.calls).toHaveLength(1)
    expect(Component.mock.calls[0][0].hasTasks).toBe(false)
  })

  it("loads the top toast", () => {
    const store = createMockStore({
      newTask: {
        text: ""
      },
      tasks: {
        status: "LOADED",
        items: {}
      },
      toasts: {
        queue: [
          { id: "foo", message: "bar", buttonText: "baz", useSpinner: true },
          {}
        ]
      }
    })

    const Component = jest.fn().mockReturnValue(<div />)
    const Wrapped = withEnhancers(Component)

    render(
      <Provider store={store}>
        <Wrapped />
      </Provider>,
      document.createElement("div")
    )

    expect(Component.mock.calls).toHaveLength(1)
    expect(Component.mock.calls[0][0].topToast).toEqual({
      id: "foo",
      message: "bar",
      buttonText: "baz",
      useSpinner: true
    })
  })

  it("loads blank when there is no top toast", () => {
    const store = createMockStore({
      newTask: {
        text: ""
      },
      tasks: {
        status: "LOADED",
        items: {}
      },
      toasts: {
        queue: []
      }
    })

    const Component = jest.fn().mockReturnValue(<div />)
    const Wrapped = withEnhancers(Component)

    render(
      <Provider store={store}>
        <Wrapped />
      </Provider>,
      document.createElement("div")
    )

    expect(Component.mock.calls).toHaveLength(1)
    expect(Component.mock.calls[0][0].topToast.message).toBe("")
    expect(Component.mock.calls[0][0].topToast.buttonText).toBe("")
    expect(Component.mock.calls[0][0].topToast.useSpinner).toBe(false)
  })

  it("dispatches an edit action onNewTaskTextChange", () => {
    const store = createMockStore({
      newTask: {
        text: ""
      },
      tasks: {
        items: {}
      },
      toasts: {
        queue: []
      }
    })

    const Component = jest.fn().mockImplementation(props => {
      props.onNewTaskTextChange("foo")
      return <div />
    })
    const Wrapped = withEnhancers(Component)

    render(
      <Provider store={store}>
        <Wrapped />
      </Provider>,
      document.createElement("div")
    )

    expect(store.getActions()).toEqual([editNewTaskText("foo")])
  })

  it("dispatches a create action onNewTaskSubmit", () => {
    const store = createMockStore({
      newTask: {
        text: "foo"
      },
      tasks: {
        items: {}
      },
      toasts: {
        queue: []
      }
    })

    const Component = jest.fn().mockImplementation(props => {
      props.onNewTaskSubmit()
      return <div />
    })
    const Wrapped = withEnhancers(Component)

    render(
      <Provider store={store}>
        <Wrapped />
      </Provider>,
      document.createElement("div")
    )

    expect(store.getActions()).toHaveLength(1)
    expect(store.getActions()[0].type).toBe(createNewTask("").type)
    expect(isTempTaskId(store.getActions()[0].temporaryId)).toBe(true)
  })

  it("dispatches a refresh action onRefresh", () => {
    const store = createMockStore({
      newTask: {
        text: ""
      },
      tasks: {
        items: {}
      },
      toasts: {
        queue: []
      }
    })

    const Component = jest.fn().mockImplementation(props => {
      props.onRefresh()
      return <div />
    })
    const Wrapped = withEnhancers(Component)

    render(
      <Provider store={store}>
        <Wrapped />
      </Provider>,
      document.createElement("div")
    )

    expect(store.getActions()).toEqual([reloadTasks()])
  })

  it("dispatches a load action onLoadNextPage", () => {
    const store = createMockStore({
      newTask: {
        text: ""
      },
      tasks: {
        items: {}
      },
      toasts: {
        queue: []
      }
    })

    const Component = jest.fn().mockImplementation(props => {
      props.onLoadNextPage()
      return <div />
    })
    const Wrapped = withEnhancers(Component)

    render(
      <Provider store={store}>
        <Wrapped />
      </Provider>,
      document.createElement("div")
    )

    expect(store.getActions()).toEqual([loadNextTasks()])
  })

  it("dispatches a close action onToastCancel", () => {
    const store = createMockStore({
      newTask: {
        text: ""
      },
      tasks: {
        items: {}
      },
      toasts: {
        queue: []
      }
    })

    const Component = jest.fn().mockImplementation(props => {
      props.onTopToastCancel()
      return <div />
    })
    const Wrapped = withEnhancers(Component)

    render(
      <Provider store={store}>
        <Wrapped />
      </Provider>,
      document.createElement("div")
    )

    expect(store.getActions()).toEqual([closeTopToast({ withAction: false })])
  })

  it("dispatches a close action onToastAction", () => {
    const store = createMockStore({
      newTask: {
        text: ""
      },
      tasks: {
        items: {}
      },
      toasts: {
        queue: []
      }
    })

    const Component = jest.fn().mockImplementation(props => {
      props.onTopToastAction()
      return <div />
    })
    const Wrapped = withEnhancers(Component)

    render(
      <Provider store={store}>
        <Wrapped />
      </Provider>,
      document.createElement("div")
    )

    expect(store.getActions()).toEqual([closeTopToast({ withAction: true })])
  })
})

describe("App", () => {
  it("displays a title for the refresh button", () => {
    expect(
      shallow(
        <App
          tasksHaveNextPage={false}
          onLoadNextPage={() => {}}
          tasks={[]}
          newTaskText=""
          topToast={{}}
        />
      )
        .find(".App-refresh")
        .prop("title")
    ).toBe("Refresh")
  })

  it("renders a single task", () => {
    const taskListWrapper = shallow(
      <App
        tasksHaveNextPage={false}
        onLoadNextPage={() => {}}
        tasks={[{ _id: "a", isComplete: false, text: "foo" }]}
        topToast={{}}
      />
    ).find(".App-taskList")
    const firstTask = taskListWrapper.childAt(0).find(Task)

    expect(taskListWrapper.children()).toHaveLength(1)
    expect(firstTask.prop("id")).toBe("a")
  })

  it("renders a few tasks in order", () => {
    const tasksWrapper = shallow(
      <App
        tasksHaveNextPage={false}
        onLoadNextPage={() => {}}
        tasks={[
          { _id: "a", isComplete: false, text: "foo" },
          { _id: "b", isComplete: true, text: "bar" },
          { _id: "c", isComplete: false, text: "baz" }
        ]}
        topToast={{}}
      />
    )
      .find(".App-taskList")
      .children()

    expect(tasksWrapper).toHaveLength(3)
    expect(
      tasksWrapper
        .at(0)
        .find(Task)
        .prop("id")
    ).toBe("a")
    expect(
      tasksWrapper
        .at(1)
        .find(Task)
        .prop("id")
    ).toBe("b")
    expect(
      tasksWrapper
        .at(2)
        .find(Task)
        .prop("id")
    ).toBe("c")
  })

  it("displays changes to the new task", () => {
    expect(
      shallow(
        <App
          tasksHaveNextPage={false}
          onLoadNextPage={() => {}}
          tasks={[]}
          newTaskText="foo"
          topToast={{}}
        />
      )
        .find(".App-addTask")
        .prop("value")
    ).toBe("foo")
  })

  it("displays the last error message when there is an error", () => {
    expect(
      shallow(
        <App
          tasksHaveNextPage={false}
          onLoadNextPage={() => {}}
          tasks={[]}
          newTaskText=""
          tasksHaveError={true}
          lastTasksErrorMessage="foo"
          topToast={{}}
        />
      )
        .find(".App-tasksError")
        .contains("foo")
    ).toBe(true)
  })

  it("doesn't display the last error message when there isn't currently an error", () => {
    expect(
      shallow(
        <App
          tasksHaveNextPage={false}
          onLoadNextPage={() => {}}
          tasks={[]}
          newTaskText=""
          tasksHaveError={false}
          lastTasksErrorMessage="foo"
          topToast={{}}
        />
      )
        .find(".App-tasksError")
        .exists()
    ).toBe(false)
  })

  it("shows a message when there are no tasks", () => {
    expect(
      shallow(
        <App
          tasksHaveNextPage={false}
          onLoadNextPage={() => {}}
          tasks={[]}
          newTaskText=""
          hasTasks={false}
          topToast={{}}
        />
      )
        .find(".App-noTasks")
        .contains("You have no tasks!")
    ).toBe(true)
  })

  it("doesn't show the no tasks message when there are tasks", () => {
    expect(
      shallow(
        <App
          tasksHaveNextPage={false}
          onLoadNextPage={() => {}}
          tasks={[]}
          newTaskText=""
          hasTasks={true}
          topToast={{}}
        />
      )
        .find(".App-noTask")
        .exists()
    ).toBe(false)
  })

  it("shows the top toast", () => {
    const toastWrapper = shallow(
      <App
        tasksHaveNextPage={false}
        onLoadNextPage={() => {}}
        tasks={[]}
        newTaskText=""
        topToast={{ message: "foo", buttonText: "bar", useSpinner: true }}
      />
    ).find(".App-topToast")

    expect(
      toastWrapper.containsAllMatchingElements(["foo", "bar", LoadingSpinner])
    ).toBe(true)

    expect(toastWrapper.prop("aria-hidden")).toBe(false)
  })

  it("hides the top toast", () => {
    expect(
      shallow(
        <App
          tasksHaveNextPage={false}
          onLoadNextPage={() => {}}
          tasks={[]}
          newTaskText=""
          topToast={{ message: "", buttonText: "", useSpinner: false }}
        />
      )
        .find(".App-topToast")
        .prop("aria-hidden")
    ).toBe(true)
  })

  it("hides the toast button when there is no text", () => {
    expect(
      shallow(
        <App
          tasksHaveNextPage={false}
          onLoadNextPage={() => {}}
          tasks={[]}
          newTaskText=""
          topToast={{ message: "foo", buttonText: "", useSpinner: false }}
        />
      )
        .find(".App-topToastAction")
        .exists()
    ).toBe(false)
  })

  it("hides the spinner when disabled", () => {
    expect(
      shallow(
        <App
          tasksHaveNextPage={false}
          onLoadNextPage={() => {}}
          tasks={[]}
          newTaskText=""
          topToast={{ message: "foo", buttonText: "", useSpinner: false }}
        />
      )
        .find(".App-topToastLoading")
        .exists()
    ).toBe(false)
  })

  it("signals changes to the new task", () => {
    const onNewTaskTextChange = jest.fn()

    shallow(
      <App
        tasksHaveNextPage={false}
        onLoadNextPage={() => {}}
        tasks={[]}
        newTaskText="foo"
        onNewTaskTextChange={onNewTaskTextChange}
        topToast={{}}
      />
    )
      .find(".App-addTask")
      .simulate("change", { currentTarget: { value: "foot" } })

    expect(onNewTaskTextChange).toBeCalledWith("foot")
  })

  it("signals when the new task is submitted", () => {
    const onNewTaskSubmit = jest.fn()

    shallow(
      <App
        tasksHaveNextPage={false}
        onLoadNextPage={() => {}}
        tasks={[]}
        newTaskText="foo"
        onNewTaskSubmit={onNewTaskSubmit}
        topToast={{}}
      />
    )
      .find(".App-addTask")
      .simulate("keyPress", { key: "Enter" })

    expect(onNewTaskSubmit).toBeCalledWith()
  })

  it("handles clicks on the refresh button", () => {
    const onRefresh = jest.fn()

    shallow(
      <App
        tasksHaveNextPage={false}
        onLoadNextPage={() => {}}
        tasks={[]}
        onRefresh={onRefresh}
        topToast={{}}
      />
    )
      .find(".App-refresh")
      .simulate("click")

    expect(onRefresh).toBeCalledWith()
  })

  it("handles clicks on the try again button", () => {
    const onLoadNextPage = jest.fn()

    shallow(
      <App
        tasksHaveNextPage={false}
        tasksHaveError={true}
        onLoadNextPage={onLoadNextPage}
        tasks={[]}
        topToast={{}}
      />
    )
      .find(".App-tasksErrorTryAgain")
      .simulate("click")

    expect(onLoadNextPage).toBeCalledWith()
  })

  it("handles clicks on the toast close button", () => {
    const onTopToastCancel = jest.fn()

    shallow(
      <App
        tasksHaveNextPage={false}
        tasksHaveError={true}
        onLoadNextPage={() => {}}
        onTopToastCancel={onTopToastCancel}
        tasks={[]}
        topToast={{}}
      />
    )
      .find(".App-topToastClose")
      .simulate("click")

    expect(onTopToastCancel).toBeCalledWith()
  })

  it("handles clicks on the toast close button", () => {
    const onTopToastCancel = jest.fn()

    shallow(
      <App
        tasksHaveNextPage={false}
        tasksHaveError={true}
        onLoadNextPage={() => {}}
        onTopToastCancel={onTopToastCancel}
        tasks={[]}
        topToast={{ message: "foo", buttonText: "bar", useSpinner: false }}
      />
    )
      .find(".App-topToastClose")
      .simulate("click")

    expect(onTopToastCancel).toBeCalledWith()
  })

  it("handles clicks on the toast action", () => {
    const onTopToastAction = jest.fn()

    shallow(
      <App
        tasksHaveNextPage={false}
        tasksHaveError={true}
        onLoadNextPage={() => {}}
        onTopToastAction={onTopToastAction}
        tasks={[]}
        topToast={{ message: "foo", buttonText: "bar", useSpinner: false }}
      />
    )
      .find(".App-topToastAction")
      .simulate("click")

    expect(onTopToastAction).toBeCalledWith()
  })
})
