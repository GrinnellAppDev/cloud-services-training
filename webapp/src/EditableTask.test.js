import React from "react"
import { shallow } from "enzyme"
import { EditableTask } from "./EditableTask"

describe("EditableTask", () => {
  it("is just a regular task when editing not set", () => {
    expect(
      shallow(
        <EditableTask
          isEditing={false}
          text="foo"
          isComplete={false}
          onIsEditingChange={() => {}}
          onTextChange={() => {}}
          onIsCompleteChange={() => {}}
        />
      ).contains("foo")
    ).toBe(true)
  })

  it("renders an input when editing is set", () => {
    expect(
      shallow(
        <EditableTask
          isEditing={true}
          text="foo"
          isComplete={false}
          onIsEditingChange={() => {}}
          onTextChange={() => {}}
          onIsCompleteChange={() => {}}
        />
      )
        .find("input")
        .exists()
    ).toBe(true)
  })

  it("switches into edit mode when the text is clicked", () => {
    const onIsEditingChange = jest.fn()
    const wrapper = shallow(
      <EditableTask
        isEditing={false}
        text="foo"
        isComplete={false}
        onIsCompleteChange={() => {}}
        onTextChange={() => {}}
        onIsEditingChange={onIsEditingChange}
      />
    )

    wrapper.find(".EditableTask-displayText").simulate("click")
    expect(onIsEditingChange).toBeCalledWith(true)
  })

  it("switches out of edit mode when the input is blurred", () => {
    const onIsEditingChange = jest.fn()
    const wrapper = shallow(
      <EditableTask
        isEditing={true}
        text="foo"
        isComplete={false}
        onIsCompleteChange={() => {}}
        onTextChange={() => {}}
        onIsEditingChange={onIsEditingChange}
      />
    )

    wrapper.find(".EditableTask-editableText").simulate("blur")
    expect(onIsEditingChange).toBeCalledWith(false)
  })

  it("responds to text changes", () => {
    const onTextChange = jest.fn()
    const wrapper = shallow(
      <EditableTask
        isEditing={true}
        text="foo"
        isComplete={false}
        onIsEditingChange={() => {}}
        onTextChange={onTextChange}
        onIsCompleteChange={() => {}}
      />
    )

    wrapper.find(".EditableTask-editableText").simulate("change", {
      currentTarget: {
        value: "foot"
      }
    })
    expect(onTextChange).toBeCalledWith("foot")
  })
})
