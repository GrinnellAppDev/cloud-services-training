import React from "react"
import { render } from "react-dom"
import { shallow } from "enzyme"
import { App, withEnhancers } from "./App"
import Task from "./Task"
import configureMockStore from "redux-mock-store"
import { Provider } from "react-redux"
import { editNewTaskText } from "./store"

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
})

describe("App", () => {
  it("renders a single task", () => {
    const wrapper = shallow(
      <App tasks={[{ _id: "a", isComplete: false, text: "foo" }]} />
    )
    const firstTask = wrapper
      .find(".App-taskList")
      .childAt(0)
      .find(Task)

    expect(wrapper.find(".App-taskList").children()).toHaveLength(1)
    expect(firstTask.prop("id")).toBe("a")
  })

  it("renders a few tasks in order", () => {
    const wrapper = shallow(
      <App
        tasks={[
          { _id: "a", isComplete: false, text: "foo" },
          { _id: "b", isComplete: true, text: "bar" },
          { _id: "c", isComplete: false, text: "baz" }
        ]}
      />
    )
    const children = wrapper.find(".App-taskList").children()

    expect(children).toHaveLength(3)
    expect(
      children
        .at(0)
        .find(Task)
        .prop("id")
    ).toBe("a")
    expect(
      children
        .at(1)
        .find(Task)
        .prop("id")
    ).toBe("b")
    expect(
      children
        .at(2)
        .find(Task)
        .prop("id")
    ).toBe("c")
  })

  it("displays changes to the new task", () => {
    expect(
      shallow(<App tasks={[]} newTaskText="foo" />)
        .find(".App-addTask")
        .prop("value")
    ).toBe("foo")
  })

  it("signals changes to the new task", () => {
    const onNewTaskTextChange = jest.fn()
    const wrapper = shallow(
      <App
        tasks={[]}
        newTaskText="foo"
        onNewTaskTextChange={onNewTaskTextChange}
      />
    )

    wrapper
      .find(".App-addTask")
      .simulate("change", { currentTarget: { value: "foot" } })

    expect(onNewTaskTextChange).toBeCalledWith("foot")
  })
})
