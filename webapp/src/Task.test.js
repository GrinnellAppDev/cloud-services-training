import React from "react"
import { Task } from "./Task"
import { shallow } from "enzyme"

describe("Task", () => {
  it("handles checkbox click", () => {
    const onIsCompleteToggled = jest.fn()
    const wrapper = shallow(
      <Task
        isComplete={false}
        text="foo"
        onIsCompleteToggled={onIsCompleteToggled}
      />
    )
    wrapper.find(".Task-checkbox").simulate("click")
    expect(onIsCompleteToggled).toBeCalled()
  })

  it("checkbox reflects isComplete prop", () => {
    expect(
      shallow(
        <Task isComplete={true} text="foo" onIsCompleteToggled={() => {}} />
      )
        .find(".Task-checkbox")
        .prop("checked")
    ).toBe(true)
    expect(
      shallow(
        <Task isComplete={false} text="foo" onIsCompleteToggled={() => {}} />
      )
        .find(".Task-checkbox")
        .prop("checked")
    ).toBe(false)
  })

  it("displays its text", () => {
    expect(
      shallow(
        <Task isComplete={false} text="foo" onIsCompleteToggled={() => {}} />
      )
        .find(".Task-text")
        .contains("foo")
    ).toBe(true)
  })
})
