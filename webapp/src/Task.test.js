import React from "react"
import { Task, withEnhancers } from "./Task"
import { shallow } from "enzyme"
import configureMockStore from "redux-mock-store"
import { Provider } from "react-redux"
import { render } from "react-dom"
import { editTask } from "./store"

describe("withEnhancers", () => {
  const createMockStore = configureMockStore()

  it("pulls data from state", () => {
    const store = createMockStore({
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
        <Wrapped id="a" />
      </Provider>,
      document.createElement("div")
    )

    expect(Component.mock.calls).toHaveLength(1)
    expect(Component.mock.calls[0][0].isComplete).toBe(false)
    expect(Component.mock.calls[0][0].text).toBe("foo")
  })

  it("sends edit actions", () => {
    const store = createMockStore({
      tasks: {
        items: {
          a: { _id: "a", isComplete: false, text: "foo" }
        }
      }
    })

    const Component = jest.fn().mockImplementation(props => {
      props.onIsCompleteChange(true)
      props.onTextChange("bar")
      return <div />
    })
    const Wrapped = withEnhancers(Component)

    render(
      <Provider store={store}>
        <Wrapped id="a" />
      </Provider>,
      document.createElement("div")
    )

    expect(Component).toBeCalled()
    expect(store.getActions()).toEqual([
      editTask("a", { isComplete: true }),
      editTask("a", { text: "bar" })
    ])
  })
})

describe("Task", () => {
  it("handles checkbox click", () => {
    const onIsCompleteChange = jest.fn()
    const incompleteWrapper = shallow(
      <Task
        isComplete={false}
        text="foo"
        onIsCompleteChange={onIsCompleteChange}
        onTextChange={() => {}}
      />
    )
    const completeWrapper = shallow(
      <Task
        isComplete={true}
        text="foo"
        onIsCompleteChange={onIsCompleteChange}
        onTextChange={() => {}}
      />
    )

    incompleteWrapper.find(".Task-checkbox").simulate("click")
    expect(onIsCompleteChange).toBeCalledWith(true)

    completeWrapper.find(".Task-checkbox").simulate("click")
    expect(onIsCompleteChange).toBeCalledWith(false)
  })

  it("checkbox reflects isComplete prop", () => {
    expect(
      shallow(
        <Task
          isComplete={true}
          text="foo"
          onIsCompleteChange={() => {}}
          onTextChange={() => {}}
        />
      )
        .find(".Task-checkbox")
        .prop("checked")
    ).toBe(true)
    expect(
      shallow(
        <Task
          isComplete={false}
          text="foo"
          onIsCompleteChange={() => {}}
          onTextChange={() => {}}
        />
      )
        .find(".Task-checkbox")
        .prop("checked")
    ).toBe(false)
  })

  it("displays its text", () => {
    expect(
      shallow(
        <Task
          isComplete={false}
          text="foo"
          onIsCompleteChange={() => {}}
          onTextChange={() => {}}
        />
      )
        .find(".Task-text")
        .prop("value")
    ).toBe("foo")
  })

  it("sends out text change events", () => {
    const onTextChange = jest.fn()
    const wrapper = shallow(
      <Task
        text="foo"
        isComplete={false}
        onTextChange={onTextChange}
        onIsCompleteChange={() => {}}
      />
    )

    wrapper.find(".Task-text").simulate("change", {
      currentTarget: {
        value: "foot"
      }
    })
    expect(onTextChange).toBeCalledWith("foot")
  })
})
