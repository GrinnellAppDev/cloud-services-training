import React from "react"
import { shallow } from "enzyme"
import App from "./App"
import { EditableTask } from "./EditableTask"

describe("App", () => {
  it("renders a single incomplete task", () => {
    const wrapper = shallow(
      <App tasks={[{ _id: "a", isComplete: false, text: "foo" }]} />
    )
    const firstTask = wrapper
      .find(".App-taskList")
      .childAt(0)
      .find(EditableTask)

    expect(wrapper.find(".App-taskList").children()).toHaveLength(1)
    expect(firstTask.prop("text")).toBe("foo")
    expect(firstTask.prop("isComplete")).toBe(false)
  })

  it("renders a single complete task", () => {
    const wrapper = shallow(
      <App tasks={[{ _id: "a", isComplete: true, text: "bar" }]} />
    )
    const firstTask = wrapper
      .find(".App-taskList")
      .childAt(0)
      .find(EditableTask)

    expect(wrapper.find(".App-taskList").children()).toHaveLength(1)
    expect(firstTask.prop("text")).toBe("bar")
    expect(firstTask.prop("isComplete")).toBe(true)
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
        .find(EditableTask)
        .prop("text")
    ).toBe("foo")
    expect(
      children
        .at(1)
        .find(EditableTask)
        .prop("text")
    ).toBe("bar")
    expect(
      children
        .at(2)
        .find(EditableTask)
        .prop("text")
    ).toBe("baz")
  })
})
