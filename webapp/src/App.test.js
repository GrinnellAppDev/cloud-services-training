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
} from "./store"
import { isTempTaskId } from "./util"

describe("withEnhancers", () => {
  const createMockStore = configureMockStore()

  it("loads an empty task list from the store", () => {
    const store = createMockStore({
      newTask: {
        text: ""
      },
      tasks: {
        items: {}
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

  it("signals that there are more tasks if there is a nextPageToken", () => {
    const store = createMockStore({
      newTask: {
        text: ""
      },
      tasks: {
        items: {},
        nextPageToken: "abc"
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
    expect(Component.mock.calls[0][0].hasNextPage).toBe(true)
  })

  it("signals that there are no more tasks if next page token is null", () => {
    const store = createMockStore({
      newTask: {
        text: ""
      },
      tasks: {
        items: {},
        nextPageToken: null
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
    expect(Component.mock.calls[0][0].hasNextPage).toBe(false)
  })

  it("signals that there are more tasks if tasks are unloaded regardless of nextPageToken", () => {
    const store = createMockStore({
      newTask: {
        text: ""
      },
      tasks: {
        status: "UNLOADED",
        items: {},
        nextPageToken: null
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
    expect(Component.mock.calls[0][0].hasNextPage).toBe(true)
  })

  it("dispatches an edit action onNewTaskTextChange", () => {
    const store = createMockStore({
      newTask: {
        text: ""
      },
      tasks: {
        items: {}
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
})

describe("App", () => {
  it("displays a title for the refresh button", () => {
    expect(
      shallow(
        <App
          hasNextPage={false}
          onLoadNextPage={() => {}}
          tasks={[]}
          newTaskText=""
        />
      )
        .find(".App-refresh")
        .prop("title")
    ).toBe("Refresh")
  })

  it("renders a single task", () => {
    const taskListWrapper = shallow(
      <App
        hasNextPage={false}
        onLoadNextPage={() => {}}
        tasks={[{ _id: "a", isComplete: false, text: "foo" }]}
      />
    ).find(".App-taskList")
    const firstTask = taskListWrapper.childAt(0).find(Task)

    expect(taskListWrapper.children()).toHaveLength(1)
    expect(firstTask.prop("id")).toBe("a")
  })

  it("renders a few tasks in order", () => {
    const tasksWrapper = shallow(
      <App
        hasNextPage={false}
        onLoadNextPage={() => {}}
        tasks={[
          { _id: "a", isComplete: false, text: "foo" },
          { _id: "b", isComplete: true, text: "bar" },
          { _id: "c", isComplete: false, text: "baz" }
        ]}
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
          hasNextPage={false}
          onLoadNextPage={() => {}}
          tasks={[]}
          newTaskText="foo"
        />
      )
        .find(".App-addTask")
        .prop("value")
    ).toBe("foo")
  })

  it("signals changes to the new task", () => {
    const onNewTaskTextChange = jest.fn()

    shallow(
      <App
        hasNextPage={false}
        onLoadNextPage={() => {}}
        tasks={[]}
        newTaskText="foo"
        onNewTaskTextChange={onNewTaskTextChange}
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
        hasNextPage={false}
        onLoadNextPage={() => {}}
        tasks={[]}
        newTaskText="foo"
        onNewTaskSubmit={onNewTaskSubmit}
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
        hasNextPage={false}
        onLoadNextPage={() => {}}
        tasks={[]}
        onRefresh={onRefresh}
      />
    )
      .find(".App-refresh")
      .simulate("click")

    expect(onRefresh).toBeCalledWith()
  })
})
