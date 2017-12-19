import React from "react"
import { Task } from "./Task"
import { shallow } from "enzyme"

describe("Task", () => {
  it("handles checkbox click", () => {
    const onIsCompleteChange = jest.fn()
    const incompleteWrapper = shallow(
      <Task isComplete={false} onIsCompleteChange={onIsCompleteChange}>
        foo
      </Task>
    )
    const completeWrapper = shallow(
      <Task isComplete={true} onIsCompleteChange={onIsCompleteChange}>
        foo
      </Task>
    )

    incompleteWrapper.find(".Task-checkbox").simulate("click")
    expect(onIsCompleteChange).toBeCalledWith(true)

    completeWrapper.find(".Task-checkbox").simulate("click")
    expect(onIsCompleteChange).toBeCalledWith(false)
  })

  it("checkbox reflects isComplete prop", () => {
    expect(
      shallow(
        <Task isComplete={true} onIsCompleteChange={() => {}}>
          foo
        </Task>
      )
        .find(".Task-checkbox")
        .prop("checked")
    ).toBe(true)
    expect(
      shallow(
        <Task isComplete={false} onIsCompleteChange={() => {}}>
          foo
        </Task>
      )
        .find(".Task-checkbox")
        .prop("checked")
    ).toBe(false)
  })

  it("displays its text", () => {
    expect(
      shallow(
        <Task isComplete={false} onIsCompleteChange={() => {}}>
          foo
        </Task>
      )
        .find(".Task-text")
        .contains("foo")
    ).toBe(true)
  })
})
