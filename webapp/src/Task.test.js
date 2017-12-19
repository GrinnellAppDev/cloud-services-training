import React from "react"
import { Task } from "./Task"
import { shallow } from "enzyme"

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
